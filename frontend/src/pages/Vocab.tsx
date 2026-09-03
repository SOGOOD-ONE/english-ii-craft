import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { useAuthStore } from '@/store/auth';

export default function VocabPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'due' | 'mastered' | 'all'>('due');
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const { data: cards = [] } = useQuery({
    queryKey: ['vocab-cards', filter],
    queryFn: () => api.vocab.cardsList(
      filter === 'due' ? { due: 1 } : filter === 'mastered' ? { mastered: 1 } : {}
    ),
  });

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
    // 简单统计:按当前加载的数据做个概览
    const m = cards.filter((c: any) => c.mastered).length;
    return { all: cards.length, mastered: m, due: cards.length - m };
  }, [cards]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">🧠 生词本 FSRS · 间隔复习</h1>
          <p className="text-slate-500 text-sm mt-1">
            登录账号:{useAuthStore.getState().user?.username || '(未登录,会被跳走)'} · Good/Easy 累计 2 次即自动掌握。
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
          {(['due', 'all', 'mastered'] as const).map(k => (
            <button key={k} onClick={() => { setFilter(k); setIdx(0); }}
              className={`px-3 py-1 rounded-md text-sm ${filter === k ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              {k === 'due' ? `待复习 (${counts.due})` : k === 'mastered' ? `已掌握 (${counts.mastered})` : `全部 (${counts.all})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 p-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 min-h-[360px] flex flex-col items-center justify-center text-center space-y-5">
          {!current ? (
            <div className="text-slate-400">没有卡啦 ~ 去翻译/写作/阅读页 hover 任意英文单词,点「➕ 生词本」就可以加进来。</div>
          ) : (
            <>
              <div className="text-xs uppercase tracking-wide text-slate-500">Card {idx + 1} / {cards.length} · Due {current.due ? new Date(current.due).toLocaleString() : '-'}</div>
              <div className="text-4xl md:text-5xl font-bold tracking-tight">{current.word_detail?.lemma || '?'}</div>
              {current.word_detail?.phonetic && <div className="text-slate-500">{current.word_detail.phonetic}</div>}
              {current.context_sentence && <div className="max-w-xl text-slate-500 text-sm italic">「{current.context_sentence}」</div>}
              {showBack && (
                <div className="text-left max-w-xl w-full p-4 rounded-md bg-slate-50 dark:bg-slate-800/70 space-y-2">
                  {(current.word_detail?.senses || []).map((s: any, i: number) => (
                    <div key={i} className="text-sm leading-6"><span className="text-violet-600 mr-2 text-xs font-semibold">{s.pos || ''}</span>{s.definition || s.desc || JSON.stringify(s)}</div>
                  ))}
                  {current.word_detail?.collocations?.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-xs uppercase text-slate-500 mb-1">搭配</div>
                      <div className="flex gap-2 flex-wrap">
                        {(current.word_detail.collocations || []).map((c: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 text-xs rounded bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!showBack ? (
                <button onClick={() => setShowBack(true)} className="px-6 py-2 rounded-md border border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
                  显示释义 / 搭配
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-3 w-full max-w-md">
                  {(['Again', 'Hard', 'Good', 'Easy'] as const).map((r, i) => {
                    const color = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500'][i];
                    return (
                      <button key={r} disabled={reviewMut.isPending} onClick={() => reviewMut.mutate({ id: current.id, rating: r })}
                        className={`py-2 rounded-md text-white ${color} hover:opacity-90 disabled:opacity-50`}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="font-semibold mb-2">学习进度(当前筛选)</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">待复习</span><b>{counts.due}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">已掌握</span><b>{counts.mastered}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">总数</span><b>{counts.all}</b></div>
            </div>
          </div>
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-500 leading-6 space-y-1">
            <div className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-200">评分说明</div>
            <div><b>Again</b> 忘记了(重学,间隔归零)</div>
            <div><b>Hard</b> 有印象,但比较难</div>
            <div><b>Good</b> 犹豫了一下答出来</div>
            <div><b>Easy</b> 一眼秒回</div>
          </div>
        </div>
      </div>
    </div>
  );
}
