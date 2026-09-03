import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import YearPicker from '@/components/common/YearPicker';
import api from '@/api';
import type { TranslationData, TranslationSlice } from '@/types';

const MODULE = 'translation' as const;

export default function TranslationPage() {
  const [year, setYear] = useState(2025);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [diff, setDiff] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const { data: years } = useQuery({ queryKey: ['exam-years', MODULE], queryFn: () => api.exam.years(MODULE) });
  const { data, error } = useQuery<TranslationData>({
    queryKey: ['exam-content', MODULE, year],
    queryFn: async () => {
      try { return await api.exam.content<TranslationData>(MODULE, year); } catch {
        const fallback = (await import.meta.glob('@/content/translation/*.json', { eager: true, import: 'default' }))[`/src/content/translation/${year}.json`];
        return fallback as TranslationData;
      }
    },
  });

  const slices: TranslationSlice[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.slices) && data.slices.length > 0) return data.slices;
    const text = data.source || '';
    const toks = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+['\"]?\s*/g) || [text];
    return toks.map((t, i) => ({
      id: `s${i + 1}`, start: 0, end: 0, text: t.trim(),
      refZh: '', points: [], pitfalls: [], vocabIds: [],
    })).filter(s => s.text.length >= 4);
  }, [data]);

  function onFocusSlice(s: TranslationSlice) {
    setActiveSlice(s.id);
    setDraft('');
    setDiff(null);
  }

  async function onSubmit() {
    if (!activeSlice || !draft.trim()) return;
    setBusy(true);
    try {
      const cur = slices.find(s => s.id === activeSlice)!;
      const r = await api.translation.attemptCreate({
        year, slice_id: activeSlice, source_text: cur.text, user_translation: draft,
      });
      setDiff(r.diff_report || null);
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || '提交失败,未登录时不能保存翻译(但你可以在前端本地做参考)');
    } finally {
      setBusy(false);
    }
  }

  const cur = slices.find(s => s.id === activeSlice);
  const refZh = cur?.refZh || data?.refZh || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">✍️ 段落翻译 · 逐句精修 Diff</h1>
          <p className="text-slate-500 text-sm mt-1">逐句提交 · Diff 红绿高亮 · 后端入库跨设备</p>
        </div>
        <YearPicker years={(years || []).map(y => y.year)} value={year} onChange={(y) => { setYear(y); setActiveSlice(null); }} />
      </div>

      <section className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{data?.title || `${year} 年英译汉真题`}</div>
        <div className="text-[15px] leading-8 space-y-3">
          {slices.length ? slices.map(s => (
            <button key={s.id}
              onClick={() => onFocusSlice(s)}
              className={`block w-full text-left rounded-md px-3 -mx-3 py-1.5 transition ${activeSlice === s.id ? 'bg-violet-50 dark:bg-violet-900/30 ring-1 ring-violet-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
              <span className="mr-2 text-slate-400 text-xs">#{s.id}</span>
              {s.text}
              {s.refZh && <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">有参考译文</span>}
            </button>
          )) : <div className="text-slate-500">{data?.source || '加载中…'}</div>}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
          <div className="font-semibold">我的翻译{cur ? ` · 选中 #${cur.id}` : ''}</div>
          {refZh && <div className="text-xs text-emerald-700 dark:text-emerald-300">📌 后端有参考译文,提交后自动比对</div>}
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            disabled={!activeSlice}
            placeholder={activeSlice ? '在此输入这一句的中文翻译…' : '先点上方任意一句选中'}
            className="w-full h-48 rounded-md border border-slate-300 dark:border-slate-600 p-3 bg-transparent text-sm leading-7" />
          <button disabled={!activeSlice || busy} onClick={onSubmit}
            className="w-full py-2 rounded-md bg-violet-600 text-white disabled:opacity-60">{busy ? '提交并比对中…' : '提交翻译并对比'}</button>
        </section>

        <section className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
          <div className="font-semibold">Diff 精修面板</div>
          {cur && <div className="text-xs text-slate-500">原句: {cur.text}</div>}
          {!diff ? <div className="text-slate-400 text-sm">翻译后点击提交,这里会显示你 vs 参考的字符级 Diff。
            <br />{refZh ? '' : '⚠️ 该年份 refZh 仍待补,先拿你自己的译文练习即可。'}</div> : (
              <div className="text-sm leading-7 p-3 rounded-md bg-slate-50 dark:bg-slate-800/70 space-y-1">
                {(diff.diffs || []).map((d: any, i: number) => {
                  const [op, text] = d as [number, string];
                  const cls = op === -1 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 line-through decoration-red-400' : op === 1 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200' : '';
                  return <span key={i} className={cls}>{text}</span>;
                })}
              </div>
            )}
          {refZh && (
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">参考译文</div>
              <div className="text-sm leading-7 p-3 rounded-md border border-slate-200 dark:border-slate-700">{refZh}</div>
            </div>
          )}
        </section>
      </div>
      {error && <div className="text-sm text-amber-600 p-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
        后端 API 不可用,已降级到前端本地副本。
      </div>}
    </div>
  );
}
