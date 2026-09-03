"""
AI Provider SDK 统一封装层, 被 writing/vocab 调用。

- 支持多模型商:智谱 / DeepSeek / Moonshot / 任意 OpenAI 兼容协议
- 按「用户级 profile.ai_* 优先 → settings.GLOBAL_AI_* 兜底」解析生效配置
- 作文批改 + 单词释义 lookup + 翻译润色 3 个方法
- 所有 HTTP 调用走 httpx(异步 / 超时 30s / 自动重试 1 次)
"""
from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Any

import httpx

logger = logging.getLogger(__name__)


# ------------------------ 对外数据结构 ------------------------
@dataclass
class ReviewResult:
    total_score: float
    s_data: float
    s_logic: float
    s_vocab: float
    s_grammar: float
    data_feedback: str
    logic_feedback: str
    summary: str
    corrections: list[dict]
    base_url: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    error_message: str = ''


@dataclass
class LookupResult:
    lemma: str
    phonetic: str
    senses: list[dict]
    collocations: list[str]
    from_cache: bool = False


@dataclass
class AIConfig:
    base_url: str
    api_key: str
    model: str


# ------------------------ 获取配置 ------------------------
def resolve_config(device=None) -> AIConfig:
    """
    解析 AI 配置:
      1. 设备(device) 如果三个字段都填或部分填 → 填了用设备的,空了回退全局
      2. 全局 settings.GLOBAL_AI_*
    最终 api_key 可能为空字符串,调用方要判断并抛 400。
    """
    from django.conf import settings as dj_settings

    base_url = dj_settings.GLOBAL_AI_BASE_URL
    api_key = dj_settings.GLOBAL_AI_API_KEY
    model = dj_settings.GLOBAL_AI_MODEL

    if device:
        base_url = (device.ai_base_url or base_url).rstrip('/') or base_url
        api_key = device.ai_api_key or api_key
        model = device.ai_model or model

    return AIConfig(base_url=base_url.rstrip('/'), api_key=api_key, model=model)


# ------------------------ 内部 HTTP 调用 ------------------------
_JSON_RE = re.compile(r'\{[\s\S]*\}')


def _extract_first_json(text: str) -> dict:
    """Chat completion 模型常常会把 JSON 包在 ```json ...``` 里,先剥再解析。"""
    if not text:
        return {}
    m = _JSON_RE.search(text)
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}


def _call_chat(messages: list[dict], system: str | None, user_content: str, cfg: AIConfig,
               temperature: float = 0.2, max_retries: int = 2) -> tuple[str, dict]:
    payload_messages = []
    if system:
        payload_messages.append({'role': 'system', 'content': system})
    payload_messages.extend(messages or [])
    if user_content:
        payload_messages.append({'role': 'user', 'content': user_content})

    last_err: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            with httpx.Client(timeout=httpx.Timeout(35.0, connect=8.0)) as cli:
                resp = cli.post(
                    cfg.base_url + '/chat/completions',
                    headers={
                        'Authorization': f'Bearer {cfg.api_key}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'model': cfg.model,
                        'temperature': temperature,
                        'messages': payload_messages,
                    },
                )
                if resp.status_code >= 400:
                    raise RuntimeError(f'AI provider HTTP {resp.status_code}: {resp.text[:200]}')
                data = resp.json()
                choices = data.get('choices') or []
                if not choices:
                    raise RuntimeError(f'AI 返回 choices 为空: {data}')
                message = choices[0].get('message') or {}
                content = (message.get('content') or '').strip()
                usage = (data.get('usage') or {}) if isinstance(data, dict) else {}
                return content, {
                    'prompt_tokens': usage.get('prompt_tokens', 0),
                    'completion_tokens': usage.get('completion_tokens', 0),
                }
        except Exception as exc:  # pragma: no cover - 运行时
            last_err = exc
            logger.warning('AI call attempt %d failed: %s', attempt, exc)
            time.sleep(0.8)
    raise RuntimeError(f'AI provider 多次调用失败: {last_err}')


# ------------------------ 业务方法 ------------------------
ESSAY_SYSTEM_PROMPT = '''你是一名严格的考研英语二（专硕）官方阅卷组专家。
请根据以下考纲 4 大维度对考生的图表大作文进行深度批改（满分 15 分）：
1. 【数据完整度】(4分)：是否准确抓取了图表中的极值（最大/最小值）、主体对比和总体趋势；
2. 【归因论述逻辑】(4分)：第二段的原因分析是否切题自洽，逻辑连接词使用是否合理；
3. 【词汇与句式丰富度】(4分)：是否使用了图表专用表达（如占比、增减趋势）及高阶句型；
4. 【语法与拼写】(3分)：句式是否严谨，有无基础语法/拼写/标点错误。

请严格输出如下 JSON 格式（不要输出任何多余的 Markdown 标记或问候语）：
{
  "totalScore": 12.5,
  "scores": {
    "data": 3.5,
    "logic": 3.5,
    "vocab": 3.0,
    "grammar": 2.5
  },
  "dataFeedback": "指明数据提取的优缺点...",
  "logicFeedback": "论证逻辑分析评价...",
  "corrections": [
    {
      "original": "考生写得平淡或有语病的原句",
      "improved": "考研高分地道替换表达",
      "reason": "修改提分理由"
    }
  ],
  "summary": "一句话总体点评与升华建议"
}'''


