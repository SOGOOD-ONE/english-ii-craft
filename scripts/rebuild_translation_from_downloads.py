# -*- coding: utf-8 -*-
"""
从用户 C:/Users/19536/Downloads 里的 PDF「考研英语二XXXX年英译汉（段落翻译）真题.pdf」
重新抽取 translation 数据,覆盖 content/translation/YYYY.json:
  - 去掉 Directions/Section III/(xx points)/Write your translation 等废话
  - 自动把英文原文(refZh=空)和中文参考译文(包含中文)按段落区分
  - 句子切片(按 ./!/? + 换行分号分句)
  - 保留旧 JSON 里已有的 points/pitfalls/slices[*].(points|pitfalls|refZh)

用法:
  python scripts/rebuild_translation_from_downloads.py
"""
from __future__ import annotations

import glob
import json
import os
import re
from typing import Dict, List, Tuple

import pdfplumber

DOWNLOAD_DIR = r"C:\Users\19536\Downloads"
CONTENT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "content", "translation")
)

# ---------------- 清洗规则 ----------------
# 整行(或整段)命中即剔除
DROP_PATTERNS = [
    r"^\s*Section\s*III\b",
    r"^\s*Part\s*C\b",
    r"^\s*Directions\s*[:：]?",
    r"^\s*Translate\b",
    r"^\s*Write\s+your\s+translation\b",
    r"^\s*on\s+the\s+ANSWER\s+SHEET",
    r"^\s*ANSWER\s+SHEET",
    r"^\s*\(\s*\d+\s*points?\s*\)\s*$",
    r"^\s*（\s*\d+\s*分?\s*）\s*$",
    r"^\s*英译?汉\s*$",
    r"^\s*考研英语二",
    r"^\s*参考译文\s*[:：]?",
    r"^\s*译文\s*[:：]?",
    r"^\s*原文\s*[:：]?",
    r"^\s*答案\s*[:：]?",
    r"^\s*第\s*\d+\s*页\b",
    r"^\s*Page\s*\d+\b",
    r"^\s*-+\s*\d+\s*-+\s*$",
    r"^\s*\d+\s*$",
]
DROP_RE = re.compile("|".join(DROP_PATTERNS), flags=re.IGNORECASE)

# 把"Directions: ... (15 points)" 这类包含废话的小段整体切掉的模式
SECTION_HEADER_RE = re.compile(
    r"(Section\s*III|Part\s*C).{0,120}?(Translate|Write\s+your\s+translation).{0,200}?"
    r"(ANSWER\s+SHEET|\(\s*\d+\s*points?\s*\)|（\s*\d+\s*分?\s*）)",
    flags=re.IGNORECASE | re.DOTALL,
)


