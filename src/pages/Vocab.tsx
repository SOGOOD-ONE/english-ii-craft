import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Layers,
  List,
  Search,
  Download,
  Trash2,
  Volume2,
  CheckCircle2,
  Clock,
  BrainCircuit,
} from 'lucide-react';
import api from '@/api';
import VocabQuizSession, { QuizCardItem } from '@/components/exam/VocabQuizSession';

const EMPTY_ARRAY: any[] = [];

export default function VocabPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'due' | 'mastered' | 'all'>('due');
  const [viewMode, setViewMode] = useState<'quiz' | 'flashcard' | 'list'>('quiz');
  const [searchQuery, setSearchQuery] = useState('');
  const [flashcardIdx, setFlashcardIdx] = useState(0);

  // 1. 获取所有卡片用于全局统计
  const { data: allRaw } = useQuery<any>({
    queryKey: ['vocab-cards-all'],
    queryFn: () => api.vocab.cardsList({ page_size: 9999 }),
    staleTime: 0,
  });
  const allCards = allRaw?.results ?? EMPTY_ARRAY;

  // 2. 获取筛选后的卡片列表
  const { data: filteredRaw } = useQuery<any>({
    queryKey: ['vocab-cards', filter],
    queryFn: () =>
      api.vocab.cardsList({
        ...(filter === 'due' ? { due: 1 } : filter === 'mastered' ? { mastered: 1 } : {}),
        page_size: 9999,
      }),
    staleTime: 0,
  });
  const rawCards = filteredRaw?.results ?? EMPTY_ARRAY;

  // 3. 规范化为 QuizCardItem 格式
  const formattedCards: QuizCardItem[] = useMemo(() => {
    return rawCards.map((c: any) => {
      const word = c.word_detail?.lemma || c.word || '';
      const phonetic = c.word_detail?.phonetic || '';
      const senses = c.word_detail?.senses || [];
      const definition = senses.length > 0
        ? senses.map((s: any) => {
            const p = s.pos ? (s.pos.endsWith('.') ? s.pos : s.pos + '.') : '';
            return `${p} ${s.definition || s.def || ''}`.trim();
          }).join('；')
        : '考研重点词汇';
      const pos = senses[0]?.pos || 'n./v.';
      return {
        id: c.id,
        word,
        phonetic,
        definition,
        pos,
        contextSentence: c.context_sentence,
        source: c.source_path,
        raw: c,
      };
    });
  }, [rawCards]);

  const allFormattedCards: QuizCardItem[] = useMemo(() => {
    return allCards.map((c: any) => {
      const word = c.word_detail?.lemma || c.word || '';
      const phonetic = c.word_detail?.phonetic || '';
      const senses = c.word_detail?.senses || [];
      const definition = senses.length > 0
        ? senses.map((s: any) => {
            const p = s.pos ? (s.pos.endsWith('.') ? s.pos : s.pos + '.') : '';
            return `${p} ${s.definition || s.def || ''}`.trim();
          }).join('；')
        : '考研重点词汇';
      return {
        id: c.id,
        word,
        phonetic,
        definition,
        raw: c,
      };
    });
  }, [allCards]);

  // 复习提交 Mutation
  const reviewMut = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: 'Again' | 'Hard' | 'Good' | 'Easy' }) =>
      api.vocab.cardsReview(id, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocab-cards'] });
      qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
    },
  });

  // 删除卡片 Mutation
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.vocab.cardsDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocab-cards'] });
      qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
    },
  });

  // 统计数据
  const counts = useMemo(() => {
    const list = allRaw?.results || [];
    const all = list.length;
    const mastered = list.filter((c: any) => c.mastered).length;
    const due = all - mastered;
    return { all, mastered, due };
  }, [allRaw?.results]);

  // 当前复习批次卡片
  const activeQuizCards = formattedCards;

  // 单词发音 (TTS)
  const speakWord = (word: string) => {
    if (!word || typeof window === 'undefined') return;
    try {
      window.speechSynthesis?.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis?.speak(utter);
    } catch {}
  };

  // 导出为 CSV (兼容 Excel)
  const exportToCSV = () => {
    const header = ['单词', '音标', '释义', '掌握状态', '下次复习日期', '添加来源'];
    const rows = allCards.map((c: any) => {
      const word = c.word_detail?.lemma || c.word || '';
      const phonetic = c.word_detail?.phonetic || '';
      const senses = c.word_detail?.senses || [];
      const meaning = (senses.map((s: any) => `${s.pos || ''} ${s.definition || ''}`).join('；')).replace(/"/g, '""');
      const mastered = c.mastered ? '已掌握' : '未掌握';
      const dueDate = c.due ? new Date(c.due).toLocaleString('zh-CN') : '';
      const source = c.source_path || '';
      return [word, phonetic, `"${meaning}"`, mastered, dueDate, source].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-vocab-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentFlashcard = formattedCards[Math.min(flashcardIdx, Math.max(0, formattedCards.length - 1))];

  // 过滤搜索列表
  const searchedCards = useMemo(() => {
    if (!searchQuery.trim()) return formattedCards;
    const q = searchQuery.toLowerCase();
    return formattedCards.filter(
      c => c.word.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q)
    );
  }, [formattedCards, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto py-5 px-3">
      {/* 统一工作台主容器 */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="p-4 border-b border-zinc-100 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* 左侧：标题 */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-zinc-900">生词复习</h1>
              </div>
            </div>

            {/* 右侧：过滤与模式切换 */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 待复习 / 已掌握 / 全部 筛选器 */}
              <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 bg-zinc-50 text-xs">
                {(['due', 'all', 'mastered'] as const).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setFilter(k);
                      setFlashcardIdx(0);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                      filter === k ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/60'
                    }`}
                  >
                    {k === 'due' ? `待复习 (${counts.due})` : k === 'mastered' ? `已掌握 (${counts.mastered})` : `全部 (${counts.all})`}
                  </button>
                ))}
              </div>

              {/* 模式选择 (强化通关 / 翻卡 / 列表) */}
              <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 bg-zinc-50 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('quiz')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    viewMode === 'quiz' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/60'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>强化通关</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('flashcard')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    viewMode === 'flashcard' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/60'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>翻卡记忆</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    viewMode === 'list' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/60'
                  }`}
                >
                  <List className="w-3 h-3" />
                  <span>词库清单</span>
                </button>
              </div>

              {/* 导出按钮 */}
              <button
                type="button"
                onClick={exportToCSV}
                title="导出全部生词为 CSV/Excel"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition cursor-pointer bg-white"
              >
                <Download className="w-3 h-3" />
                <span>导出</span>
              </button>
            </div>
          </div>
        </div>

        {/* 主视图区域 */}
        <div className="p-5 bg-zinc-50/50 min-h-[420px] flex flex-col justify-center">
          {/* 视图 1: 智能强化通关 */}
          {viewMode === 'quiz' && (
            <div className="w-full">
              {formattedCards.length > 0 ? (
                <VocabQuizSession
                  cards={activeQuizCards}
                  allDictionaryCards={allFormattedCards}
                  onReviewSubmit={(cardId, rating) => {
                    reviewMut.mutate({ id: cardId, rating });
                  }}
                  onFinishSession={() => {
                    qc.invalidateQueries({ queryKey: ['vocab-cards'] });
                    qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
                  }}
                  onBackToOverview={() => {
                    setViewMode('list');
                  }}
                />
              ) : (
                <div className="w-full max-w-lg mx-auto bg-white border border-zinc-200 rounded-xl p-8 text-center shadow-xs my-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">
                    {filter === 'due' ? '今日生词已全部掌握 🎉' : '暂无符合条件的单词卡片'}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-4">
                    在阅读、翻译、完形各页面中划词或点击，即可一键将重点词汇加入生词本。
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition cursor-pointer shadow-xs"
                  >
                    复习全部词库 ({counts.all} 词)
                  </button>
                </div>
              )}
            </div>
          )}

        {/* 视图 2: 经典翻卡复习模式 (Flashcard) */}
        {viewMode === 'flashcard' && (
          <div className="flex justify-center my-2">
            <div className="w-full max-w-xl bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
              {currentFlashcard ? (
                <div className="text-center py-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-mono">
                    <span>卡片 {Math.min(flashcardIdx + 1, formattedCards.length)} / {formattedCards.length}</span>
                    <span>{currentFlashcard.source || '真题词汇'}</span>
                  </div>

                  {/* 单词 + 音标 + 发音 */}
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900">
                      {currentFlashcard.word}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakWord(currentFlashcard.word)}
                      className="p-1 rounded-full text-zinc-400 hover:text-zinc-800 transition cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-zinc-400 mb-4 font-mono text-xs">
                    {currentFlashcard.phonetic || ''}
                  </div>

                  {/* 释义 */}
                  <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3.5 mb-3 text-left">
                    <div className="text-[10px] text-zinc-400 font-semibold mb-1">核心释义</div>
                    <div className="text-zinc-800 text-xs leading-relaxed font-medium">
                      {currentFlashcard.definition}
                    </div>
                  </div>

                  {/* 原句 */}
                  {currentFlashcard.contextSentence && (
                    <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 mb-3 text-left">
                      <div className="text-zinc-400 text-[10px] font-semibold mb-0.5">真题语境原句</div>
                      <div className="text-zinc-700 text-xs leading-relaxed">
                        {currentFlashcard.contextSentence}
                      </div>
                    </div>
                  )}

                  {/* FSRS 评分控制 */}
                  <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-zinc-100 font-mono text-xs">
                    {(['Again', 'Hard', 'Good', 'Easy'] as const).map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => {
                          reviewMut.mutate({ id: currentFlashcard.id, rating });
                          setFlashcardIdx(i => i + 1);
                        }}
                        disabled={reviewMut.isPending}
                        className="p-2 border border-zinc-200 hover:bg-zinc-100 rounded-lg text-center transition cursor-pointer disabled:opacity-50"
                      >
                        <div className="font-bold text-zinc-900">{rating}</div>
                        <div className="text-zinc-400 text-[10px]">
                          {rating === 'Again' ? '重学' : rating === 'Hard' ? '困难' : rating === 'Good' ? '良好' : '简单'}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 删除与跳转 */}
                  <div className="flex items-center justify-between mt-3 pt-2 text-[11px] text-zinc-400">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('确认从生词本中删除此卡片？')) {
                          deleteMut.mutate(currentFlashcard.id);
                        }
                      }}
                      className="hover:text-rose-600 underline cursor-pointer"
                    >
                      删除词卡
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={flashcardIdx === 0}
                        onClick={() => setFlashcardIdx(i => Math.max(0, i - 1))}
                        className="hover:text-zinc-700 disabled:opacity-30 cursor-pointer"
                      >
                        上一张
                      </button>
                      <button
                        type="button"
                        disabled={flashcardIdx >= formattedCards.length - 1}
                        onClick={() => setFlashcardIdx(i => i + 1)}
                        className="hover:text-zinc-700 disabled:opacity-30 cursor-pointer"
                      >
                        下一张
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  {filter === 'due' ? '暂无待复习的卡片 🎉' : '生词本为空，从其他页面划词添加吧'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 视图 3: 词库清单管理模式 (List) */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg p-2">
            {/* 搜索与快捷入口 */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="搜索生词或中文释义..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <button
                type="button"
                onClick={() => setViewMode('quiz')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>开始智能通关复习</span>
              </button>
            </div>

            {/* 表格列表 */}
            <div className="overflow-x-auto border border-zinc-100 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">单词 / 音标</th>
                    <th className="py-2.5 px-3">核心释义</th>
                    <th className="py-2.5 px-3">真题来源</th>
                    <th className="py-2.5 px-3">状态</th>
                    <th className="py-2.5 px-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {searchedCards.map((c) => {
                    const isMastered = c.raw?.mastered;
                    return (
                      <tr key={c.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-zinc-900">{c.word}</span>
                            <button
                              type="button"
                              onClick={() => speakWord(c.word)}
                              className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">{c.phonetic}</div>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-700 max-w-xs">
                          <div className="line-clamp-2 leading-relaxed">{c.definition}</div>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 text-[11px]">
                          {c.source || '阅读真题'}
                        </td>
                        <td className="py-2.5 px-3">
                          {isMastered ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              已掌握
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 font-medium">
                              <Clock className="w-3 h-3" />
                              复习中
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`确认删除单词 "${c.word}"？`)) {
                                deleteMut.mutate(c.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="删除词卡"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {searchedCards.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-400 text-xs">
                        未检索到匹配单词
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
