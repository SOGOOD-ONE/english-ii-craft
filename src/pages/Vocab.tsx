import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Layers,
  List,
  Search,
  Trash2,
  Volume2,
  CheckCircle2,
  Clock,
  BrainCircuit,
  FileSpreadsheet,
  FolderKanban,
  XCircle,
  PlayCircle,
  Plus,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/api';
import VocabQuizSession, { QuizCardItem } from '@/components/exam/VocabQuizSession';
import VocabImportModal from '@/components/exam/VocabImportModal';

const EMPTY_ARRAY: any[] = [];

export default function VocabPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'new' | 'due' | 'mastered' | 'all'>('new');
  const [viewMode, setViewMode] = useState<'quiz' | 'flashcard' | 'list'>('quiz');
  const [searchQuery, setSearchQuery] = useState('');
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionText: '',
    onConfirm: () => {},
  });

  // 1. 获取所有卡片用于全局统计与词库分组
  const { data: allRaw } = useQuery<any>({
    queryKey: ['vocab-cards-all'],
    queryFn: () => api.vocab.cardsList({ page_size: 9999 }),
    staleTime: 0,
  });
  const allCards = allRaw?.results ?? EMPTY_ARRAY;

  // 按 source_path (导入文件名 / 词库包) 进行归类分组
  const decks = useMemo(() => {
    const map: Record<string, { sourceName: string; total: number; mastered: number; newWords: number; due: number; cards: any[] }> = {};
    const now = new Date();

    for (const c of allCards) {
      const src = c.source_path || '默认词库包';
      if (!map[src]) {
        map[src] = { sourceName: src, total: 0, mastered: 0, newWords: 0, due: 0, cards: [] };
      }
      map[src].total += 1;
      if (c.mastered) {
        map[src].mastered += 1;
      } else if (c.reps > 0 && new Date(c.due) <= now) {
        map[src].due += 1;
      } else {
        map[src].newWords += 1;
      }
      map[src].cards.push(c);
    }

    return Object.values(map);
  }, [allCards]);

  // 2. 获取筛选后的卡片列表
  const { data: filteredRaw } = useQuery<any>({
    queryKey: ['vocab-cards', filter],
    queryFn: () =>
      api.vocab.cardsList({
        status: filter,
        page_size: 9999,
      }),
    staleTime: 0,
  });
  const rawCards = filteredRaw?.results ?? EMPTY_ARRAY;

  // 3. 规范化为 QuizCardItem 格式，并根据选中的词库包 (selectedSource) 进行筛选
  const formattedCards: QuizCardItem[] = useMemo(() => {
    const mapped = rawCards.map((c: any) => {
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
      const source = c.source_path || '默认词库包';
      return {
        id: c.id,
        word,
        phonetic,
        definition,
        pos,
        contextSentence: c.context_sentence,
        source,
        raw: c,
      };
    });

    if (selectedSource === 'all') return mapped;
    return mapped.filter(c => c.source === selectedSource);
  }, [rawCards, selectedSource]);

  const allFormattedCards: QuizCardItem[] = useMemo(() => {
    const mapped = allCards.map((c: any) => {
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
        source: c.source_path || '默认词库包',
        raw: c,
      };
    });

    if (selectedSource === 'all') return mapped;
    return mapped.filter(c => c.source === selectedSource);
  }, [allCards, selectedSource]);

  // 复习提交 Mutation
  const reviewMut = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: 'Again' | 'Hard' | 'Good' | 'Easy' }) =>
      api.vocab.cardsReview(id, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocab-cards'] });
      qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
    },
  });

  // 删除单张卡片 Mutation
  const deleteMut = useMutation({
    mutationFn: (id: number) => api.vocab.cardsDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocab-cards'] });
      qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
    },
  });

  // 清空全部生词库 Mutation
  const clearAllMut = useMutation({
    mutationFn: () => api.vocab.cardsClearAll(),
    onSuccess: (res) => {
      setToastMsg(res.message || '已清空全部生词库');
      setSelectedSource('all');
      qc.setQueryData(['vocab-cards-all'], { count: 0, results: [] });
      qc.setQueriesData({ queryKey: ['vocab-cards'] }, { count: 0, results: [] });
      qc.invalidateQueries({ queryKey: ['vocab-cards'] });
      qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
    },
    onError: (err: any) => {
      setToastMsg(`清空生词库失败: ${err?.response?.data?.detail || err?.message || '网络或接口异常'}`);
    },
  });

  // 删除单个词库包 Mutation
  const deleteDeckMut = useMutation({
    mutationFn: (src: string) => api.vocab.cardsDeleteBySource(src),
    onSuccess: (res, src) => {
      setToastMsg(res.message || `已删除词库《${src}》`);
      if (selectedSource === src) setSelectedSource('all');
      qc.invalidateQueries({ queryKey: ['vocab-cards'] });
      qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
    },
    onError: (err: any) => {
      setToastMsg(`删除词库失败: ${err?.response?.data?.detail || err?.message || '网络或接口异常'}`);
    },
  });

  const handleClearAllConfirm = () => {
    const isSingleDeck = selectedSource !== 'all';
    setConfirmModal({
      isOpen: true,
      title: isSingleDeck ? `确认清空词库《${selectedSource}》？` : '确认彻底清空全部生词库？',
      message: isSingleDeck
        ? `注意：此操作将彻底删除词包《${selectedSource}》下的所有单词卡片！若需删除所有词包，请选择“全局聚合”后再次清空。`
        : '注意：此操作将彻底删除您生词库里的全部单词卡片（包含所有分包），清空后不可恢复！',
      actionText: isSingleDeck ? `清空《${selectedSource}》` : '一键清空全部生词',
      onConfirm: () => {
        if (isSingleDeck) {
          deleteDeckMut.mutate(selectedSource);
        } else {
          clearAllMut.mutate();
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteDeckConfirm = (srcName: string) => {
    setConfirmModal({
      isOpen: true,
      title: `确认删除词库包《${srcName}》？`,
      message: `该词库文件包下的所有单词卡片将被彻底移除。`,
      actionText: '确定删除词包',
      onConfirm: () => {
        deleteDeckMut.mutate(srcName);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteCardConfirm = (cardId: number, wordName: string) => {
    setConfirmModal({
      isOpen: true,
      title: `确认删除单词 "${wordName}"？`,
      message: `删除后该卡片将从您的生词库中移除。`,
      actionText: '确定删除',
      onConfirm: () => {
        deleteMut.mutate(cardId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 统计数据 (受 selectedSource 影响)
  const counts = useMemo(() => {
    const list = selectedSource === 'all'
      ? allCards
      : allCards.filter((c: any) => (c.source_path || '默认词库包') === selectedSource);
    const now = new Date();
    const all = list.length;
    const mastered = list.filter((c: any) => c.mastered).length;
    const newWords = list.filter((c: any) => !c.mastered && (c.reps === 0 || !c.last_review)).length;
    const due = list.filter((c: any) => !c.mastered && c.reps > 0 && new Date(c.due) <= now).length;
    return { all, mastered, newWords, due };
  }, [allCards, selectedSource]);

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

  // 导出为 Excel (.xlsx) 表格
  const exportToExcel = (deckSource = selectedSource) => {
    const targetCards = deckSource === 'all'
      ? allCards
      : allCards.filter((c: any) => (c.source_path || '默认词库包') === deckSource);

    if (!targetCards || targetCards.length === 0) {
      setToastMsg('当前选中词库为空，无需导出');
      return;
    }

    const excelData = targetCards.map((c: any) => {
      const word = c.word_detail?.lemma || c.word || '';
      const phonetic = c.word_detail?.phonetic || '';
      const senses = c.word_detail?.senses || [];
      const meaning = senses.map((s: any) => `${s.pos || ''} ${s.definition || ''}`).join('；');
      const mastered = c.mastered ? '已掌握' : '未掌握';
      const dueDate = c.due ? new Date(c.due).toLocaleString('zh-CN') : '';
      const source = c.source_path || '词库导入';
      return {
        '单词 (Word)': word,
        '音标 (Phonetic)': phonetic,
        '释义 (Definition)': meaning,
        '掌握状态 (Status)': mastered,
        '下次复习时间 (Due)': dueDate,
        '所属词库 (Source)': source,
      };
    });

    const fileName = deckSource === 'all' ? '全部生词本' : deckSource;
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '考研生词');
    XLSX.writeFile(workbook, `${fileName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    <div className="max-w-4xl mx-auto py-3 sm:py-5 px-1.5 sm:px-3 space-y-4">
      {/* 统一工作台主容器 */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-100 bg-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* 左侧：标题与简单提示 */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shrink-0">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-bold text-zinc-900">考研生词库与高效背诵</h1>
                <p className="text-[10px] sm:text-[11px] text-zinc-500">按导入的文件分包存储，可选择单个词库打开精练背诵</p>
              </div>
            </div>

            {/* 右侧：操作按钮组 */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start">
              {/* 导入词库按钮 */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                title="导入自定义 Excel / 文本词库或考研精选词包"
                className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-zinc-300 bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>导入词库包</span>
              </button>

              {/* 导出按钮 */}
              <button
                type="button"
                onClick={() => exportToExcel()}
                title="导出当前词库为 Excel (.xlsx) 表格"
                className="flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-medium transition cursor-pointer bg-white shadow-2xs active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>导出 Excel</span>
              </button>

              {/* 清空所有词库按钮 */}
              {allCards.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllConfirm}
                  title="一键清空生词库中的所有单词"
                  className="flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-medium transition cursor-pointer bg-white active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>清空生词库</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 导入成功提示 Toast */}
        {toastMsg && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{toastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg('')}
              className="text-emerald-500 hover:text-emerald-800 text-[11px]"
            >
              关闭
            </button>
          </div>
        )}

        {/* 词库包列表管理器 (Lexicon Decks Section) */}
        <div className="p-4 bg-zinc-50/70 border-b border-zinc-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
              <FolderKanban className="w-4 h-4 text-zinc-700" />
              <span>我的词库包 ({decks.length} 个文件词库)</span>
            </div>
            {selectedSource !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedSource('all')}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer font-medium"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>重置为全部词库 ({allCards.length} 词)</span>
              </button>
            )}
          </div>

          {decks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {/* “全部词库”全局选项 */}
              <div
                onClick={() => setSelectedSource('all')}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedSource === 'all'
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                    : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    selectedSource === 'all' ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    全局聚合
                  </span>
                  <span className="text-[11px] font-mono font-semibold">{allCards.length} 词</span>
                </div>
                <div className="font-bold text-xs mb-1 truncate">全部词库集合</div>
                <div className="text-[10px] opacity-80 flex justify-between items-center mt-1">
                  <span>状态: {selectedSource === 'all' ? '已选择练习' : '点击打开'}</span>
                  {selectedSource === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </div>

              {/* 各个导入的文件词库包 */}
              {decks.map((deck) => {
                const isSelected = selectedSource === deck.sourceName;
                return (
                  <div
                    key={deck.sourceName}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950 text-white border-emerald-900 shadow-xs'
                        : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[120px] ${
                          isSelected ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          <FileSpreadsheet className="w-3 h-3 inline mr-1" />
                          词库包
                        </span>
                        <span className="text-[11px] font-mono font-semibold">{deck.total} 词</span>
                      </div>
                      <div className="font-bold text-xs mb-1 truncate" title={deck.sourceName}>
                        {deck.sourceName}
                      </div>
                      <div className={`text-[10px] mb-2 ${isSelected ? 'text-emerald-200' : 'text-zinc-500'}`}>
                        新词 {deck.newWords} / 待复习 {deck.due} / 已掌握 {deck.mastered}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-zinc-100/20 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedSource(deck.sourceName)}
                        className={`flex items-center gap-1 font-medium transition cursor-pointer px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-emerald-800 text-white font-bold'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                        }`}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{isSelected ? '已打开学习' : '选择打开'}</span>
                      </button>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => exportToExcel(deck.sourceName)}
                          className={`p-1 rounded transition cursor-pointer ${
                            isSelected ? 'hover:bg-emerald-800 text-emerald-200' : 'hover:bg-zinc-100 text-zinc-500'
                          }`}
                          title="导出此词库为 Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDeckConfirm(deck.sourceName)}
                          className={`p-1 rounded transition cursor-pointer ${
                            isSelected ? 'hover:bg-rose-900 text-rose-300' : 'hover:bg-rose-50 text-rose-600'
                          }`}
                          title="删除此词库包"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-6 text-center text-zinc-500 text-xs">
              <p className="font-semibold text-zinc-800 mb-1">当前暂无任何词库包</p>
              <p className="mb-3 text-zinc-400">点击右上角“导入词库包”上传您的 Excel / 文本表格或选择考研精选词包</p>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>立即导入词库包</span>
              </button>
            </div>
          )}
        </div>

        {/* 学习模式工具栏与过滤控制 */}
        <div className="px-4 py-3 bg-white border-b border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-800">当前选择:</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">
              {selectedSource === 'all' ? '全部词库集合' : selectedSource} ({counts.all} 词)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 新词初记 / 待复习 / 已掌握 / 全部 状态筛选 */}
            <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
              {(['new', 'due', 'mastered', 'all'] as const).map(k => (
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
                  {k === 'new'
                    ? `新词初记 (${counts.newWords})`
                    : k === 'due'
                    ? `待复习 (${counts.due})`
                    : k === 'mastered'
                    ? `已掌握 (${counts.mastered})`
                    : `全部 (${counts.all})`}
                </button>
              ))}
            </div>

            {/* 模式选择 (强化通关 / 翻卡 / 列表) */}
            <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
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
          </div>
        </div>

        {/* 主视图区域 */}
        <div className="p-5 bg-zinc-50/50 min-h-[400px] flex flex-col justify-center">
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
                    {filter === 'new'
                      ? '当前词库暂无未背过的【新词】🎉'
                      : filter === 'due'
                      ? '当前词库暂无【待复习】卡片 🎉'
                      : filter === 'mastered'
                      ? '当前词库暂无已【掌握】卡片'
                      : '当前词库暂无单词'}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-4">
                    {allCards.length === 0
                      ? '当前词库为空，点击上方“导入词库包”上传您的词表开始练习。'
                      : filter === 'new'
                      ? '您可以点击【待复习】复习旧词，或点击【全部】学习整个词库。'
                      : '您可以切换词库包，或点击“复习全部词库”继续巩固。'}
                  </p>
                  {allCards.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setFilter('all')}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition cursor-pointer shadow-xs"
                    >
                      复习全部词库 ({counts.all} 词)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition cursor-pointer shadow-xs inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>立即导入词库包</span>
                    </button>
                  )}
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
                    <span>{currentFlashcard.source || '词库导入'}</span>
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
                      onClick={() => handleDeleteCardConfirm(currentFlashcard.id, currentFlashcard.word)}
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
                  {filter === 'due' ? '当前词库暂无待复习的卡片 🎉' : '当前词库为空，请选择其他词库或导入词包'}
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
                    <th className="py-2.5 px-3">所属词库</th>
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
                        <td className="py-2.5 px-3 text-zinc-500 text-[11px] font-medium">
                          {c.source || '默认词库包'}
                        </td>
                        <td className="py-2.5 px-3">
                          {isMastered ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              已掌握
                            </span>
                          ) : c.raw?.reps > 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 font-medium">
                              <Clock className="w-3 h-3" />
                              待复习
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-medium">
                              <Sparkles className="w-3 h-3" />
                              新词未学
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCardConfirm(c.id, c.word)}
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

      {/* 导入词库 Modal */}
      <VocabImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(msg, importedSource) => {
          setToastMsg(msg);
          if (importedSource) {
            setSelectedSource(importedSource);
          }
          qc.invalidateQueries({ queryKey: ['vocab-cards'] });
          qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
        }}
      />

      {/* 自定义确认操作 Modal (不依赖 window.confirm，支持 iframe 预览环境) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-zinc-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600 font-bold">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-sm text-zinc-900 font-bold">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed mb-5">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-medium cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs cursor-pointer"
              >
                {confirmModal.actionText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
