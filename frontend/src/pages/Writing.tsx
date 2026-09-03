import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import YearPicker from '@/components/common/YearPicker';
import api from '@/api';
import type { WritingData } from '@/types';

const MODULE = 'writing' as const;

export default function WritingPage() {
  const [year, setYear] = useState<number>(2025);
  const [essay, setEssay] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [aiCfg, setAiCfg] = useState<{ available: boolean; effective_model: string } | null>(null);

  const { data: years } = useQuery({
    queryKey: ['exam-years', MODULE],
    queryFn: () => api.exam.years(MODULE),
  });

  const { data: paper, error } = useQuery<WritingData>({
    queryKey: ['exam-content', MODULE, year],
    queryFn: async () => {
      try { return await api.exam.content<WritingData>(MODULE, year); } catch {
        // 开发兜底:读本地 content JSON
        const fallback = await import.meta.glob('@/content/writing/*.json', { eager: true, import: 'default' })[`/src/content/writing/${year}.json`];
        return fallback as WritingData;
      }
    },
  });

  // 可选: 拉 AI 可用状态
  useEffect(() => {
    api.writing.aiConfig().then(setAiCfg).catch(() => void 0);
  }, []);

  const chartInfo = useMemo(() => {
    if (!paper) return '';
    const keys = (paper as any).keyPoints || [];
    const lines = [`${paper.year || year} 年考研英语二图表作文真题`];
    if (paper.title) lines.push(paper.title);
    if (paper.prompt) lines.push(paper.prompt);
    keys.length && lines.push(`核心采分数据:${keys.join('; ')}`);
    return lines.join('\n');
  }, [paper, year]);

  async function onReview() {
    if (!essay || essay.trim().length < 30) { alert('作文至少 30 词才能批改哦'); return; }
    setBusy(true);
    setResult(null);
    try {
      const r = await api.writing.reviewCreate({ year, essay, chart_info: chartInfo });
      setResult(r);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'AI 批改失败';
      alert(msg);
    } finally {
      setBusy(false);
    }
  }

  const Y = (years || []).find(x => x.year === year);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">📊 图表大作文 · AI 维度批改</h1>
          <p className="text-slate-500 text-sm mt-1">考纲 4 维打分 · 逐句高分润色 · 40 分写作攻坚</p>
        </div>
        <div className="flex items-center gap-4">
          <YearPicker years={(years || []).map(y => y.year)} value={year} onChange={setYear} />
          {aiCfg && (
            <div className={`text-xs px-2.5 py-1 rounded-full border ${aiCfg.available ? 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-700' : 'text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700'}`}>
              {aiCfg.available ? `AI 已接入 · ${aiCfg.effective_model}` : 'AI 未配置:请在设置页填 Key'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">真题原题背景</div>
            <div className="font-semibold text-lg">{paper?.title || (Y ? `${year} 年真题` : '加载中…')}</div>
          </div>
          {paper?.chart && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">类型: </span><b>{(paper.chart as any).type || '-'}</b></div>
              <div><span className="text-slate-500">主题: </span><b>{(paper.chart as any).topic || '-'}</b></div>
            </div>
          )}
          {(paper as any)?.keyPoints?.length ? (
            <ul className="list-disc pl-5 text-sm space-y-1">
              {(paper as any).keyPoints.map((p: string, i: number) => <li key={i}>{p}</li>)}
            </ul>
          ) : null}
          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/70 text-sm whitespace-pre-wrap leading-7">{paper?.prompt || '该年份写作真题 JSON 暂无题干'}</div>
        </section>

        <section className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">在此写作你的大作文</div>
            <div className="text-xs text-slate-500">{essay.length} 字</div>
          </div>
          <textarea value={essay} onChange={e => setEssay(e.target.value)}
            placeholder="The chart above clearly illustrates that ..."
            className="w-full h-72 rounded-md border border-slate-300 dark:border-slate-600 p-3 text-sm leading-7 bg-transparent resize-y" />
          <button disabled={busy} onClick={onReview}
            className="w-full py-2.5 rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
            {busy ? '批改分析中(约 2 秒)…' : '执行 AI 维度批改'}
          </button>
        </section>
      </div>

      {result && (
        <section className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold">批改结果</h2>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-extrabold text-violet-600">{(+result.total_score).toFixed(1)}</div>
              <div className="text-slate-500">/ 15 分</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { k: 's_data', n: '数据完整度', full: 4 },
              { k: 's_logic', n: '归因论述逻辑', full: 4 },
              { k: 's_vocab', n: '词汇句式丰富度', full: 4 },
              { k: 's_grammar', n: '语法与拼写', full: 3 },
            ].map(c => (
              <div key={c.k} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                <div className="flex justify-between text-sm mb-2"><span className="text-slate-500">{c.n}</span><b>{(+(result as any)[c.k]).toFixed(1)}/{c.full}</b></div>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${(+(result as any)[c.k] / c.full * 100).toFixed(0)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">📊 数据完整度评价</div>
              <div className="text-sm leading-6">{result.data_feedback || '-'}</div>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">🧠 归因论述逻辑</div>
              <div className="text-sm leading-6">{result.logic_feedback || '-'}</div>
            </div>
          </div>
          {result.corrections?.length > 0 && (
            <div className="space-y-3">
              <div className="font-semibold">✏️ 逐句高分润色 ({result.corrections.length})</div>
              <div className="space-y-3">
                {result.corrections.map((c: any, i: number) => (
                  <div key={i} className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 text-sm">#{i + 1}</div>
                    <div className="space-y-2">
                      <div className="px-2.5 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm">
                        <span className="mr-2 text-red-600 dark:text-red-300 text-xs font-semibold">原句</span>{c.original}
                      </div>
                      <div className="px-2.5 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm">
                        <span className="mr-2 text-emerald-600 dark:text-emerald-300 text-xs font-semibold">推荐</span>{c.improved}
                      </div>
                      <div className="text-xs text-slate-500">💡 {c.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="p-4 rounded-lg bg-slate-900 dark:bg-black/40 text-slate-50 text-sm leading-7 border border-slate-800">
            🎯 {result.summary || '总体总结生成失败'}
            {result.error_message && <div className="mt-2 text-red-300 text-xs">⚠️ {result.error_message}</div>}
          </div>
        </section>
      )}

      {error && <div className="text-sm text-amber-600 p-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
        后端真题 API 暂时不可用,已降级到前端内置真题副本。稍后启动 Django 即可。
      </div>}
    </div>
  );
}
