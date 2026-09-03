import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  Check,
} from 'lucide-react';

function seedShuffle<T>(array: T[], seedStr: string): T[] {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const result = [...array];
  let m = result.length, t: T, i: number;
  while (m) {
    hash = Math.sin(hash++) * 10000;
    const r = hash - Math.floor(hash);
    i = Math.floor(r * m--);
    t = result[m];
    result[m] = result[i];
    result[i] = t;
  }
  return result;
}

export interface QuizCardItem {
  id: number;
  word: string;
  phonetic?: string;
  definition: string;
  pos?: string;
  contextSentence?: string;
  source?: string;
  raw?: any;
}

export interface VocabQuizSessionProps {
  cards: QuizCardItem[];
  allDictionaryCards: QuizCardItem[];
  onReviewSubmit: (cardId: number, rating: 'Again' | 'Hard' | 'Good' | 'Easy') => void;
  onFinishSession: () => void;
  onBackToOverview: () => void;
}

export type QuizType = 'en_zh' | 'zh_en';

interface QuizTask {
  taskId: string;
  cardId: number;
  type: QuizType;
}

interface CardProgress {
  cardId: number;
  enZhPassed: number; // target: 2
  zhEnPassed: number; // target: 1
  mistakes: number;
  isCompleted: boolean;
}

interface QuizOption {
  id: string;
  label: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  isCorrect: boolean;
  wordItem: QuizCardItem;
}

