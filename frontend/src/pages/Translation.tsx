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
  const { data } = useQuery<TranslationData>({
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
      setDiff(r);
    } catch (e: any) {
      alert(e?.response?.data?.detail || '提交失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-white border border-zinc-200 rounded p-3">
        <div className="border-b border-zinc-100 pb-2 mb-3 flex justify-between items-center">
          <span className="font-semibold text-zinc-800">{year}年英语二真题翻译 · 句子切片精修</span>
          <YearPicker years={(years || []).map(y => y.year)} value={year} onChange={y => { setYear(y); setActiveSlice(null); setDiff(null); }} />
        </div>

        {slices.map((s, i) => (
          <div key={s.id} className={`border rounded p-3 mb-3 ${activeSlice === s.id ? 'border-zinc-900 bg-zinc-50/70' : 'border-zinc-200 bg-zinc-50/50'}`}>
            <div className="font-mono text-zinc-800 text-xs mb-2">
              <strong>[英文原句 {i + 1}]</strong> {s.text}
            </div>
            {activeSlice === s.id ? (
              <>
                <div className="mb-2">
                  <textarea value={draft} onChange={e => setDraft(e.target.value)}
                    className="w-full p-2 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 text-xs" rows={2}
                    placeholder="在此输入你的译文..." />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-[11px]">点击提交即可查看字符级 Diff 对比与考点透视</span>
                  <button disabled={busy} onClick={onSubmit}
                    className="bg-zinc-900 text-white px-3 py-1 rounded text-xs disabled:opacity-60">
                    {busy ? '提交中...' : '提交并对比差异'}
                  </button>
                </div>
                {diff && (
                  <div className="mt-3 pt-3 border-t border-zinc-200">
                    <div className="font-semibold text-zinc-700 mb-1">译文差异比对 (Diff):</div>
                    <div className="bg-white p-2 border border-zinc-200 rounded font-mono text-xs leading-relaxed">
                      参考译文: {s.refZh || '(待补充)'}
                    </div>
                    {s.points.length > 0 && (
                      <div className="mt-2 text-zinc-600 bg-zinc-100 p-2 rounded leading-normal text-xs">
                        <strong>考点解析：</strong>
                        {s.points.map((p, j) => <div key={j}>{j + 1}. {p}</div>)}
                      </div>
                    )}
                    {s.pitfalls.length > 0 && (
                      <div className="mt-1 text-amber-700 bg-amber-50 p-2 rounded leading-normal text-xs">
                        <strong>易错陷阱：</strong>
                        {s.pitfalls.map((p, j) => <div key={j}>{j + 1}. {p}</div>)}
                      </div>
                    )}
                    {diff.diff_text && (
                      <div className="mt-2 bg-white p-2 border border-zinc-200 rounded font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {diff.diff_text}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-[11px]">{s.refZh ? '参考译文: ' + s.refZh.slice(0, 40) + '…' : '点击下方按钮开始翻译'}</span>
                <button onClick={() => onFocusSlice(s)} className="bg-zinc-900 text-white px-3 py-1 rounded text-xs">开始翻译</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}