def review_essay(user, chart_info: str, user_essay: str) -> ReviewResult:
    cfg = resolve_config(user)
    if not cfg.api_key:
        raise RuntimeError('当前没有可用的 AI Key。请在「设置」中填入自己的 Key,或联系管理员配置全局 AI。')

    user_content = f'【当前图表数据特征】：\n{chart_info or "未提供图表背景,请根据作文自身通用打分。"}\n\n【考生提交作文】：\n{user_essay}'
    try:
        content, usage = _call_chat([], ESSAY_SYSTEM_PROMPT, user_content, cfg, temperature=0.2)
        data = _extract_first_json(content)
        if not data:
            raise RuntimeError('AI 返回非 JSON 格式,请稍后重试。')
        scores = data.get('scores') or {}
        return ReviewResult(
            total_score=float(data.get('totalScore') or 0),
            s_data=float(scores.get('data') or 0),
            s_logic=float(scores.get('logic') or 0),
            s_vocab=float(scores.get('vocab') or 0),
            s_grammar=float(scores.get('grammar') or 0),
            data_feedback=(data.get('dataFeedback') or '').strip(),
            logic_feedback=(data.get('logicFeedback') or '').strip(),
            summary=(data.get('summary') or '').strip(),
            corrections=list(data.get('corrections') or []),
            base_url=cfg.base_url,
            model=cfg.model,
            prompt_tokens=int(usage.get('prompt_tokens') or 0),
            completion_tokens=int(usage.get('completion_tokens') or 0),
        )
    except Exception as exc:
        return ReviewResult(
            0.0, 0.0, 0.0, 0.0, 0.0,
            data_feedback='', logic_feedback='', summary='', corrections=[],
            base_url=cfg.base_url, model=cfg.model, error_message=str(exc),
        )


WORD_LOOKUP_PROMPT = '''你是考研英语二词典助手。只返回 JSON,不要额外文字:
{
  "word": "exercise",
  "phonetic": "/ˈeksəsaɪz/",
  "senses": [{"pos": "n.", "definition": "锻炼,运动"}, {"pos": "v.", "definition": "行使(权利)"}],
  "collocations": ["do exercise", "take exercise"]
}
- pos 用常见缩写 n./v./adj./adv./prep./conj.
- senses 最多 4 条,2~3 条最佳
- collocations 最多 4 条,空则返回空数组
- 结合上下文消歧(上下文是考研真题场景的句子)'''


def lookup_word(user, word: str, context: str = '') -> LookupResult:
    """先未命中才 AI,命中直接返回(调用方负责 Word 缓存写入)。"""
    # lemma 归一化: 小写 + 去首尾非字母,长度保护
    lemma = (word or '').strip().lower().strip("'\"-,.!?;:()[]{}")
    if len(lemma) < 2 or len(lemma) > 64:
        raise ValueError('单词长度不合法')
    cfg = resolve_config(user)
    if not cfg.api_key:
        raise RuntimeError('当前没有可用的 AI Key。请在「设置」中填入自己的 Key,或联系管理员配置全局 AI。')

    user_content = f'单词: {lemma}' + (f'\n上下文(用于消歧):\n{context[:200]}' if context else '')
    content, _ = _call_chat([], WORD_LOOKUP_PROMPT, user_content, cfg, temperature=0.15)
    data = _extract_first_json(content)
    if not data:
        raise RuntimeError('AI 返回的释义 JSON 无法解析')
    return LookupResult(
        lemma=(data.get('word') or lemma),
        phonetic=(data.get('phonetic') or ''),
        senses=list(data.get('senses') or [])[:4],
        collocations=list(data.get('collocations') or [])[:4],
    )


TRANSLATION_SYSTEM_PROMPT = '''你是专业的考研英语文章翻译专家。
请将用户提供的英文文章逐段翻译成中文。
要求：
1. 准确翻译考研英语文章的学术表达和固定搭配
2. 保持中文通顺自然，符合中文阅读习惯
3. 严格按照段落顺序，逐段对应翻译，只输出翻译内容
4. **不要输出`[段落 1]`这样的标记，也不要输出原文**，只输出中文翻译
5. 每个段落翻译完成后，用三个竖线`|||`分隔，便于程序解析
6. 只输出翻译，不要任何额外文字、解释或标记

格式要求：
翻译1|||翻译2|||翻译3|||...
'''


def translate_paragraphs(user, paragraphs: list[str]) -> list[str]:
    """调用 AI 逐段翻译英文文章，返回翻译结果列表，顺序与输入一致。"""
    cfg = resolve_config(user)
    if not cfg.api_key:
        raise RuntimeError('当前没有可用的 AI Key。请在「设置」中填入自己的 Key,或联系管理员配置全局 AI。')
    
    # 提示去掉，只告诉 AI 我们要结果，不要标记
    user_content = "请逐段翻译以下英文，只输出翻译，段落之间用 ||| 分隔，不要任何标记：\n\n"
    for i, para in enumerate(paragraphs, 1):
        user_content += f"---\n段落{i}:\n{para}\n"
    
    content, _ = _call_chat([], TRANSLATION_SYSTEM_PROMPT, user_content, cfg, temperature=0.3)
    
    # 按 ||| 分割
    parts = [p.strip() for p in content.split('|||') if p.strip()]
    # 去掉任何残留的 "段落 N:", "[段落 N]" 标记
    parts = [re.sub(r'^(\[[^\]]*\]\s*|段落\s*\d+\s*[:：]\s*)', '', p) for p in parts]
    # 如果分割后数量不对，尝试按换行分割 fallback
    if len(parts) < len(paragraphs):
        parts = [p.strip() for p in content.split('\n') if p.strip()]
        parts = [re.sub(r'^(\[[^\]]*\]\s*|段落\s*\d+\s*[:：]\s*)', '', p) for p in parts]
    
    # 取前 N 个翻译（N = 输入段落数）
    results = parts[:len(paragraphs)]
    # 去掉空行，合并换行
    results = [r.replace('\n', ' ').strip() for r in results]
    # 如果不够，补空字符串
    while len(results) < len(paragraphs):
        results.append('')
    
    return results