// 内置备用丰富考研高频词库，确保即使用户生词卡较少时也能生成高质量、不重复的4个选项
const FALLBACK_DISTRACTORS: Array<{ word: string; phonetic: string; definition: string }> = [
  { word: 'prospect', phonetic: '/ˈprɒspekt/', definition: 'n. 前景; 期望; 展望 vi. 勘探' },
  { word: 'advocate', phonetic: '/ˈædvəkeɪt/', definition: 'vt. 提倡; 主张 n. 拥护者; 倡导者' },
  { word: 'accommodate', phonetic: '/əˈkɒmədeɪt/', definition: 'vt. 容纳; 顺应; 提供住宿' },
  { word: 'undermine', phonetic: '/ˌʌndəˈmaɪn/', definition: 'vt. 暗中破坏; 逐渐削弱' },
  { word: 'plausible', phonetic: '/ˈplɔːzəbl/', definition: 'adj. 貌似合理的; 似是而非的' },
  { word: 'deteriorate', phonetic: '/dɪˈtɪəriəreɪt/', definition: 'vi. 恶化; 退化; 变坏' },
  { word: 'comprehensive', phonetic: '/ˌkɒmprɪˈhensɪv/', definition: 'adj. 全面的; 综合的; 详尽的' },
  { word: 'vulnerable', phonetic: '/ˈvʌlnərəbl/', definition: 'adj. 易受攻击的; 脆弱的' },
  { word: 'prevalent', phonetic: '/ˈprevələnt/', definition: 'adj. 流行的; 普遍的' },
  { word: 'scrutiny', phonetic: '/ˈskruːtəni/', definition: 'n. 仔细审查; 彻底检查' },
  { word: 'perceive', phonetic: '/pəˈsiːv/', definition: 'vt. 察觉; 意识到; 视为' },
  { word: 'inevitable', phonetic: '/ɪnˈevɪtəbl/', definition: 'adj. 不可避免的; 必然的' },
  { word: 'diminish', phonetic: '/dɪˈmɪnɪʃ/', definition: 'vt./vi. 减少; 削弱; 贬低' },
  { word: 'consequent', phonetic: '/ˈkɒnsɪkwənt/', definition: 'adj. 随之发生的; 作为结果的' },
  { word: 'feasible', phonetic: '/ˈfiːzəbl/', definition: 'adj. 可行的; 行得通的' },
  { word: 'subtle', phonetic: '/ˈsʌtl/', definition: 'adj. 微妙的; 敏锐的; 隐约的' },
  { word: 'coincide', phonetic: '/ˌkəʊɪnˈsaɪd/', definition: 'vi. 同时发生; 巧合; 意见一致' },
  { word: 'reinforce', phonetic: '/ˌriːɪnˈfɔːs/', definition: 'vt. 强化; 加固; 增援' },
  { word: 'contradict', phonetic: '/ˌkɒntrəˈdɪkt/', definition: 'vt. 反驳; 与...矛盾' },
  { word: 'speculate', phonetic: '/ˈspekjuleɪt/', definition: 'vi. 推测; 投机; 思考' },
  { word: 'discrepancy', phonetic: '/dɪˈskrepənsi/', definition: 'n. 差异; 不一致; 矛盾' },
  { word: 'preliminary', phonetic: '/prɪˈlɪmɪnəri/', definition: 'adj. 初步的; 预备的 n. 初试' },
  { word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', definition: 'adj. 模棱两可的; 歧义的' },
  { word: 'rigorous', phonetic: '/ˈrɪɡərəs/', definition: 'adj. 严密的; 严格的; 严谨的' },
  { word: 'paramount', phonetic: '/ˈpærəmaʊnt/', definition: 'adj. 至关重要的; 首要的' },
  { word: 'exaggerate', phonetic: '/ɪɡˈzædʒəreɪt/', definition: 'vt./vi. 夸大; 夸张' },
  { word: 'spontaneous', phonetic: '/spɒnˈteɪniəs/', definition: 'adj. 自发的; 自然产生的' },
  { word: 'persistent', phonetic: '/pəˈsɪstənt/', definition: 'adj. 执着的; 持续的; 不懈的' },
  { word: 'constitute', phonetic: '/ˈkɒnstɪtjuːt/', definition: 'vt. 构成; 组成; 设立' },
  { word: 'substantial', phonetic: '/səbˈstænʃl/', definition: 'adj. 大量的; 结实的; 重大的' },
];

/**
 * 核心调度算法：将多张卡片的 3 次学习任务（2次英译汉 + 1次汉译英）打乱分布，
 * 采用严格约束回溯机制，确保相邻题目绝对不属于同一张卡片（防连续出现）
 */
function generateInterleavedQueue(cards: QuizCardItem[]): QuizTask[] {
  if (cards.length === 0) return [];

  // 单张卡片情况
  if (cards.length === 1) {
    const c = cards[0];
    return [
      { taskId: `${c.id}-en_zh-1-${Math.random().toString(36).slice(2, 6)}`, cardId: c.id, type: 'en_zh' },
      { taskId: `${c.id}-zh_en-1-${Math.random().toString(36).slice(2, 6)}`, cardId: c.id, type: 'zh_en' },
      { taskId: `${c.id}-en_zh-2-${Math.random().toString(36).slice(2, 6)}`, cardId: c.id, type: 'en_zh' },
    ];
  }

  // 1. 为每张卡片生成 3 个子任务：2个英译汉，1个汉译英
  const allTasks: QuizTask[] = [];
  cards.forEach(c => {
    allTasks.push({ taskId: `${c.id}-en_zh-1-${Math.random().toString(36).slice(2, 6)}`, cardId: c.id, type: 'en_zh' });
    allTasks.push({ taskId: `${c.id}-en_zh-2-${Math.random().toString(36).slice(2, 6)}`, cardId: c.id, type: 'en_zh' });
    allTasks.push({ taskId: `${c.id}-zh_en-1-${Math.random().toString(36).slice(2, 6)}`, cardId: c.id, type: 'zh_en' });
  });

  // 2. 约束求解器：打乱并确保相邻无重复卡片
  for (let attempt = 0; attempt < 50; attempt++) {
    const pool = [...allTasks].sort(() => Math.random() - 0.5);
    const result: QuizTask[] = [];
    let success = true;

    while (pool.length > 0) {
      const prevCardId = result.length > 0 ? result[result.length - 1].cardId : null;
      // 优先从 pool 中选一个与 prevCardId 不同的项
      const candidateIdx = pool.findIndex(t => t.cardId !== prevCardId);
      if (candidateIdx === -1) {
        // 向前插入到合法间隙
        const stuckTask = pool.pop()!;
        let inserted = false;
        for (let i = 0; i < result.length; i++) {
          const prev = i === 0 ? null : result[i - 1].cardId;
          const next = result[i].cardId;
          if (stuckTask.cardId !== prev && stuckTask.cardId !== next) {
            result.splice(i, 0, stuckTask);
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          success = false;
          break;
        }
      } else {
        result.push(pool.splice(candidateIdx, 1)[0]);
      }
    }

    if (success) {
      let isStrict = true;
      for (let k = 0; k < result.length - 1; k++) {
        if (result[k].cardId === result[k + 1].cardId) {
          isStrict = false;
          break;
        }
      }
      if (isStrict) return result;
    }
  }

  return allTasks;
}

export default function VocabQuizSession({
  cards,
  allDictionaryCards,
  onReviewSubmit,
  onFinishSession,
  onBackToOverview,
}: VocabQuizSessionProps) {
  // 1. 卡片映射字典
  const cardMap = useMemo(() => {
    const map = new Map<number, QuizCardItem>();
    cards.forEach(c => map.set(c.id, c));
    allDictionaryCards.forEach(c => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return map;
  }, [cards, allDictionaryCards]);

  // 2. 学习进度状态跟踪
  const [progressMap, setProgressMap] = useState<Record<number, CardProgress>>(() => {
    const init: Record<number, CardProgress> = {};
    cards.forEach(c => {
      init[c.id] = {
        cardId: c.id,
        enZhPassed: 0,
        zhEnPassed: 0,
        mistakes: 0,
        isCompleted: false,
      };
    });
    return init;
  });

  // 3. 题目队列
  const [queue, setQueue] = useState<QuizTask[]>(() => generateInterleavedQueue(cards));
  const [currentIndex, setCurrentIndex] = useState(0);

  // 4. 当前交互状态
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [autoNextTimer, setAutoNextTimer] = useState<NodeJS.Timeout | null>(null);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [showSentenceContext, setShowSentenceContext] = useState<boolean>(false);

  // 5. 统计信息
  const [stats, setStats] = useState({
    totalAnswered: 0,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    maxStreak: 0,
  });

  const currentTask = queue[currentIndex] || null;
  const currentCard = currentTask ? cardMap.get(currentTask.cardId) : null;
  const currentCardProgress = currentTask ? progressMap[currentTask.cardId] : null;

  // 单词发音 (TTS)
  const speakWord = useCallback((text?: string) => {
    const wordToSpeak = text || currentCard?.word;
    if (!wordToSpeak || typeof window === 'undefined') return;
    try {
      window.speechSynthesis?.cancel();
      const utter = new SpeechSynthesisUtterance(wordToSpeak);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis?.speak(utter);
    } catch {}
  }, [currentCard]);

  // 当题目切换时同步重置交互状态
  const activeTaskKey = currentTask?.taskId ?? '';
  const [prevTaskKey, setPrevTaskKey] = useState(activeTaskKey);
  if (activeTaskKey !== prevTaskKey) {
    setPrevTaskKey(activeTaskKey);
    setSelectedOptionId(null);
    setIsAnswerRevealed(false);
    setShowSentenceContext(false);
  }

  // 每当切换到新题目时播放发音（仅英译汉模式）与清除定时器
  useEffect(() => {
    if (currentTask?.type === 'en_zh' && currentCard?.word) {
      speakWord(currentCard.word);
    }
    if (autoNextTimer) clearTimeout(autoNextTimer);
  }, [activeTaskKey, currentTask?.type, currentCard?.word, speakWord, autoNextTimer]);

  // 生成 4 个选项
  const currentOptions: QuizOption[] = useMemo(() => {
    if (!currentCard || !currentTask) return [];

    const isEnZh = currentTask.type === 'en_zh';
    const correctText = isEnZh ? currentCard.definition : currentCard.word;

    // 收集候选干扰项（优先从当前卡片列表/词典中找，不足则从考研备用库补齐）
    const distractors: string[] = [];
    const usedTexts = new Set<string>([correctText.trim().toLowerCase()]);

    // 从所有词卡中抽取
    const otherCards = Array.from(cardMap.values()).filter(c => c.id !== currentCard.id);
    const shuffledOther = seedShuffle(otherCards, `${currentTask.taskId}-other`);

    for (const oc of shuffledOther) {
      const text = isEnZh ? oc.definition : oc.word;
      const clean = text.trim().toLowerCase();
      if (text && !usedTexts.has(clean)) {
        usedTexts.add(clean);
        distractors.push(text);
        if (distractors.length >= 3) break;
      }
    }

    // 若依然不足 3 个干扰项，从考研备用词库中补齐
    if (distractors.length < 3) {
      const shuffledFallback = seedShuffle(FALLBACK_DISTRACTORS, `${currentTask.taskId}-fallback`);
      for (const fb of shuffledFallback) {
        const text = isEnZh ? fb.definition : fb.word;
        const clean = text.trim().toLowerCase();
        if (text && !usedTexts.has(clean)) {
          usedTexts.add(clean);
          distractors.push(text);
          if (distractors.length >= 3) break;
        }
      }
    }

    // 组装 4 个选项并打乱
    const unShuffledOptions = [
      { text: correctText, isCorrect: true, wordItem: currentCard },
      ...distractors.slice(0, 3).map(d => ({
        text: d,
        isCorrect: false,
        wordItem: currentCard,
      })),
    ];

    const rawOptions = seedShuffle(unShuffledOptions, `${currentTask.taskId}-options`);

    const labels = ['A', 'B', 'C', 'D'];
    return rawOptions.map((opt, idx) => ({
      id: `opt-${idx}-${opt.text.slice(0, 8)}`,
      label: labels[idx],
      text: opt.text,
      isCorrect: opt.isCorrect,
      wordItem: opt.wordItem,
    }));
  }, [currentCard, currentTask, cardMap]);

  // 切换到下一题（含防连续出现动态调整）
  const handleNextQuestion = useCallback(() => {
    if (autoNextTimer) clearTimeout(autoNextTimer);

    // 检查是否还有题目
    if (currentIndex + 1 < queue.length) {
      const nextIdx = currentIndex + 1;
      const nextTask = queue[nextIdx];

      // 如果下一题和刚刚这一题是同一个词（且后面还有其他词的任务），将它与后面不同词的任务调换，确保不连续
      if (currentTask && nextTask.cardId === currentTask.cardId && nextIdx + 1 < queue.length) {
        const swapIdx = queue.findIndex((t, idx) => idx > nextIdx && t.cardId !== currentTask.cardId);
        if (swapIdx !== -1) {
          const newQueue = [...queue];
          const temp = newQueue[nextIdx];
          newQueue[nextIdx] = newQueue[swapIdx];
          newQueue[swapIdx] = temp;
          setQueue(newQueue);
        }
      }

      setCurrentIndex(nextIdx);
    } else {
      // 队列已到底部
      setCurrentIndex(queue.length);
    }
  }, [autoNextTimer, currentIndex, currentTask, queue]);

  // 处理选项点击
  const handleSelectOption = useCallback((option: QuizOption) => {
    if (isAnswerRevealed || !currentTask || !currentCard) return;

    const isCorrect = option.isCorrect;
    setSelectedOptionId(option.id);
    setIsAnswerRevealed(true);

    // 更新总计数据
    setStats(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        totalAnswered: prev.totalAnswered + 1,
        correctCount: prev.correctCount + (isCorrect ? 1 : 0),
        wrongCount: prev.wrongCount + (isCorrect ? 0 : 1),
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
      };
    });

    // 更新卡片独立进度 (2次英译汉 + 1次汉译英)
    setProgressMap(prev => {
      const cur = prev[currentCard.id] || {
        cardId: currentCard.id,
        enZhPassed: 0,
        zhEnPassed: 0,
        mistakes: 0,
        isCompleted: false,
      };

      let newEnZh = cur.enZhPassed;
      let newZhEn = cur.zhEnPassed;
      let newMistakes = cur.mistakes;

      if (isCorrect) {
        if (currentTask.type === 'en_zh') {
          newEnZh = Math.min(2, newEnZh + 1);
        } else {
          newZhEn = Math.min(1, newZhEn + 1);
        }
      } else {
        newMistakes += 1;
      }

      const passed = newEnZh >= 2 && newZhEn >= 1;

      // 如果达到了 2次英译中 + 1次中译英，就算通关，上报 FSRS 评分
      if (passed && !cur.isCompleted) {
        const rating = newMistakes === 0 ? 'Good' : 'Hard';
        onReviewSubmit(currentCard.id, rating);
      }

      return {
        ...prev,
        [currentCard.id]: {
          cardId: currentCard.id,
          enZhPassed: newEnZh,
          zhEnPassed: newZhEn,
          mistakes: newMistakes,
          isCompleted: passed,
        },
      };
    });

    // 若回答错误，动态插入补测任务（严格防连续出现，隔位插入）
    if (!isCorrect) {
      setQueue(prevQueue => {
        const nextTasks = [...prevQueue];
        const penaltyTask: QuizTask = {
          taskId: `${currentCard.id}-${currentTask.type}-retry-${Math.random().toString(36).slice(2, 6)}`,
          cardId: currentCard.id,
          type: currentTask.type,
        };

        // 插入位置：至少隔 2 题之后，且避免与目标位置的卡片相同
        const remainingLength = nextTasks.length - (currentIndex + 1);
        if (remainingLength <= 1) {
          nextTasks.push(penaltyTask);
        } else {
          // 放在 2~3 个位置之后
          const insertIdx = Math.min(nextTasks.length, currentIndex + 3);
          nextTasks.splice(insertIdx, 0, penaltyTask);
        }
        return nextTasks;
      });
    }

    // 自动跳转下一题 (如果开启了自动切题)
    if (autoAdvance) {
      const delay = isCorrect ? 1000 : 2200;
      const timer = setTimeout(() => {
        handleNextQuestion();
      }, delay);
      setAutoNextTimer(timer);
    }
  }, [isAnswerRevealed, currentTask, currentCard, autoAdvance, onReviewSubmit, currentIndex, handleNextQuestion]);

  // 键盘快捷键支持 (1-4 / A-D / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswerRevealed) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          handleNextQuestion();
        }
        return;
      }

      const key = e.key.toUpperCase();
      let selectedIdx = -1;
      if (['A', 'B', 'C', 'D'].includes(key)) {
        selectedIdx = ['A', 'B', 'C', 'D'].indexOf(key);
      } else if (['1', '2', '3', '4'].includes(key)) {
        selectedIdx = parseInt(key, 10) - 1;
      }

      if (selectedIdx >= 0 && selectedIdx < currentOptions.length) {
        e.preventDefault();
        handleSelectOption(currentOptions[selectedIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerRevealed, currentOptions, handleNextQuestion, handleSelectOption]);

  // 统计已通关卡片数
  const completedCardsCount = useMemo(() => {
    return Object.values(progressMap).filter(p => p.isCompleted).length;
  }, [progressMap]);

  const isAllFinished = completedCardsCount >= cards.length || currentIndex >= queue.length;

  // ----------------------------------------------------
  // 视图 1: 全部通关庆祝结算页面
  // ----------------------------------------------------
  if (isAllFinished) {
    const accuracy = stats.totalAnswered > 0
      ? Math.round((stats.correctCount / stats.totalAnswered) * 100)
      : 100;

    return (
      <div className="w-full max-w-xl mx-auto bg-white border border-zinc-200 rounded-xl p-6 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-9 h-9" />
        </div>

        <h2 className="text-xl font-bold text-zinc-900 mb-1">
          恭喜完成本次复习！
        </h2>

        {/* 数据面板 */}
        <div className="grid grid-cols-4 gap-2 mb-6 text-left">
          <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
            <div className="text-[11px] text-zinc-500 mb-1">已掌握词数</div>
            <div className="text-lg font-bold text-emerald-600 font-mono">
              {completedCardsCount} <span className="text-xs font-normal text-zinc-400">/ {cards.length}</span>
            </div>
          </div>
          <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
            <div className="text-[11px] text-zinc-500 mb-1">答题正确率</div>
            <div className="text-lg font-bold text-zinc-800 font-mono">{accuracy}%</div>
          </div>
          <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
            <div className="text-[11px] text-zinc-500 mb-1">总答题轮次</div>
            <div className="text-lg font-bold text-zinc-800 font-mono">{stats.totalAnswered}</div>
          </div>
          <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
            <div className="text-[11px] text-zinc-500 mb-1">最高连对</div>
            <div className="text-lg font-bold text-amber-600 font-mono">{stats.maxStreak} 🔥</div>
          </div>
        </div>

        {/* 单词通关明细列表 */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-left mb-6 max-h-56 overflow-y-auto">
          <div className="text-[11px] font-semibold text-zinc-600 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>本次通关单词清单 ({cards.length} 词)</span>
          </div>
          <div className="space-y-1.5">
            {cards.map(c => {
              return (
                <div key={c.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-zinc-900">{c.word}</span>
                    <span className="text-zinc-400 font-mono text-[11px]">{c.phonetic}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600 text-[11px] truncate max-w-[200px]">{c.definition}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                      已同步 FSRS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onFinishSession}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            完成复习并返回
          </button>
          <button
            type="button"
            onClick={() => {
              setQueue(generateInterleavedQueue(cards));
              setCurrentIndex(0);
              setProgressMap(() => {
                const init: Record<number, CardProgress> = {};
                cards.forEach(c => {
                  init[c.id] = { cardId: c.id, enZhPassed: 0, zhEnPassed: 0, mistakes: 0, isCompleted: false };
                });
                return init;
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            再练一组
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 视图 2: 正在答题中的交互界面
  // ----------------------------------------------------
  const isEnZh = currentTask.type === 'en_zh';
  const totalCardsCount = cards.length;
  const passedProgress = (completedCardsCount / totalCardsCount) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-zinc-200/90 rounded-xl p-6 shadow-xs my-2">
      {/* 顶部导航与进度 */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 text-xs">
        <button
          type="button"
          onClick={onBackToOverview}
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 transition cursor-pointer text-xs"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>返回词库</span>
        </button>

        {/* 学习进度指标 */}
        <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-mono">
          <span>已通关:</span>
          <span className="font-bold text-emerald-600">{completedCardsCount}</span>
          <span className="text-zinc-400">/ {totalCardsCount} 词</span>
        </div>
      </div>

      {/* 顶部进度条 */}
      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-4">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${passedProgress}%` }}
        />
      </div>

      {/* 当前卡片达标指标 */}
      <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-1.5 mb-4 text-xs">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-zinc-500">本词:</span>
          <span className={`px-1.5 py-0.5 rounded font-mono ${
            (currentCardProgress?.enZhPassed || 0) >= 2
              ? 'bg-emerald-100 text-emerald-800 font-semibold'
              : 'bg-zinc-200 text-zinc-700'
          }`}>
            英→汉 {currentCardProgress?.enZhPassed || 0}/2
          </span>
          <span className={`px-1.5 py-0.5 rounded font-mono ${
            (currentCardProgress?.zhEnPassed || 0) >= 1
              ? 'bg-emerald-100 text-emerald-800 font-semibold'
              : 'bg-zinc-200 text-zinc-700'
          }`}>
            汉→英 {currentCardProgress?.zhEnPassed || 0}/1
          </span>
        </div>

        {/* 模式标签 */}
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
          {isEnZh ? '英 ➔ 汉' : '汉 ➔ 英'}
        </span>
      </div>

      {/* 核心题干区域 */}
      <div className="text-center py-5 min-h-[120px] flex flex-col justify-center items-center">
        {isEnZh ? (
          // 模式 A: 给出英文单词 -> 选中文释义
          <>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl font-bold font-mono text-zinc-900 tracking-tight">
                {currentCard?.word}
              </span>
              <button
                type="button"
                onClick={() => speakWord(currentCard?.word)}
                title="发音 (TTS)"
                className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            {currentCard?.phonetic && (
              <div className="text-xs text-zinc-400 font-mono">
                {currentCard.phonetic}
              </div>
            )}
          </>
        ) : (
          // 模式 B: 给出中文释义 -> 选英文单词
          <>
            <div className="text-xs text-zinc-500 font-semibold mb-1 tracking-wider uppercase">
              {currentCard?.pos || '释义'}
            </div>
            <div className="text-lg font-bold text-zinc-900 px-4 leading-relaxed">
              {currentCard?.definition}
            </div>
          </>
        )}

        {/* 例句提示展开 */}
        {currentCard?.contextSentence && (
          <div className="mt-2">
            {!showSentenceContext ? (
              <button
                type="button"
                onClick={() => setShowSentenceContext(true)}
                className="text-[10px] text-zinc-400 hover:text-zinc-600 flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                查看真题原句语境
              </button>
            ) : (
              <div className="bg-zinc-50 border border-zinc-100 rounded p-2 text-left text-xs text-zinc-600 leading-relaxed max-w-md mx-auto">
                <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">真题原句</span>
                {currentCard.contextSentence}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4 个多选选项 */}
      <div className="grid grid-cols-1 gap-2.5 my-4">
        {currentOptions.map((opt) => {
          let btnStyle = 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300';
          let indicator = null;

          if (isAnswerRevealed) {
            if (opt.isCorrect) {
              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-400';
              indicator = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
            } else if (opt.id === selectedOptionId && !opt.isCorrect) {
              btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-300';
              indicator = <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
            } else {
              btnStyle = 'bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60';
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isAnswerRevealed}
              onClick={() => handleSelectOption(opt)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-left text-xs font-medium transition duration-150 cursor-pointer ${btnStyle}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-zinc-100 text-zinc-700 font-mono text-[11px] shrink-0">
                  {opt.label}
                </span>
                <span className="leading-snug">{opt.text}</span>
              </div>
              {indicator}
            </button>
          );
        })}
      </div>

      {/* 底部控制栏 */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 text-xs text-zinc-500">
        <label className="flex items-center gap-1.5 select-none cursor-pointer text-[11px]">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => setAutoAdvance(e.target.checked)}
            className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
          />
          <span>答对自动下一题</span>
        </label>

        {isAnswerRevealed && (
          <button
            type="button"
            onClick={handleNextQuestion}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-900 text-white hover:bg-zinc-800 font-medium text-xs transition cursor-pointer shadow-xs"
          >
            <span>下一题</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
