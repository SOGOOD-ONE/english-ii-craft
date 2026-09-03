import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api';

export default function VocabPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'due' | 'mastered' | 'all'>('due');
  const [idx, setIdx] = useState(0);

  // Always query all cards to get correct counts
  const { data: allRaw = { results: [] } } = useQuery<any>({
    queryKey: ['vocab-cards-all'],
    queryFn: () => api.vocab.cardsList({ page_size: 9999 }),
    staleTime: 0,
  });
  const allCards = allRaw.results ?? [];

  const { data: filteredRaw = { results: [] } } = useQuery<any>({
    queryKey: ['vocab-cards', filter],
    queryFn: () => api.vocab.cardsList({
      ...(filter === 'due' ? { due: 1 } : filter === 'mastered' ? { mastered: 1 } : {}),
      page_size: 9999,
    }),
    staleTime: 0,
  });
  const cards = filteredRaw.results ?? [];

  const reviewMut = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: 'Again' | 'Hard' | 'Good' | 'Easy' }) => api.vocab.cardsReview(id, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocab-cards'] });
      qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
      setIdx(i => i + 1);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.vocab.cardsDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocab-cards'] });
      qc.invalidateQueries({ queryKey: ['vocab-cards-all'] });
    },
  });

  const current = cards[Math.min(idx, cards.length - 1)];

  const counts = useMemo(() => {
    const all = allCards.length;
    const mastered = allCards.filter((c: any) => c.mastered).length;
    const due = all - mastered;
    return { all, mastered, due };
  }, [allCards]);

  // 导出为 CSV (兼容 Excel)
  const exportToCSV = () => {
    const header = ['单词', '音标', '释义', '掌握状态', '下次复习日期', '添加来源'];
    const rows = allCards.map((c: any) => {
      const word = c.word_detail?.lemma || c.word || '';
      const phonetic = c.word_detail?.phonetic || '';
      const meaning = senseText(c).replace(/"/g, '""');
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

  // 从 word_detail.senses 提取释义文本
  const senseText = (c: any): string => {
    if (!c.word_detail?.senses?.length) return '(待补充)';
    return c.word_detail.senses.map((s: any) => {
      const pos = s.pos ? (s.pos.endsWith('.') ? s.pos : s.pos + '.') : '';
      const def = s.definition || s.def || '';
      return `${pos} ${def}`.trim();
    }).join('；');
  };

  return (
    <div className="flex justify-center py-6">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded p-4 shadow-sm">
        <div className="border-b border-zinc-100 pb-2 mb-4 flex justify-between items-center">
          <span className="font-semibold text-zinc-800">FSRS 间隔复习流</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded border border-zinc-200 p-0.5">
              {(['due', 'all', 'mastered'] as const).map(k => (
                <button key={k} onClick={() => { setFilter(k); setIdx(0); }}
                  className={`px-2 py-0.5 rounded text-[11px] ${filter === k ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  {k === 'due' ? `待复习 ${counts.due}` : k === 'mastered' ? `已掌握 ${counts.mastered}` : `全部 ${counts.all}`}
                </button>
              ))}
            </div>
            <button onClick={exportToCSV} title="导出全部词汇为 Excel"
              className="text-[11px] px-2 py-0.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100">
              导出
            </button>
          </div>
        </div>

        {current ? (
          <div className="text-center py-4">
            {/* 单词 + 音标 */}
            <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900">{current.word_detail?.lemma || `#${current.word}`}</div>
            <div className="text-zinc-400 mb-3 font-mono text-sm">{current.word_detail?.phonetic || ''}</div>

            {/* 释义 */}
            <div className="bg-zinc-50 border border-zinc-100 rounded p-3 mb-2 text-left">
              <div className="text-zinc-800 text-xs leading-relaxed">{senseText(current)}</div>
            </div>

            {/* 原句 */}
            {current.context_sentence && (
              <div className="bg-zinc-50 border border-zinc-100 rounded p-3 text-left">
                <div className="text-zinc-500 text-[10px] mb-0.5">原句</div>
                <div className="text-zinc-700 text-xs leading-relaxed">{current.context_sentence}</div>
              </div>
            )}

            {/* 来源 */}
            <div className="text-[10px] text-zinc-400 text-left mt-1">来源: {current.source_path || '真题'}</div>

            {/* 评分按钮 */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-zinc-100 font-mono">
              {(['Again', 'Hard', 'Good', 'Easy'] as const).map(rating => (
                <button key={rating} onClick={() => reviewMut.mutate({ id: current.id, rating })}
                  disabled={reviewMut.isPending}
                  className="p-2 border border-zinc-200 hover:bg-zinc-100 rounded text-center text-xs disabled:opacity-50">
                  <div className="font-bold">{rating}</div>
                  <div className="text-zinc-400 text-[10px]">{current[`next_${rating.toLowerCase()}` as keyof typeof current] || '—'}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-400 text-xs">
            {filter === 'due' ? '暂无待复习的卡片 🎉' : '生词本为空，从其他页面划词添加吧'}
          </div>
        )}
      </div>
    </div>
  );
}