import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api';

export default function VocabPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'due' | 'mastered' | 'all'>('due');
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const { data: _raw = { results: [] } } = useQuery<any>({
    queryKey: ['vocab-cards', filter],
    queryFn: () => api.vocab.cardsList(
      filter === 'due' ? { due: 1 } : filter === 'mastered' ? { mastered: 1 } : {}
    ),
  });
  const cards = _raw.results ?? [];

  const reviewMut = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: 'Again' | 'Hard' | 'Good' | 'Easy' }) => api.vocab.cardsReview(id, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocab-cards'] });
      setShowBack(false);
      setIdx(i => i + 1);
    },
  });

  const current = cards[Math.min(idx, cards.length - 1)];

  const counts = useMemo(() => {
    const m = cards.filter((c: any) => c.mastered).length;
    return { all: cards.length, mastered: m, due: cards.length - m };
  }, [cards]);

  return (
    <div className="flex justify-center py-6">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded p-4 shadow-sm">
        <div className="border-b border-zinc-100 pb-2 mb-4 flex justify-between items-center">
          <span className="font-semibold text-zinc-800">FSRS 间隔复习流</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded border border-zinc-200 p-0.5">
              {(['due', 'all', 'mastered'] as const).map(k => (
                <button key={k} onClick={() => { setFilter(k); setIdx(0); setShowBack(false); }}
                  className={`px-2 py-0.5 rounded text-[11px] ${filter === k ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  {k === 'due' ? `待复习 ${counts.due}` : k === 'mastered' ? `已掌握 ${counts.mastered}` : `全部 ${counts.all}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {current ? (
          <>
            {/* 卡片正面 */}
            {!showBack && (
              <div className="text-center py-6">
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 mb-1">{current.word}</div>
                <div className="text-zinc-400 mb-4 font-mono">{current.phonetic || ''}</div>
                <div className="bg-zinc-50 p-3 rounded text-zinc-700 text-left border border-zinc-100 leading-relaxed font-mono text-xs">
                  "{current.context_sentence?.replace(current.word, '_______') || (current.word ? '...' + current.word + '...' : '')}"
                </div>
                <div className="text-[11px] text-zinc-400 text-left mt-1">来源标签: {current.source || '真题'}</div>
                <button onClick={() => setShowBack(true)} className="mt-6 w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-medium text-xs">
                  显示释义与完整原句 (Space)
                </button>
              </div>
            )}

            {/* 卡片背面 */}
            {showBack && (
              <div className="pt-2 border-t border-zinc-100">
                <div className="py-2 text-zinc-800 text-xs">
                  <strong>释义：</strong> {current.definition || '(待补充)'}
                </div>
                {current.context_sentence && (
                  <div className="py-1 text-zinc-600 text-xs">
                    <strong>原句：</strong> {current.context_sentence}
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-2 border-t border-zinc-100 font-mono">
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
            )}
          </>
        ) : (
          <div className="text-center py-12 text-zinc-400 text-xs">
            {filter === 'due' ? '暂无待复习的卡片 🎉' : '生词本为空，从其他页面划词添加吧'}
          </div>
        )}
      </div>
    </div>
  );
}