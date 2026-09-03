'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import YearPicker from '@/components/common/YearPicker';
import { YEARS, getWriting } from '@/content';
import { reviewEssay as reviewZhipuEssay } from '@/lib/ai/zhipu';
import type { ZhipuEssayReview, WritingData } from '@/types';

// ECharts 仅客户端渲染
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const SCAFFOLD_GROUPS: { key: 'trends' | 'comparisons' | 'reasons'; label: string }[] = [
  { key: 'trends', label: '趋势表达' },
  { key: 'comparisons', label: '对比表达' },
  { key: 'reasons', label: '归因分析' },
];

function hasChart(d: WritingData | undefined) {
  return !!d && !!d.chartType && d.chartOption && Object.keys(d.chartOption).length > 0;
}

/** 组装 chartInfo:给 AI 的图表背景(极值/对比/趋势),优先用 keyPoints,其次 prompt */
function buildChartInfo(data: WritingData | undefined, year: number): string {
  const parts: string[] = [];
  parts.push(`年份: ${year} 年考研英语二图表大作文`);
  if (data?.title) parts.push(`图表标题:${data.title}`);
  if (data?.chartType) parts.push(`图表类型:${data.chartType}`);
  if (data?.keyPoints && data.keyPoints.length > 0) {
    parts.push('核心采分数据:');
    data.keyPoints.forEach((p, i) => parts.push(`  ${i + 1}. ${p}`));
  }
  if (data?.prompt) parts.push(`题面原文:\n${data.prompt}`);
  return parts.join('\n');
}

