// ============================================================
// 智谱(北京智源 / 大模型)glm-4-flash 客户端
// ============================================================
// 两个能力:
//   1. reviewEssay()  —— 考研英语二图表大作文 4 维批改(满分 15)
//   2. lookupWord()   —— 鼠标 hover 查单词(词性+中文释义+搭配)
//
// 配置优先级:
//   传参 customCfg > /settings 里 localStorage 保存的 AiConfig > 内置默认 Key(用户提供的 glm-4-flash 免费额度)
// ============================================================
import type { ZhipuEssayReview, WordDefinition } from '@/types';
import { db } from '@/lib/db';
import { loadAiConfig } from './client';

export const ZHIPU_DEFAULT = {
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: '45e3d81265d0432d9e8f50bf9abcb7e5.CAzPHavbPxQ488FG',
  model: 'glm-4-flash',
} as const;

export interface ZhipuCfg {
  baseURL?: string;
  apiKey?: string;
  model?: string;
}

/** 解析有效配置(三档优先级),缺少字段用默认补齐 */
export function resolveCfg(overrides?: ZhipuCfg): Required<ZhipuCfg> {
  const stored = loadAiConfig();
  const baseURL =
    overrides?.baseURL || stored?.baseURL || ZHIPU_DEFAULT.baseURL;
  const apiKey =
    overrides?.apiKey || stored?.apiKey || ZHIPU_DEFAULT.apiKey;
  const model =
    overrides?.model || stored?.model || ZHIPU_DEFAULT.model;
  return {
    baseURL: baseURL.replace(/\/$/, ''),
    apiKey,
    model,
  };
}

// ---------- 低层级:调用 chat/completions 并解析 JSON ----------
async function chatJson<T>(
  system: string,
  user: string,
  overrides?: ZhipuCfg,
  temperature = 0.2,
): Promise<T> {
  const cfg = resolveCfg(overrides);
  const resp = await fetch(`${cfg.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`[智谱 ${resp.status}] ${text || resp.statusText}`);
  }
  const json = await resp.json();
  const content: string = json?.choices?.[0]?.message?.content ?? '{}';
  // 兼容模型把 JSON 包在 ```json ... ``` 里返回的情况
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const raw = fenced ? fenced[1] : content;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    // 再兜底:截取第一个 { 到 最后一个 }
    const s = raw.indexOf('{');
    const e2 = raw.lastIndexOf('}');
    if (s >= 0 && e2 > s) {
      return JSON.parse(raw.slice(s, e2 + 1)) as T;
    }
    throw new Error('模型返回的 JSON 解析失败:\n' + raw);
  }
}

// ---------- 1. 作文批改 ----------
const ESSAY_SYSTEM = `你是一名严格的考研英语二（专硕）官方阅卷组专家。
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
  "dataFeedback": "指明数据提取的优缺点",
  "logicFeedback": "论证逻辑分析评价",
  "corrections": [
    {
      "original": "考生写得平淡或有语病的原句",
      "improved": "考研高分地道替换表达",
      "reason": "修改提分理由"
    }
  ],
  "summary": "一句话总体点评与升华建议"
}`;

export async function reviewEssay(
  chartInfo: string,
  userEssay: string,
  overrides?: ZhipuCfg,
): Promise<ZhipuEssayReview> {
  if (!userEssay || userEssay.trim().length < 20) {
    throw new Error('作文字数过少,请先写一段再批改');
  }
  const user = `【当前图表数据特征】：\n${chartInfo}\n\n【考生提交作文】：\n${userEssay}`;
  return chatJson<ZhipuEssayReview>(ESSAY_SYSTEM, user, overrides, 0.2);
}

// ---------- 2. 单词释义(带 Dexie 缓存) ----------
const WORD_SYSTEM = `你是一本考研英语二词典。请根据用户给出的单词以及上下文(如果提供),输出严格的 JSON。
要求:
  - word:原词小写形式
  - phonetic:音标,可省略
  - senses:多个义项,每项格式"[词性] 中文释义 / 常用搭配(若有)",例如["v. 持续;维持 / ~ efforts 持续努力","adj. 可持续的"]。义项排列要贴合考研语境,最多 4 条,不要写长句。
  - collocations:2~4 个常见搭配或短语,数组,无则空数组

只返回 JSON,不要任何 Markdown 或解释。示例:
{"word":"sustainability","phonetic":"/səˌsteɪnəˈbɪləti/","senses":["n. 可持续性;永续性 / environmental ~ 环境可持续性","n. (经济学) 承受能力;长期发展能力"],"collocations":["sustainability-oriented values","environmental sustainability","long-term sustainability"]}`;

/** 归一化:小写、去前后标点(保留单词中间的连字符/撇号) */
export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/^[^a-z0-9'-]+/, '')
    .replace(/[^a-z0-9'-]+$/, '')
    .trim();
}

export async function lookupWord(
  word: string,
  context?: string,
  overrides?: ZhipuCfg,
): Promise<WordDefinition> {
  const key = normalizeWord(word);
  if (!key) throw new Error('单词为空');

  // 1) Dexie 缓存命中:更新 accessedAt 直接返回
  const cached = await db.words.get(key);
  if (cached) {
    const accessedAt = new Date();
    await db.words.update(key, { accessedAt });
    return { ...cached, accessedAt };
  }

  // 2) 过长(>40 字符)、含数字或非常短(单字符)不查,直接给占位(不浪费 token)
  if (key.length > 40 || /\d/.test(key) || key.length < 2) {
    const empty: WordDefinition = {
      word: key,
      senses: [key.length < 2 ? '(词组或缩写,请结合上下文理解)' : '(非常规词形)'],
      createdAt: new Date(),
      accessedAt: new Date(),
    };
    await db.words.put(empty).catch(() => {});
    return empty;
  }

  const userMsg = context
    ? `单词：${key}\n上下文：${context.slice(0, 300)}`
    : `单词：${key}`;

  const data = await chatJson<{
    word?: string;
    phonetic?: string;
    senses?: string[];
    collocations?: string[];
  }>(WORD_SYSTEM, userMsg, overrides, 0.15);

  const senses =
    Array.isArray(data.senses) && data.senses.length > 0
      ? data.senses.filter((s) => typeof s === 'string' && s.length > 0).slice(0, 6)
      : ['(暂无释义)'];

  const now = new Date();
  const def: WordDefinition = {
    word: key,
    phonetic: data.phonetic,
    senses,
    collocations:
      Array.isArray(data.collocations) && data.collocations.length > 0
        ? (data.collocations as string[]).filter((s) => typeof s === 'string' && s.length > 0).slice(0, 5)
        : undefined,
    createdAt: now,
    accessedAt: now,
  };

  // 缓存落库(失败不阻塞返回)
  db.words.put(def).catch(() => {});
  // 简单 LRU:超过 5000 条,按 accessedAt 最旧删除 200 条
  db.words.count().then((n) => {
    if (n <= 5000) return;
    db.words
      .orderBy('accessedAt')
      .limit(200)
      .primaryKeys()
      .then((keys) => db.words.bulkDelete(keys))
      .catch(() => {});
  });

  return def;
}
