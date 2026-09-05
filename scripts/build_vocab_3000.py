#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
考研英语二 (2010-2026) 3000 核心真题词汇与关键短语生成器
- 严格按年份和篇目（Text 1~4 及翻译篇）归类
- 重点聚焦 2015-2026 年近 12 年命题（占 80%）
- 彻底过滤小初极简词
- 包含四种核心类别：[核心重点词, 熟词生义, 易混辨析, 介词短语/搭配]
- 生成 UTF-8 BOM CSV (兼容 Excel) 与结构化 JSON
"""

import json
import os
import re
import csv

READING_DIR = "./src/content/reading"
TRANS_DIR = "./src/content/translation"
OUTPUT_JSON_PUB = "./public/data/exam_vocab_3000.json"
OUTPUT_JSON_SRC = "./src/content/vocab/exam_vocab_3000.json"
OUTPUT_CSV_PUB = "./public/data/exam_vocab_3000.csv"

os.makedirs("./public/data", exist_ok=True)
os.makedirs("./src/content/vocab", exist_ok=True)

# 基础过滤停用词（小学与初中基础词）
STOP_WORDS = set("""
a about above across after again against all almost alone along already also although always among an and another answer any anyone anything anywhere appear area around as ask at away back bad be because become before began begin behind believe best better between big black blue body book both boy bring brother build business but buy by call can cannot car case cause certain change child children city clear close cold color come company continue control corner could country course day did die different do does dog door down draw drink drive drop during each early easy eat economy education either else end enough even evening ever every everyone everything expect eye face fact fall family far fast feel few find first fish five fly follow food for form found four friend from full game get girl give go good great green ground group grow hand happen hard have he head hear help her here high him his history hold home hope horse hour house how however huge human hundred idea if important in include into is island issue it its job just keep kill kind king know land language large last late laugh lead learn leave left let letter level lie life light like line list little live long look lose lot love low main make man many matter may me mean meat meet men might mind miss money month moon more morning most mother move much music must my name near need never new next night no none nor not nothing now number of off offer often old on once one only open or order other our out over own page paper part party pass past pay people person phone picture place plan plant play please point policy political poor power prepare present president problem public put question quite read real really reason red right river road room round run same save saw say school sea second see seem several she short should show side simple since sing sister sit six sleep small so some somebody someone something somewhere son song soon sound south speak stand start state stay still stop story street strong study such summer sun table take talk tell ten test than thank that the their them then there therefore these they thing think third this those though thought thousand three through time to today together too top toward town tree true try turn two under understand until up upon us use very view visit voice walk wall want war warm wash watch water way we week well went were what whatever when where whether which while white who whole whom whose why wide wife will win wind window winter wish with without woman women word work world worry would write year yes yet you young your
""".split())

print("Script framework ready.")
