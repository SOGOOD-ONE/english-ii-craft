# 一键在 content/reading 下生成 2010-2026 占位阅读 JSON 骨架(前端 UI 先跑,后期你给我真实 PDF/文本我再补)
# schema:
# { year, intro, passages:[{id:'p1', title, theme, wordCount, paragraphs:[str], questions:[{no, stem, options:[A,B,C,D], answer:'A', explanation:'', tags:[]}]}] }
import json
from pathlib import Path

YEAR_MIN, YEAR_MAX = 2010, 2026
PASSAGES = [
    {'id': 'p1', 'title': 'Text 1 · 经济与管理类', 'theme': 'business/economy', 'tag_cn': '经济管理'},
    {'id': 'p2', 'title': 'Text 2 · 科技与数字生活', 'theme': 'technology',     'tag_cn': '科技'},
    {'id': 'p3', 'title': 'Text 3 · 教育与文化',     'theme': 'education',      'tag_cn': '教育文化'},
    {'id': 'p4', 'title': 'Text 4 · 社会与法律',     'theme': 'society',        'tag_cn': '社会法律'},
]
TEMPLATE_PARAGRAPH = (
    '[TODO: 待从真题 PDF 提取英文原文段落]\n\n'
    '该占位仅用于前端 UI 联调,真实文本请写入 content/reading/<year>.json 的 passages[i].paragraphs 数组。'
)
TAGS_POOL = ['细节事实题', '推理判断题', '主旨大意题', '词义/句义猜测题', '态度观点题', '例证功能题']
STEMS = [
    'According to the text, the key reason for this phenomenon is that ______.',
    'The author quotes the example in Paragraph 2 to show that ______.',
    'Which of the following best summarizes the main idea of the passage?',
    'The word "X" (Line 3, Para.4) is closest in meaning to ______.',
    'The author\'s attitude towards the issue is best described as ______.',
]
OPTIONS = [
    ['an oversimplified view', 'a well-grounded concern', 'a purely academic guess', 'an irrational complaint'],
    ['boost corporate profits', 'lower employee satisfaction', 'improve work-life balance', 'reduce long-term productivity'],
    ['It will be reversed very soon', 'It has become an irreversible trend', 'It mainly affects developing countries', 'It does more harm than good'],
    ['skeptical', 'supportive', 'neutral', 'critical'],
]
EXPLANATION = '待补充:原文线索句 + 错项排除思路。'

root = Path(__file__).resolve().parent.parent.parent / 'content' / 'reading'
root.mkdir(exist_ok=True)

for y in range(YEAR_MIN, YEAR_MAX + 1):
    passages = []
    for p in PASSAGES:
        questions = []
        for qno in range(1, 6):
            stem = STEMS[(qno + hash(p['id']) + y) % len(STEMS)]
            opts = OPTIONS[(qno + hash(p['id']) + y) % len(OPTIONS)]
            tags = [TAGS_POOL[(qno + y) % len(TAGS_POOL)], TAGS_POOL[(qno + y + 1) % len(TAGS_POOL)]]
            questions.append({
                'no': qno,
                'stem': stem,
                'options': [
                    {'label': 'A', 'text': opts[0]},
                    {'label': 'B', 'text': opts[1]},
                    {'label': 'C', 'text': opts[2]},
                    {'label': 'D', 'text': opts[3]},
                ],
                'answer': ['A', 'B', 'C', 'D'][(qno + y) % 4],
                'explanation': EXPLANATION,
                'tags': tags,
                'source_sentence': '',
            })
        passages.append({
            'id': p['id'],
            'title': p['title'],
            'theme': p['theme'],
            'category': p['tag_cn'],
            'word_count': 0,
            'paragraphs': [TEMPLATE_PARAGRAPH],
            'questions': questions,
        })
    data = {
        'year': y,
        'title': f'考研英语二 {y} 年 · 阅读理解 Part A (Text 1-4)',
        'intro': '共 4 篇文章,每篇 5 道多选题,共 20 题 × 2 分 = 40 分。占位骨架,实际文本请从 PDF 抽取后替换。',
        'total_points': 40,
        'per_question_points': 2,
        'passages': passages,
    }
    (root / f'{y}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print('OK. generated', len(list(root.glob('*.json'))), 'reading JSON files at', root)