const DIMS: { key: keyof ZhipuEssayReview['scores']; label: string; full: number; color: string }[] = [
  { key: 'data', label: '数据完整度', full: 4, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { key: 'logic', label: '归因论述逻辑', full: 4, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { key: 'vocab', label: '词汇句式丰富度', full: 4, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { key: 'grammar', label: '语法与拼写', full: 3, color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

export default function WritingPage() {
  const years = YEARS.writing;
  const [year, setYear] = useState<number>(years.includes(2023) ? 2023 : years[0]);
  const data = getWriting(year);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [essay, setEssay] = useState('');
  const [review, setReview] = useState<ZhipuEssayReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usedDefaultKey, setUsedDefaultKey] = useState(false);

  const wordCount = useMemo(
    () => (essay.trim() ? essay.trim().split(/\s+/).length : 0),
    [essay]
  );

  const insertAtCursor = (text: string) => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = essay.slice(0, start) + ' ' + text + ' ' + essay.slice(end);
    setEssay(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionEnd = start + text.length + 2;
    });
  };

  const runReview = async () => {
    setError('');
    setReview(null);
    if (!essay.trim() || wordCount < 30) {
      setError('请先写一段作文(建议 30 词以上)再进行批改哦。');
      return;
    }
    setLoading(true);
    setUsedDefaultKey(false);
    try {
      const chartInfo = buildChartInfo(data, year);
      const report = await reviewZhipuEssay(chartInfo, essay);
      setReview(report);
      // 如果没报错且用户没填自定义配置,说明走了默认 Key,显示提示
      const { loadAiConfig } = await import('@/lib/ai/client');
      const cfg = loadAiConfig();
      setUsedDefaultKey(!cfg || !cfg.apiKey || cfg.apiKey.length === 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 批改失败');
    } finally {
      setLoading(false);
    }
  };

  const noChart = data && !hasChart(data);
  const total = DIMS.reduce((s, d) => s + d.full, 0); // 15

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-semibold text-zinc-800">图表大作文实验室</span>
        <YearPicker years={years} value={year} onChange={setYear} />
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* 左栏:图表或题干文本 */}
        <div
          className="col-span-12 lg:col-span-5 bg-white border border-zinc-200 rounded p-3 flex flex-col justify-between lg:h-[calc(100vh-116px)] overflow-y-auto"
          data-source={`${year} 写作`}
        >
          <div>
            <div className="border-b border-zinc-100 pb-2 mb-2 flex justify-between items-center">
              <span className="font-semibold text-zinc-800">
                {year}年大作文:{data?.title || '图表作文'}
              </span>
              <span className="text-zinc-400">满分: 15分</span>
            </div>

            {hasChart(data) ? (
              <div className="w-full h-56 border border-zinc-100 rounded bg-zinc-50/50">
                <ReactECharts
                  option={data!.chartOption}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            ) : (
              <div className="w-full min-h-56 border border-dashed border-zinc-300 rounded bg-zinc-50 p-3 text-zinc-600 whitespace-pre-wrap text-[11px] leading-relaxed">
                <div className="font-semibold text-zinc-800 mb-2 text-zinc-500">
                  提示:该年份暂无图表数据,下方展示从 PDF 提取的原题面文本
                </div>
                {data?.prompt || '暂无题面内容'}
              </div>
            )}

            {data?.keyPoints && data.keyPoints.length > 0 && (
              <div className="mt-3 bg-zinc-50 border border-zinc-200 rounded p-2 text-zinc-600 leading-relaxed">
                <div className="font-semibold text-zinc-800 mb-1">核心采分数据:</div>
                {data.keyPoints.map((p, i) => (
                  <div key={i}>
                    {i + 1}. {p}
                  </div>
                ))}
              </div>
            )}

            {noChart && (
              <div className="mt-3 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                📌 图表数值 data-source 取自写作 PDF 原题面;后续你可以把该年份真实柱状/饼图数据补到 content/writing/{year}.json 的 chartOption 字段即可自动渲染。
              </div>
            )}
          </div>
          <div className="text-zinc-400 text-[11px] mt-2">
            提示:鼠标悬停英文单词可查释义,选中可捕获进生词本。
          </div>
        </div>

        {/* 右栏:语料积木 + 编辑器 + AI 批改 */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-zinc-200 rounded p-3 flex flex-col lg:h-[calc(100vh-116px)]">
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="border-b border-zinc-100 pb-2 mb-2">
              <span className="font-semibold text-zinc-800">常用表达积木 (点击插入光标处):</span>
              {SCAFFOLD_GROUPS.map((g) => {
                const items =
                  (data?.scaffolding as Record<string, string[]> | undefined)?.[g.key] ?? [];
                return (
                  <div
                    key={g.key}
                    className="flex flex-wrap gap-1.5 mt-2 items-center"
                  >
                    <span className="text-[10px] text-zinc-400 font-mono w-16">
                      {g.label}
                    </span>
                    {items.length === 0 && (
                      <span className="text-[10px] text-zinc-400">待补充</span>
                    )}
                    {items.map((phrase) => (
                      <button
                        key={phrase}
                        onClick={() => insertAtCursor(phrase)}
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200 transition-colors"
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            <textarea
              ref={editorRef}
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              className="w-full h-64 p-3 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 font-mono text-xs leading-relaxed resize-none shrink-0"
              placeholder="在此键入你的图表作文... (建议字数: 150词左右, 写完点右下角「AI 维度批改」)"
            />
            <div className="text-right text-zinc-400 mt-1 font-mono">当前字数: {wordCount} 词</div>
          </div>

          <div className="border-t border-zinc-100 pt-2 mt-2 flex justify-between items-center shrink-0">
            <button
              onClick={() => setEssay('')}
              className="text-zinc-500 hover:text-zinc-800"
            >
              清空内容
            </button>
            <button
              onClick={runReview}
              disabled={loading}
              className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white px-4 py-1.5 rounded font-medium flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {loading ? '批改中 (约 2 秒)...' : 'AI 维度批改'}
            </button>
          </div>

          {/* 批改结果 */}
          <div className="mt-2 shrink-0 overflow-y-auto max-h-[45vh] pr-0.5">
            {usedDefaultKey && !error && (
              <div className="mb-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2 flex items-start gap-1.5">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
                <span>
                  当前使用内置智谱 <code>glm-4-flash</code> 免费模型。如想换用自己的 Key,
                  请去 <a href="/settings" className="underline">系统设置</a> 切换。
                </span>
              </div>
            )}
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-[11px] flex items-start gap-1.5">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold mb-0.5">批改失败</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {review && (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-3">
                {/* 总分 + 4 维 */}
                <div>
                  <div className="flex justify-between items-baseline flex-wrap gap-2">
                    <div className="text-zinc-800 text-sm font-semibold">综合评分</div>
                    <div className="font-mono font-bold text-zinc-900">
                      <span className="text-2xl">{review.totalScore.toFixed(1)}</span>
                      <span className="text-zinc-500 text-xs"> / {total} 分</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {DIMS.map((d) => {
                      const v = review.scores[d.key] ?? 0;
                      const pct = Math.min(100, (v / d.full) * 100);
                      return (
                        <div
                          key={d.key}
                          className={`rounded border p-2 ${d.color.split(' ')[2]} ${d.color.split(' ')[1]}`}
                        >
                          <div className="flex justify-between items-baseline">
                            <span className="text-[11px] font-medium">{d.label}</span>
                            <span className="font-mono text-xs font-bold">
                              {typeof v === 'number' ? v.toFixed(1) : v}
                              <span className="text-zinc-500 font-normal">/{d.full}</span>
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 bg-white/60 rounded overflow-hidden">
                            <div
                              className="h-full bg-current"
                              style={{ width: `${pct}%`, opacity: 0.7 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 维度文字点评 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white border border-zinc-200 rounded p-2">
                    <div className="font-semibold text-zinc-800 mb-1">📊 数据完整度评价</div>
                    <div className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      {review.dataFeedback || '—'}
                    </div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded p-2">
                    <div className="font-semibold text-zinc-800 mb-1">🧠 归因逻辑评价</div>
                    <div className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      {review.logicFeedback || '—'}
                    </div>
                  </div>
                </div>

                {/* 逐句修正 */}
                {review.corrections && review.corrections.length > 0 && (
                  <div>
                    <div className="font-semibold text-zinc-800 mb-1.5 text-sm">
                      ✏️ 逐句润色与提分建议
                    </div>
                    <ul className="space-y-2">
                      {review.corrections.map((c, i) => (
                        <li
                          key={i}
                          className="bg-white border border-zinc-200 rounded p-2 text-[11px]"
                        >
                          <div className="mb-1">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 mr-1.5 text-[10px] font-semibold">
                              原句
                            </span>
                            <span className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
                              {c.original}
                            </span>
                          </div>
                          <div className="mb-1">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 mr-1.5 text-[10px] font-semibold">
                              推荐
                            </span>
                            <span className="text-zinc-800 whitespace-pre-wrap leading-relaxed font-medium">
                              {c.improved}
                            </span>
                          </div>
                          {c.reason && (
                            <div className="text-zinc-500 pl-16 leading-relaxed">
                              💡 {c.reason}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 总结 */}
                <div className="bg-zinc-900 text-zinc-100 rounded p-2.5 text-[11px] leading-relaxed">
                  <span className="font-semibold mr-1.5">🎯 总体点评:</span>
                  {review.summary}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
