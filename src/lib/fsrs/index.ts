// ============================================================
// FSRS 间隔重复调度(纯函数)
// ============================================================
//
// ⚠️ 复习算法接入点(占位)
// ------------------------------------------------------------
// 用户需求:复习算法那块把空留出来 —— 此处为核心调度算法的占位区。
// 当前 implementSchedule() 为简化占位逻辑,仅保证功能闭环。
// 请在此替换为你们的自研 FSRS / 间隔重复算法。
//
// 已实现的掌握判定规则(产品需求,非占位):
//   - 新词(state=0 新建 / 1 学习中):连续 3 次"认识"(Good/Easy)才算掌握
//   - 复习(state=2 复习中):连续 2 次"认识"即算掌握
// "认识"定义为评分 Rating.Good 或 Rating.Easy。
// ============================================================

import type { Rating, VocabCard, CardState } from '@/types';

export const RATING_LABEL: Record<Rating, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

/** 判定一次评分是否算"认识"(通过) */
export function isRecognized(rating: Rating): boolean {
  return rating === 3 || rating === 4; // Good / Easy
}

/** 新词掌握阈值:3 次认识;复习掌握阈值:2 次认识 */
const NEW_MASTER_THRESHOLD = 3;
const REVIEW_MASTER_THRESHOLD = 2;

/** 是否已掌握(基于连续认识次数与状态) */
export function isMastered(card: VocabCard): boolean {
  if (card.state === 2) return card.consecutiveCorrect >= REVIEW_MASTER_THRESHOLD;
  return card.consecutiveCorrect >= NEW_MASTER_THRESHOLD;
}

/**
 * 占位调度算法 —— 计算给定评分下的下次间隔(天)。
 * 🔧 请替换为自研 FSRS 算法。当前仅用 rating 做线性映射。
 */
function implementSchedule(
  rating: Rating,
  stability: number,
  difficulty: number
): { intervalDays: number; nextStability: number; nextDifficulty: number } {
  // 占位:基于评分与稳定性的简化映射
  const factors: Record<Rating, number> = { 1: 0, 2: 1.2, 3: 2.5, 4: 4.0 };
  const factor = factors[rating];
  let nextStability = stability <= 0 ? 1 : stability * factor;
  if (rating === 1) nextStability = Math.max(0.1, stability * 0.2); // 遗忘:稳定性骤降

  let nextDifficulty = difficulty;
  if (rating === 1) nextDifficulty = Math.min(10, difficulty + 1);
  if (rating === 4) nextDifficulty = Math.max(0, difficulty - 0.5);

  const intervalDays = rating === 1 ? 10 / 1440 : nextStability; // Again:10 分钟;其余按稳定性天数
  return { intervalDays, nextStability, nextDifficulty };
}

/** 按钮上展示的下次复习时间标签 */
export function previewNextLabel(rating: Rating, card: VocabCard): string {
  const { intervalDays } = implementSchedule(rating, card.stability, card.difficulty);
  if (intervalDays < 1) {
    const mins = Math.max(1, Math.round(intervalDays * 1440));
    return `<${mins}分`;
  }
  if (intervalDays < 30) return `${intervalDays.toFixed(1)}天`;
  return `${Math.round(intervalDays / 30)}月`;
}

/**
 * 核心调度:根据评分更新卡片全部调度字段。
 * 返回需要 patch 到数据库的新字段。
 */
export function scheduleCard(
  card: VocabCard,
  rating: Rating,
  now = new Date()
): Partial<VocabCard> {
  const { intervalDays, nextStability, nextDifficulty } = implementSchedule(
    rating,
    card.stability,
    card.difficulty
  );

  const recognized = isRecognized(rating);
  const consecutiveCorrect = recognized ? card.consecutiveCorrect + 1 : 0;

  // 状态流转
  let state: CardState;
  let lapses = card.lapses;
  if (rating === 1) {
    // 遗忘 -> 重学
    state = 3;
    lapses += 1;
  } else if (card.state === 0 || card.state === 1) {
    state = isMastered({ ...card, consecutiveCorrect, state: card.state })
      ? 2 // 新词掌握 -> 进入复习池
      : 1; // 仍在学习中
  } else {
    state = 2; // 维持复习
  }

  const due = new Date(now.getTime() + intervalDays * 86400000);

  return {
    stability: nextStability,
    difficulty: nextDifficulty,
    reps: card.reps + 1,
    lapses,
    state,
    consecutiveCorrect,
    last_review: now,
    due,
    scheduled_days: Math.round(intervalDays),
    elapsed_days: card.last_review
      ? Math.max(0, Math.round((now.getTime() - card.last_review.getTime()) / 86400000))
      : 0,
  };
}
