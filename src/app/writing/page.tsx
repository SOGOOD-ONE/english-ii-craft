'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, Loader2 } from 'lucide-react';
import YearPicker from '@/components/common/YearPicker';
import { YEARS, getWriting } from '@/content';
import { reviewEssay, loadAiConfig } from '@/lib/ai/client';
import type { AiReviewReport, WritingData } from '@/types';

// ECharts 仅客户端渲染
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const SCAFFOLD_GROUPS: { key: 'trends' | 'comparisons' | 'reasons'; label: string }[] = [
  { key: 'trends', label: '趋势表达' },
  { key: 'comparisons', label: '对比表达' },
  { key: 'reasons', label: '归因分析' },
];

// 有完整图表数据的年份;缺图表数据时 fallback 显示原题干
function hasChart(d: WritingData | undefined) {
  return !!d && !!d.chartType && d.chartOption && Object.keys(d.chartOption).length > 0;
}

export default function WritingPage() {
  const years = YEARS.writing;
  const [year, setYear] = useState<number>(years.includes(2023) ? 2023 : years[0]);
  const data = getWriting(year);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [essay, setEssay] = useState('');
  const [review, setReview] = useState<AiReviewReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    const cfg = loadAiConfig();
    if (!cfg || !cfg.apiKey) {
      setError('未配置 AI 接口,请先到 /settings 填写 baseURL / apiKey / model。');
      return;
    }
    setLoading(true);
    try {
      const chartContext =
        (data?.keyPoints ?? []).join('\n') ||
        data?.prompt ||
        (data?.title ?? '');
      const report = await reviewEssay(essay, chartContext, cfg);
      setReview(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 批改失败');
    } finally {
      setLoading(false);
    }
  };

  const noChart = data && !hasChart(data);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
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
            提示:试着选中上面英文文本中的任意单词测试划词捕获。
          </div>
        </div>

        {/* 右栏:语料积木 + 编辑器 + AI */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-zinc-200 rounded p-3 flex flex-col justify-between lg:h-[calc(100vh-116px)]">
          <div>
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
              className="w-full h-64 p-3 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 font-mono text-xs leading-relaxed resize-none"
              placeholder="在此键入你的图表作文... (建议字数: 150词左右)"
            />
            <div className="text-right text-zinc-400 mt-1 font-mono">当前字数: {wordCount} 词</div>
          </div>

          <div className="border-t border-zinc-100 pt-2 flex justify-between items-center">
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
              {loading ? '批改中...' : '执行 AI 维度批改'}
            </button>
          </div>

          {error && (
            <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-[11px]">
              {error}
            </div>
          )}

          {review && (
            <div className="mt-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-700">
              <div className="font-bold text-zinc-900 flex justify-between flex-wrap gap-1">
                <span>预估得分: {review.score} / {review.total}</span>
                <span className="font-normal text-zinc-500 text-[11px]">
                  数据完整: {review.dimensions.dataDescription} | 逻辑论证:{' '}
                  {review.dimensions.reasoning} | 词汇语法:{' '}
                  {review.dimensions.vocabulary} | 拼写: {review.dimensions.grammar}
                </span>
              </div>
              {review.suggestions?.length > 0 && (
                <ul className="mt-1 text-zinc-600 list-disc pl-4 space-y-0.5">
                  {review.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
