// ============================================================
// 本地数据库 (Dexie / IndexedDB) —— 零后端,数据全部存本机
// ============================================================
import Dexie, { type Table } from 'dexie';
import type { VocabCard, WordDefinition } from '@/types';

export class AppDB extends Dexie {
  cards!: Table<VocabCard, number>;
  words!: Table<WordDefinition, string>;

  constructor() {
    super('english-ii-craft');
    this.version(2)
      .stores({
        // id 自增主键;due 用于复习排程索引;state/word 辅助查询
        cards: '++id, word, due, state',
        // 单词释义缓存(hover tooltip 用),以 word(归一化小写)为唯一主键
        words: '&word, accessedAt',
      });
  }
}

export const db = new AppDB();

// ---------- 生词卡 CRUD ----------

/** 存入一张生词卡(划词抓取后调用),同词去重 */
export async function addCard(
  data: Pick<VocabCard, 'word' | 'phonetic' | 'definition' | 'pos' | 'contextSentence' | 'source'>
): Promise<number> {
  const existing = await db.cards.where('word').equalsIgnoreCase(data.word).first();
  if (existing) return existing.id!;

  const now = new Date();
  const card: VocabCard = {
    ...data,
    createdAt: now,
    due: now, // 新卡立即到期
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    consecutiveCorrect: 0,
  };
  return (await db.cards.add(card)) as number;
}

/** 取所有到期待复习的卡片(含新卡) */
export async function getDueCards(now = new Date()): Promise<VocabCard[]> {
  return db.cards.where('due').belowOrEqual(now).sortBy('due');
}

/** 取全部生词(生词本展示) */
export async function getAllCards(): Promise<VocabCard[]> {
  return db.cards.orderBy('createdAt').reverse().toArray();
}

/** 更新卡片调度状态 */
export async function updateCard(id: number, patch: Partial<VocabCard>): Promise<void> {
  await db.cards.update(id, patch);
}

/** 删除生词 */
export async function deleteCard(id: number): Promise<void> {
  await db.cards.delete(id);
}

/** 待复习计数(导航徽标) */
export async function getDueCount(now = new Date()): Promise<number> {
  return db.cards.where('due').belowOrEqual(now).count();
}
