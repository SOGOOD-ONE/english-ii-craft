# ============================================================
# 提取 kaoyanzhenti 仓库中所有英语二 PDF 原文
# 目标:
#  1. 英译汉整段   → content/translation/<year>.json
#  2. 大作文(Part B)图表题干 → content/writing/<year>.json
#
# 参考译文、图表数值、答案解析、考点/陷阱
# 这些 PDF 只含题干不含答案,无法从 PDF 提取。
# 脚本在生成 JSON 时把这些字段留为 [] 或占位,后续人工或联网补充。
# ============================================================
import json
import os
import re
import sys
from pathlib import Path

from pypdf import PdfReader

PDF_DIR = Path(os.environ["TEMP"]) / "kaoyanzhenti" / "公共课" / "英语真题" / "英语二"
PROJECT = Path(__file__).resolve().parent.parent
CONTENT = PROJECT / "content"

# ------- 正则:匹配各题型的起始标记 -------
MARKERS = {
    # 翻译: Section III Translation / 46题
    # 宽松匹配:从 "Translat" 关键词取到 Section IV 写作之前
    "translation": re.compile(
        r"Translat(?:e|ion)[\s\S]{0,500}?\n\s*46\s*[.\s]+(.*?)(?=Section\s*IV|Writing|$)",
        re.S | re.I,
    ),
    # 作文: Section IV Writing 到文件末尾整段
    "writing": re.compile(
        r"(Section\s*IV\s*Writing[\s\S]*?)$",
        re.S | re.I,
    ),
}


def extract_year(name: str) -> int:
    m = re.search(r"(\d{4})", name)
    return int(m.group(1)) if m else 0


def clean(s: str) -> str:
    # PDF 提取的文本常见:单字之间多余空格(英文词内空格)、多余空行
    s = s.replace("\r", "")
    # 合并多余空格但保留换行
    lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in s.split("\n")]
    # 去掉纯空行
    lines = [ln for ln in lines if ln]
    return "\n".join(lines)


def load_text(pdf_path: Path) -> str:
    r = PdfReader(str(pdf_path))
    parts = []
    for p in r.pages:
        t = p.extract_text() or ""
        parts.append(t)
    return clean("\n".join(parts))


def split_sentences(para: str):
    """将整段英语拆分为句子级 chunks(按句号/问号/感叹号 切)"""
    sentences = re.split(r"(?<=[.!?])\s+", para.strip())
    return [s.strip() for s in sentences if s.strip()]


def process_translation(year: int, text: str) -> dict | None:
    m = MARKERS["translation"].search(text)
    if not m:
        return None
    raw = clean(m.group(1))
    # 合并换行造成的断词
    raw = re.sub(r"-\n", "", raw)
    raw = raw.replace("\n", " ")
    raw = re.sub(r"\s{2,}", " ", raw)

    # 切分句
    sentences = split_sentences(raw)

    # 首段翻译一般 ~150 词,句数在 5-8 之间,取全部非过短句
    segments = []
    sid = 1
    for sent in sentences:
        if len(sent.split()) < 3:
            continue
        segments.append({
            "id": sid,
            "en": sent,
            "refZh": "",
            "points": [],
            "pitfalls": [],
        })
        sid += 1

    return {
        "year": year,
        "title": f"{year}年英语二真题翻译",
        "intro": "",
        "segments": segments,
    }


def process_writing(year: int, text: str) -> dict | None:
    m = MARKERS["writing"].search(text)
    if not m:
        return None
    chunk = clean(m.group(1) if m.lastindex else m.group(0))
    return {
        "year": year,
        "title": f"{year}年英语二写作(图表题干待提取)",
        "prompt": chunk,                 # 先把整段写作题面存下来
        "chartType": "",
        "chartOption": {},
        "keyPoints": [],
        "scaffolding": {
            "trends": [
                "account for the largest proportion of",
                "follow closely behind at",
                "take the lead in",
                "witness a sharp increase / decrease",
            ],
            "comparisons": [
                "in contrast to",
                "the gap between... and... is striking",
                "twice as many as",
            ],
            "reasons": [
                "can be attributed to the accelerating pace of life",
                "hinge upon the increasing need for flexibility",
                "stem from a growing awareness of health",
            ],
        },
        "sampleEssays": [],
    }


def main():
    files = sorted(
        PDF_DIR.glob("*年考研英语二真题.pdf"),
        key=lambda p: extract_year(p.name),
    )
    print(f"发现 {len(files)} 份 PDF")

    counts = {"translation": 0, "writing": 0}
    for f in files:
        year = extract_year(f.name)
        if year < 2010:
            continue
        print(f"\n=== 处理 {year} ===")
        text = load_text(f)

        tr = process_translation(year, text)
        if tr:
            out = CONTENT / "translation" / f"{year}.json"
            out.parent.mkdir(parents=True, exist_ok=True)
            with open(out, "w", encoding="utf-8") as fh:
                json.dump(tr, fh, ensure_ascii=False, indent=2)
            counts["translation"] += 1
            print(f"  翻译 ✓  {len(tr['segments'])} 句")

        wr = process_writing(year, text)
        if wr:
            out = CONTENT / "writing" / f"{year}.json"
            out.parent.mkdir(parents=True, exist_ok=True)
            with open(out, "w", encoding="utf-8") as fh:
                json.dump(wr, fh, ensure_ascii=False, indent=2)
            counts["writing"] += 1
            print(f"  写作 ✓  prompt 已保存")

    print(f"\n合计提取: 翻译 {counts['translation']} / 写作 {counts['writing']}")


if __name__ == "__main__":
    main()
