// ============================================================
// FSRS 官方调度(ts-fsrs)接入层
// ============================================================
// 接入官方 ts-fsrs 最新 FSRS v6 调度器。
// 额外叠加产品侧的"掌握判定"规则:
//   新词(state!=2): 连续 3 次认识 → 掌握 → 进入复习池
//   复习(state==2): 连续 2 次认识 → 掌握
// "认识" = Rating.Good / Rating.Easy
// ============================================================

import {
  fsrs,
  createEmptyCard,
  Rating as FsrsRating,
  type FSRS as IFsrs,
  type Card as FsrsCard,
} from 'ts-fsrs';
import type { Rating, VocabCard } from '@/types';

const scheduler: IFsrs = fsrs();

const FSRS_RATING: Record<Rating, FsrsRating> = {
  1: FsrsRating.Again,
  2: FsrsRating.Hard,
  3: FsrsRating.Good,
  4: FsrsRating.Easy,
};

export const RATING_LABEL: Record<Rating, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

/** 判定"认识"(Good/Easy)  */
export function isRecognized(rating: Rating): boolean {
  return rating === 3 || rating === 4;
}

// 产品层掌握阈值
const NEW_MASTER_THRESHOLD = 3;
const REVIEW_MASTER_THRESHOLD = 2;

export function isMastered(card: VocabCard): boolean {
  // state 2 是 FSRS 的 Review 状态,对应复习池
  const isReview = card.state === 2;
  return card.consecutiveCorrect >= (isReview ? REVIEW_MASTER_THRESHOLD : NEW_MASTER_THRESHOLD);
}

// 把 DB VocabCard 转成 ts-fsrs 内部的 Card
// 注意:createEmptyCard() 产出当前 FSRS Card 完整结构,然后用数据覆盖
function toFsrsCard(c: VocabCard): FsrsCard {
  const base = createEmptyCard();
  return {
    ...base,
    due: new Date(c.due),
    stability: c.stability || base.stability,
    difficulty: c.difficulty || base.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state as FsrsCard['state'],
    last_review: c.last_review ? new Date(c.last_review) : undefined,
  };
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000));
}

/** 预览某个评分对应的"下次复习时间"标签(<5分 / 1.2天 等) */
export function previewNextLabel(rating: Rating, card: VocabCard): string {
  const fsrsCard = card.reps === 0 ? createEmptyCard() : toFsrsCard(card);
  const now = new Date();
  try {
    const preview = scheduler.repeat(fsrsCard, now);
    const key = FSRS_RATING[rating] as unknown as keyof typeof preview;
    const entry = preview[key] as any;
    const next = entry?.card ?? (typeof entry === 'function' ? undefined : undefined);
    if (!next) return '—';
    const due = next.due instanceof Date ? next.due : new Date(next.due);
    const days = daysBetween(now, due);
    if (days < 1) {
      const mins = Math.max(1, Math.ceil((next.due.getTime() - now.getTime()) / 60000));
      return `<${mins}分`;
    }
    if (days < 30) return `${days.toFixed(1)}天`;
    return `${Math.round(days / 30)}月`;
  } catch {
    return '—';
  }
}

/** 应用评分并返回要写入数据库的 patch */
export function scheduleCard(
  card: VocabCard,
  rating: Rating,
  now = new Date()
): Partial<VocabCard> {
  const fsrsCard = card.reps === 0 ? createEmptyCard() : toFsrsCard(card);
  // Grade 类型是 1 | 2 | 3 | 4 的字面量联合;FSRS_RATING 枚举值与之等价
  const result = scheduler.next(fsrsCard, now, FSRS_RATING[rating] as unknown as 1 | 2 | 3 | 4);
  const next = result.card;

  const recognized = isRecognized(rating);
  const consecutiveCorrect = recognized ? card.consecutiveCorrect + 1 : 0;

  // lapses + product-level 掌握判定
  const lapses = rating === 1 ? card.lapses + 1 : card.lapses;
  const nextState = next.state as unknown as 0 | 1 | 2 | 3;
  const state: 0 | 1 | 2 | 3 = nextState;

  return {
    stability: next.stability,
    difficulty: next.difficulty,
    reps: next.reps,
    lapses,
    state,
    consecutiveCorrect,
    last_review: now,
    due: next.due,
    scheduled_days: next.scheduled_days,
    elapsed_days: next.elapsed_days,
  };
}
