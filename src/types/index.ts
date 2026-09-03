// ============================================================
// English-II-Craft 全局类型定义
// ============================================================

// ---------- FSRS 生词卡 ----------
export type Rating = 1 | 2 | 3 | 4; // 1=Again 2=Hard 3=Good 4=Easy
export type CardState = 0 | 1 | 2 | 3; // 0=新建 1=学习中 2=复习中 3=重学中

export interface VocabCard {
  id?: number;
  word: string;
  phonetic?: string;
  definition: string;
  pos?: string;
  contextSentence: string; // 捕获的真题原句
  source: string; // 如 "2023 翻译"
  createdAt: Date;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: CardState;
  last_review?: Date;
  consecutiveCorrect: number; // 自研掌握判定辅助:连续"认识"次数
}

// ---------- 真题数据:图表写作 ----------
export type ChartType = 'bar' | 'pie' | 'line' | 'table';

export interface WritingData {
  year: number;
  title: string;
  prompt: string;
  chartType: ChartType;
  // 符合 ECharts 规范的配置对象
  chartOption: Record<string, unknown>;
  // 核心采分数据要点
  keyPoints: string[];
  // 高阶语料积木
  scaffolding: {
    trends: string[];
    comparisons: string[];
    reasons: string[];
  };
  sampleEssays: string[];
}

// ---------- 真题数据:段落翻译 ----------
/** 逐句切片(新 schema:与 PDF 抽取脚本、写作/新题型一致) */
export interface TranslationSlice {
  id: string;
  /** 句子在 source 中的起始字符偏移(0-based,按连写词还原后的 source 计算) */
  start: number;
  /** 句子在 source 中的结束偏移(不包含) */
  end: number;
  /** 英文原句(已做连写词还原,但可能仍存在极个别 OCR 连写) */
  text: string;
  /** 单句参考译文;空字符串代表"暂未录入" */
  refZh: string;
  /** 单句级考点解析(如:定语从句前置、被动转主动、增译范畴词等) */
  points: string[];
  /** 单句级易错陷阱 */
  pitfalls: string[];
  /** 从句中抽取并加入生词本的生词 id 列表 */
  vocabIds: string[];
}

/** 遗留 schema(早期版本使用,兼容保留,渲染时会自动合并到 slices):旧的 seg {id,en} */
export interface TranslationSegment {
  id: number;
  en: string;
  refZh: string;
  points: string[]; // 考点
  pitfalls: string[]; // 易错点
}

export interface TranslationData {
  year: number;
  /** 整段英文原文(PDF 提取并归一化后的干净文本) */
  source: string;
  /** 整段中文参考译文;空字符串代表"未从 PDF 抽取到,待人工粘贴" */
  refZh: string;
  /** 整段级考点 */
  points: string[];
  /** 整段级易错陷阱 */
  pitfalls: string[];
  /** 逐句切片(新 schema,优先渲染) */
  slices: TranslationSlice[];

  // ===== 遗留字段 =====
  /** 旧字段:卡片标题,渲染器会兜底使用 `{year} 年 · 英译汉原文` */
  title?: string;
  /** 旧字段:题干 intro */
  intro?: string;
  /** 旧字段:旧分段格式;若 slices 空则回退使用并补齐字段 */
  segments?: TranslationSegment[];
}

// ---------- 真题数据:新题型 ----------
export interface PartBParagraph {
  id: string;
  text: string;
  correctOptionId: string;
  // 原文中需高亮的同义替换片段
  highlight?: { id: string; text: string };
}

export interface PartBOption {
  id: string;
  text: string;
  isDistractor?: boolean;
  distractorReason?: string; // 干扰项设错机制
}

export interface SynonymMapping {
  optionId: string;
  optionKeyword: string;
  textHighlightId: string;
  explanation: string;
}

export interface PartBData {
  year: number;
  /** 题型:subheading=小标题对应, matching=多项匹配,空串=未解析/待人工整理 */
  type: 'subheading' | 'matching' | '';
  title: string;
  /** 未结构化的原题面原文(从 PDF 提取的 raw text),用于"待解析"降级视图 */
  raw?: string;
  paragraphs: PartBParagraph[];
  options: PartBOption[];
  synonymMappings: SynonymMapping[];
}

// ---------- AI 批改报告 ----------
export interface AiReviewReport {
  score: number;
  total: number;
  dimensions: {
    dataDescription: number;
    reasoning: number;
    vocabulary: number;
    grammar: number;
  };
  suggestions: string[];
}