def extract_text(pdf_path: str) -> str:
    texts: List[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            texts.append(t)
    text = "\n".join(texts)
    # 去掉页眉/页脚中混入的 "Section III Directions ... (15 points)" 超长说明段
    text = SECTION_HEADER_RE.sub("\n", text)
    return text


def split_paragraphs(text: str) -> List[str]:
    # 先按双换行切段,单换行保留
    raw = re.split(r"\n\s*\n", text)
    out: List[str] = []
    for para in raw:
        # 段落内行折叠:单换行变空格(英文),中文保留换行
        lines = [ln.strip() for ln in para.splitlines() if ln.strip()]
        if not lines:
            continue
        # 过滤整段就是 Directions/页脚 的段落
        joined = " ".join(lines)
        if DROP_RE.match(joined):
            continue
        # 逐行过滤(去掉单行的 Directions 废话)
        filtered = [ln for ln in lines if not DROP_RE.match(ln)]
        if not filtered:
            continue
        # 如果段落里主要英文:空格拼接;主要中文:直接连(中文 PDF 换行处一般是换行断行)
        joined_cn = "".join(filtered)
        cn_count = sum(1 for ch in joined_cn if "\u4e00" <= ch <= "\u9fff")
        if cn_count >= 5:
            out.append(joined_cn)
        else:
            out.append(" ".join(filtered))
    return out


def has_chinese(s: str) -> bool:
    return any("\u4e00" <= ch <= "\u9fff" for ch in s)


# 扫描版 PDF 常见换行处"连写词"还原(末尾字母 + 下一行首字母被粘在一起)。
# 模式: 前一个小词(无空格) 紧接着一个常见开头词 -> 中间加空格。
# 先枚举最高频的连写组合;对无法枚举的,再用 "字母连写 + 能在字典里拆成两个词" 的启发兜底。
EN_REWRITE_TABLE = [
    # (pattern, replacement)   说明: pattern 按正则写;replacement 用空格分开
    # that + X
    (r"\bthat(people|some|the|they|even|would|will|could|can|had|have|has|is|are|do|did|does|one|may|might|must|said|say|says|show|shows|showed|include|includes|included|involve|involves)\b", r"that \1"),
    # have/has/had + X
    (r"\bhave(personal|experienced|shown|always|become|the|a|been|to|made|endured|their|his|her|an)\b", r"have \1"),
    (r"\bhas(been|become|shown|the|made|a|also|helped|led|produced|changed)\b", r"has \1"),
    (r"\bhad(been|become|the|shown|a|made|experienced|to|gone|through|signed|endured|helped)\b", r"had \1"),
    # and + X
    (r"\band(even|choice|burst|desperate|expression|reflection|other|provide|increased|topic|change|partners|connected|people|saying|signed|sustainability|then|turn|started|natural|meaning|enjoyable|strangers|avoid|likely|warmth)\b", r"and \1"),
    # of + X
    (r"\bof(sales|previous|unsustainability|awkward|connection|reflection|expression|strangers|conversation|silences|gaps|impact|frequency|change|topic|friends|insurance|action|values|concept|passion|dilemma|lack|casual)\b", r"of \1"),
    # to + X
    (r"\bto(Ted|do|go|get|be|come|take|make|know|see|find|turn|provide|express|express|say|sign|start|speak|wait|wake|stare|sell|help|avoid|talk|follow|enter|produce|change|reflect)\b", r"to \1"),
    # for + X
    (r"\bfor(reflection|expression|conversation|a|the|friends|strangers|change|moments|natural|long|short|jobs|job|sales|an|overview)\b", r"for \1"),
    # 注意:不要对 "including" 中的 "in" 切空格! 规则顺序:先修复 "in cluding" -> "including",再对 in+X 切分,所以此处直接加 "incorrect space repair"
    # with + X
    (r"\bwith(short|long|strangers|friends|the|a|an|conversation|partners|gaps|topic|people|reflection|expression|shortgaps)\b", r"with \1"),
    # is/are + X
    (r"\bis(likely|likely|so|actually|probably|the|a|an|not|just|also|about|now|true|extreme|followed|marked|considered)\b", r"is \1"),
    (r"\bare(likely|so|actually|probably|the|a|an|not|just|also|about|now|followed|marked|considered|connected)\b", r"are \1"),
    # other common: between/by/from/into/after/before/over/under/on + content
    (r"\bbetween(strangers|friends|partners|people|groups|the|a|long|short|conversations)\b", r"between \1"),
    (r"\bby(a|an|the|which|change|users|people|friends|strangers|partners|this|that)\b", r"by \1"),
    (r"\bfrom(the|their|one|previous|lazynote|dot-com|friends|strangers|outside|inside|paper|this|that|these|those|a|an|year|years|study|studies|agency|ceiling|middle|night|passion|choice|action|job|jobs|sales|lack|topic|change|overview|experience|enjoyable|awkward|stressful|moment|pause|silences|gaps|partners|friends|strangers|long|short|reflection|expression|casual)\b", r"from \1"),
    (r"\binto(a|an|the|which|lack|change|topic|sales|conversation|state|considering)\b", r"into \1"),
    (r"\bafter(a|an|the|which|long|short|change|topic|entering|following|friends|strangers|time|job|jobs|gap|gaps|silence|silences|work|year|years|study|studies)\b", r"after \1"),
    # dot-com + boom/burst 类复合词
    (r"\bdot-com(boom|burst|bubble|era|stock|shares|crash)\b", r"dot-com \1"),
    # === 2010-2025 实际抽取中出现的新连写词(基于真实数据补全) ===
    # dilemma + about / the / ...
    (r"\bdilemma(about|the|over|his|her|their|of|with|regarding)\b", r"dilemma \1"),
    # would + wake / go / come ...
    (r"\bwould(wake|goto|go|come|have|be|make|take|like|love|hate|prefer|rather|cry|sleep|talk|tell|leave|stay|stop|start|begin|continue|try|manage|fail|succeed|help|allow|permit|expect|wait|turn|change|spend|cost)\b", r"would \1"),
    # such + feelings / ...
    (r"\bsuch(feelings|people|things|moments|events|ideas|concepts|cases|issues|questions|periods|times|reactions|responses|behavior|behaviour|silences|gaps|pauses|stresses|moments|awkwardness|anxiety|stress)\b", r"such \1"),
    # increased + connection / ...
    (r"\bincreased(connection|connections|risk|risks|chance|chances|level|levels|rate|rates|demand|pressure|stress|anxiety|feeling|feelings|awareness|output|productivity|growth|sales|cost|spending)\b", r"increased \1"),
    # actually + brings 等 actually + verb
    (r"\bactually(brings|bring|brought|shows|showed|show|makes|made|make|gives|gave|give|helps|helped|help|works|worked|work|proves|proved|prove|creates|create|leads|lead|means|meant|mean|increases|increase|improves|improve|matters|matter)\b", r"actually \1"),
    # strike + up
    (r"\bstrike(up|down|out|off|on|at|against)\b", r"strike \1"),
    # "in cluding" => "including" (被 in+cluding 规则误拆开的还原)
    (r"\bin cluding\b", "including"),
    # "Chicago-are a" -> "Chicago-area";修复 area 被当作不定冠词 a 切出去的情况
    (r"-area\s+a\b", "-area"),
    (r"\bare a\s+(commuter|traveler|resident|worker|citizen|student|user|person|individual|family|friend|partner|stranger)", r"area \1"),
    # conversations,including -> conversations, including
    (r"conversations,including\b", "conversations, including"),
    # overview 被拆成 "over view" -> 还原
    (r"\bover view\b", "overview"),
    # befollowed -> be followed
    (r"\bbefollowed\b", "be followed"),
    # thatsustainability-oriented -> that sustainability-oriented
    (r"\bthat(sustainability-oriented|sustainability)\b", r"that \1"),
    # extremethat -> extreme that
    (r"\bextremethat\b", "extreme that"),
    # "andwarmth" and "laughter,andwarmth" 实际 observed:andwarmth -> and warmth(已在 and+warmth 规则中)
    # 再加 actuallybrings 已处理;fromcasual 已通过 from+casual 处理;strikeup 通过 strike+up 处理
    # 额外兜底: conversations,with -> conversations, with
    (r"conversations,with\b", "conversations, with"),
    # friends,family and 这类不需要修,保持原状
]

# 句尾标点粘连: "choice.Ning"、"agency.It"、"expression.Between" -> 加空格
PUNCT_GLUE_RE = re.compile(
    r"([a-z]['\"]?[\.\?!])([A-Z])|"
    r"([\.\?!])\"([A-Z])"
)

# 专有名词: N 大写开头但不是句子开头(例如专有名词首字母大写被当作句首导致不切)
# 切句后用,还原不在此处。

# 残留前缀: 开头 ". (15 points)" / "(15 points)" / ". (15 分)" 等
LEADING_JUNK_RE = re.compile(
    r"^\s*(?:[\.。、,，:：;；]\s*|\(\s*\d+\s*(?:points?|分)\s*\)\s*)+",
    flags=re.IGNORECASE,
)


# 尾部广告骨架:剥掉中文关键字后,URL/分隔符/零散「用」等残字
TRAILER_URL_RE = re.compile(
    r"\s*[·\-\|]\s*https?://\S+(?:\s*[·\-\|]\s*[\u4e00-\u9fff\w\s]*)?\s*$"
)
# 结尾单字(「在线使⽤效果更好」剥掉关键字后残留)
TRAIL_TINY_RE = re.compile(r"\s*[·\-\|]\s*[\u4e00-\u9fff\w]\s*$")


def normalize_english(text: str) -> str:
    """把 PDF 换行导致的连写词、标点粘连还原,返回可读英文。"""
    # 1. 去掉换行导致的物理断行:先把所有行内(非段落间)的换行替换为空格
    text = text.replace("\r", "")
    # 段落级:连续两换行以上保留为单换行,单换行 -> 空格
    text = re.sub(r"\n{2,}", "\n", text)
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    # 2. 剥掉开头 ". (15 points)..." 这类垃圾
    text = LEADING_JUNK_RE.sub("", text).strip()
    # 3. 按 EN_REWRITE_TABLE 逐规则替换连写词
    for pat, repl in EN_REWRITE_TABLE:
        text = re.sub(pat, repl, text)
    # 4. 标点粘连(句号/问号/感叹号后跟大写字母无空格)
    def glue_fix(m: re.Match) -> str:
        if m.group(1):
            return f"{m.group(1)} {m.group(2)}"
        return f"{m.group(3)}\" {m.group(4)}"
    text = PUNCT_GLUE_RE.sub(glue_fix, text)
    # 5. 尾部「· URL · 用」广告——强拆:从最后一个 "· http" / " · https" 直接一刀切掉
    for sep in [" · https", "· https", " · http", "· http", " — https", " — http"]:
        idx = text.rfind(sep)
        if idx > max(30, len(text) // 2):
            text = text[:idx].rstrip()
            break
    text = TRAILER_URL_RE.sub("", text).strip()
    text = TRAIL_TINY_RE.sub("", text).strip()
    # 6. 再兜底剥一遍末尾 URL(不带分隔符前缀的情况) —— 只从最后 200 字符里找
    tail = text[-200:]
    m = re.search(r"\s*https?://\S+\s*$", tail)
    if m:
        text = text[: len(text) - (len(tail) - m.start())].rstrip()
    # 7. 句尾残留单字/符号(比如引号结束后,尾巴剩一个 · 或中文字)
    text = re.sub(r"\s*[·\-\|]\s*[\u2f00-\u2fff\u4e00-\u9fff]?\s*$", "", text).strip()
    # 8. 多余空格合并
    text = re.sub(r"\s+", " ", text).strip()
    return text


def split_cn_en_mixed(text: str) -> Tuple[str, str]:
    """
    当前 PDF 的实际情况:正文文本层几乎只有英文原文,中文只出现在末尾:
      「懒笔记 · https://english-exam.lazynote.cn/... · 在线使用效果更好」
    所以中文部分几乎必然是纯广告,没有真实参考译文。
    策略:
      - 直接返回 (全英文, 空) —— 中文翻译用户之后人工粘贴或从其它渠道导入
      - 但先剥掉页眉前缀、尾部广告、标点连写等,返回干净的英文原文。
    """
    # 先剥掉头部垃圾: "英语二真题(YYYY)" + "(15 points)" 以及紧邻其后的符号
    text = re.sub(r"^\s*英语二真题\s*\(\d{4}\)[\s\.\(\)\d分pointsPoints]*", "", text)
    # 剥掉尾部广告行: 懒笔记 ... URL ... 在线使用效果更好
    text = re.sub(
        r"\s*懒笔记\s*·\s*https?://\S+\s*·\s*在线使[用⼀⼆][\s\S]*$",
        "",
        text,
    )
    text = re.sub(r"\s*https?://\S+\s*$", "", text)
    # 去掉零散中文字符(极个别可能从页眉/页脚漏进来)
    text = re.sub(r"[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]", "", text)
    # 归一化英文(连写词还原、标点粘连修复)
    en = normalize_english(text)
    return en, ""


def collect_source_refzh(paras: List[str]) -> Tuple[str, str]:
    """
    把各段落合并为英文原文(source) + 中文参考译文(refZh)。
    规则:
      - 纯英文段落 → source
      - 含中文段落 → 进入 "中英分离" 流程,先出英文再出中文
    """
    en_parts: List[str] = []
    cn_parts: List[str] = []
    for p in paras:
        if has_chinese(p):
            e, c = split_cn_en_mixed(p)
            if e:
                en_parts.append(e)
            if c:
                cn_parts.append(c)
        else:
            # 剔除全段明显非正文(如版权、页码,再兜底一次)
            if len(p) < 12 and not re.search(r"[A-Za-z]{4,}", p):
                continue
            en_parts.append(p)
    return "\n".join(en_parts).strip(), "\n".join(cn_parts).strip()


# ---------------- 句子切片 ----------------
def split_en_sentences(text: str) -> List[str]:
    """
    按句子切英文: . ! ? 后跟空格或行尾,同时忽略 Mr./Ms./etc./e.g./i.e./U.S. 等缩写。
    返回:List[str] 每句原始字符串,保留尾部标点。
    """
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    # 保护常见缩写:先把缩写点用占位符替换,切完再还原
    ABBR = [
        "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.", "St.", "vs.",
        "etc.", "e.g.", "i.e.", "cf.", "Ex.", "No.", "Gov.", "Gen.",
        "U.S.", "U.K.", "a.m.", "p.m.",
    ]
    placeholders: Dict[str, str] = {}
    for i, ab in enumerate(ABBR):
        key = f"__ABBR{i}__"
        placeholders[key] = ab
        text = text.replace(ab, key)
    # 切句: (!/./?) + ("'/"?)? + 空格 + 大写字母/行尾
    parts = re.split(r"(?<=[.!?])([\"'])?\s+(?=[\"']?[A-Z])|(?<=[.!?])[\"']?$", text)
    sents: List[str] = []
    buf = ""
    for chunk in parts:
        if chunk is None:
            continue
        if re.match(r"^[\"']\s*$", chunk):
            buf += chunk
            continue
        s = (buf + chunk).strip()
        buf = ""
        if s:
            sents.append(s)
    if buf.strip():
        sents.append(buf.strip())
    # 还原缩写
    restored: List[str] = []
    for s in sents:
        for k, v in placeholders.items():
            s = s.replace(k, v)
        restored.append(s)
    # 过滤太短( < 6 字符)、无主句的残片
    return [s for s in restored if len(s) >= 6 and re.search(r"[A-Za-z]{4,}", s)]


def build_slices(source: str, ref_zh: str, prev_slices: List[dict]) -> List[dict]:
    """
    依据最新 source 按句重建 slices,并尽量从旧 JSON 的 prev_slices 里
    按英文句子模糊匹配,带回 refZh / points / pitfalls。
    """
    sents = split_en_sentences(source)
    # 把整段 refZh 粗暴按句号分「候选译文句」,数量对得上就顺序配对
    cn_candidates = [
        s.strip() for s in re.split(r"(?<=[。！？!?])\s*", ref_zh) if s.strip()
    ] if ref_zh else []

    # 旧索引:按 normalized 英文句子取已有的翻译/考点
    def norm(s: str) -> str:
        return re.sub(r"[^a-z0-9]+", "", s.lower())

    prev_map = {}
    for s in prev_slices or []:
        if isinstance(s, dict) and s.get("text"):
            prev_map[norm(s["text"])] = s

    slices: List[dict] = []
    cursor = 0
    src_norm = source.replace("\n", " ")
    src_norm = re.sub(r"\s+", " ", src_norm)

    for idx, sent in enumerate(sents):
        s_norm = norm(sent)
        # 定位 start/end:在 src_norm 里从 cursor 往后找 sent(宽松)
        # 先把 sent 按空格拆 token,按第一个 token 定位
        first_token = re.sub(r"[^\w']+", " ", sent).strip().split()
        start = -1
        if first_token:
            # 在 src_norm[cursor:] 里找第一个 token 出现的位置
            pos = src_norm.lower().find(first_token[0].lower(), cursor)
            if pos >= 0:
                # 再向后找 sent 的最后一个 token 结束位置
                last = first_token[-1].lower()
                # 粗略 end:找到 last 再加上句号
                end_pos = src_norm.lower().find(last, pos + len(first_token[0]))
                if end_pos < 0:
                    end_pos = pos + len(sent)
                end_pos = src_norm.find(" ", end_pos + len(last))
                if end_pos < 0:
                    end_pos = len(src_norm)
                # 再走到标点末尾
                while end_pos < len(src_norm) and src_norm[end_pos] in " \t":
                    end_pos += 1
                while end_pos < len(src_norm) and src_norm[end_pos - 1] in ".!?\"'":
                    if end_pos < len(src_norm) and src_norm[end_pos] in "\"'":
                        end_pos += 1
                    break
                start, end = pos, end_pos
                cursor = end
        if start < 0:
            start, end = cursor, min(cursor + len(sent) + 10, len(src_norm))
            cursor = end

        prev = prev_map.get(s_norm) or {}
        per_ref = prev.get("refZh") or (
            cn_candidates[idx] if idx < len(cn_candidates) and len(cn_candidates) == len(sents) else ""
        )

        slices.append({
            "id": f"s{idx + 1}",
            "start": start,
            "end": end,
            "text": src_norm[start:end].strip() or sent,
            "refZh": per_ref,
            "points": prev.get("points") or [],
            "pitfalls": prev.get("pitfalls") or [],
            "vocabIds": prev.get("vocabIds") or [],
        })
    return slices


def load_existing_json(year: int) -> dict:
    p = os.path.join(CONTENT_DIR, f"{year}.json")
    if not os.path.isfile(p):
        return {}
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


FAKE_REFZH_HINTS = ("懒笔记", "lazynote", "在线使", "english-exam.lazynote.cn", "kaoyan/paper", "· https://")


def is_fake_refzh(ref_zh: str) -> bool:
    if not ref_zh:
        return True
    if len(ref_zh) < 200:
        # 少于 200 字符基本不可能是完整翻译(2010 年原文 940 字符,译文通常更长或接近)
        # 但若含懒笔记关键字直接判假
        low = ref_zh.lower()
        if any(h.lower() in low for h in FAKE_REFZH_HINTS):
            return True
    low = ref_zh.lower()
    if any(h.lower() in low for h in FAKE_REFZH_HINTS):
        return True
    return False


def write_json(year: int, data: dict) -> None:
    os.makedirs(CONTENT_DIR, exist_ok=True)
    # 最终兜底:如果 refZh 是广告尾巴直接空掉
    if is_fake_refzh(data.get("refZh", "")):
        data["refZh"] = ""
    p = os.path.join(CONTENT_DIR, f"{year}.json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def process_year(year: int, pdf_path: str) -> dict:
    raw = extract_text(pdf_path)
    paras = split_paragraphs(raw)
    source, ref_zh = collect_source_refzh(paras)

    prev = load_existing_json(year)
    prev_slices = prev.get("slices", [])
    # 旧 JSON 的 refZh 可能是之前误写入的「懒笔记」广告尾巴,不信任。
    # 仅当旧 refZh 是真(>200 字且不包含广告关键字)时才保留。
    prev_ref = prev.get("refZh", "")
    if not is_fake_refzh(prev_ref):
        ref_zh = ref_zh or prev_ref

    slices = build_slices(source, ref_zh, prev_slices)
    data = {
        "year": year,
        "source": source,
        "slices": slices,
        "refZh": ref_zh,
        "points": prev.get("points") or [],
        "pitfalls": prev.get("pitfalls") or [],
    }
    write_json(year, data)
    return {
        "year": year,
        "pdf": os.path.basename(pdf_path),
        "source_len": len(source),
        "refZh_len": len(ref_zh),
        "slices_n": len(slices),
    }


def main() -> None:
    pattern = os.path.join(DOWNLOAD_DIR, "考研英语二*年英译汉*真题*.pdf")
    files = sorted(glob.glob(pattern))
    # 取 YEAR 并去重,遇到 "(1)" 等副本优先选更短文件名的那个
    by_year: Dict[int, str] = {}
    for f in files:
        m = re.search(r"(\d{4})年", os.path.basename(f))
        if not m:
            continue
        y = int(m.group(1))
        if y not in by_year or len(os.path.basename(f)) < len(os.path.basename(by_year[y])):
            by_year[y] = f

    if not by_year:
        print(f"[ERR] 在 {DOWNLOAD_DIR} 里没找到匹配的 PDF 文件")
        return
    reports = []
    for y in sorted(by_year):
        r = process_year(y, by_year[y])
        reports.append(r)
        print(f"[{y}] OK source={r['source_len']} refZh={r['refZh_len']} slices={r['slices_n']}  pdf={r['pdf']}")

    # 打印汇总 & 缺失提醒
    print("\n===== 汇总 =====")
    for r in reports:
        tags = []
        if r["source_len"] < 200:
            tags.append("⚠ 原文偏短(可能未识别)")
        if r["refZh_len"] < 100:
            tags.append("⚠ 参考译文缺失(请人工粘贴 refZh)")
        if r["slices_n"] <= 1:
            tags.append("⚠ 分句<=1(结构未切分)")
        tail = ("  " + " / ".join(tags)) if tags else ""
        print(f"{r['year']}: 原文{r['source_len']}字 译文{r['refZh_len']}字 切句{r['slices_n']}{tail}")


if __name__ == "__main__":
    main()
