import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as echarts from 'echarts';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import YearPicker from '@/components/common/YearPicker';
import api from '@/api';
import type { WritingData } from '@/types';

const MODULE = 'writing' as const;

export default function WritingPage() {
  const subject = 'eng2';

  const [year, setYear] = useState<number>(() => {
    const saved = localStorage.getItem('writing_selected_year');
    return saved ? parseInt(saved, 10) : 2025;
  });
  const [essay, setEssay] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  function handleYearChange(newYear: number) {
    setYear(newYear);
    localStorage.setItem('writing_selected_year', String(newYear));
  }

  const { data: years } = useQuery({
    queryKey: ['exam-years', MODULE, subject],
    queryFn: () => api.exam.years(MODULE, subject),
  });

  const { data: paper, isLoading: paperLoading } = useQuery<WritingData>({
    queryKey: ['exam-content', MODULE, year, subject],
    queryFn: async () => {
      try {
        const res = await api.exam.content<WritingData>(MODULE, year, subject);
        if (res && (res.chartOption || res.pictureInfo || res.prompt)) {
          return res;
        }
        const fallbacks = import.meta.glob('@/content/**/*.json', { eager: true, import: 'default' });
        const path1 = `/src/content/${subject}/writing/${year}.json`;
        const path2 = `/src/content/writing/${year}.json`;
        return (fallbacks[path1] || fallbacks[path2]) as WritingData;
      } catch {
        const fallbacks = import.meta.glob('@/content/**/*.json', { eager: true, import: 'default' });
        const path1 = `/src/content/${subject}/writing/${year}.json`;
        const path2 = `/src/content/writing/${year}.json`;
        return (fallbacks[path1] || fallbacks[path2]) as WritingData;
      }
    },
  });

  const chartInfo = useMemo(() => {
    if (!paper) return '';
    const keys = (paper as any).keyPoints || [];
    const lines = [`${paper.year || year} 年考研英语图表作文真题`];
    if (paper.title) lines.push(paper.title);
    if (paper.prompt) lines.push(paper.prompt);
    if (keys.length) lines.push(`核心采分数据:${keys.join('; ')}`);
    return lines.join('\n');
  }, [paper, year]);

  // ECharts 图表渲染
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const processedOption = useMemo(() => {
    const rawOpt = paper?.chartOption;
    if (!rawOpt || Object.keys(rawOpt).length === 0) return null;

    const opt = JSON.parse(JSON.stringify(rawOpt));

    // Ensure grid has containLabel: true and proper margin
    if (!opt.grid) {
      opt.grid = { top: 40, bottom: 25, left: 15, right: 15, containLabel: true };
    } else {
      opt.grid.containLabel = true;
      if (opt.grid.bottom === undefined) opt.grid.bottom = 25;
    }

    // Process xAxis to guarantee full label visibility
    if (opt.xAxis) {
      const processAxis = (axis: any) => {
        if (!axis) return;
        const dataList: any[] = Array.isArray(axis.data) ? axis.data : [];
        const maxLen = dataList.reduce((m, item) => Math.max(m, String(item || '').length), 0);
        const count = dataList.length;

        axis.axisLabel = {
          fontSize: 11,
          ...axis.axisLabel,
          interval: 0, // Force display of every label
        };

        // If rotate is not explicitly set, auto-tilt long labels
        if (axis.axisLabel.rotate === undefined || axis.axisLabel.rotate === 0) {
          if (maxLen >= 5 || (maxLen >= 4 && count >= 4)) {
            axis.axisLabel.rotate = 20;
          } else if (count >= 8) {
            axis.axisLabel.rotate = 30;
          }
        }
      };

      if (Array.isArray(opt.xAxis)) {
        opt.xAxis.forEach(processAxis);
      } else {
        processAxis(opt.xAxis);
      }
    }

    // Process yAxis (e.g. horizontal bar charts like 2024)
    if (opt.yAxis) {
      const processYAxis = (axis: any) => {
        if (!axis || !Array.isArray(axis.data)) return;
        axis.axisLabel = {
          fontSize: 11,
          ...axis.axisLabel,
          interval: 0,
        };
      };
      if (Array.isArray(opt.yAxis)) {
        opt.yAxis.forEach(processYAxis);
      } else {
        processYAxis(opt.yAxis);
      }
    }

    return opt;
  }, [paper?.chartOption]);

  useEffect(() => {
    if (!chartRef.current) return;
    let chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) {
      chart = echarts.init(chartRef.current);
    }
    chartInstance.current = chart;

    if (processedOption) {
      chart.setOption(processedOption, true);
      chart.resize();
      setTimeout(() => chart?.resize(), 60);
      setTimeout(() => chart?.resize(), 250);
    } else {
      chart.clear();
    }

    const ro = new ResizeObserver(() => {
      chart?.resize();
    });
    ro.observe(chartRef.current);

    const handleResize = () => chart?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [processedOption]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

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

  function insertWord(text: string) {
    const ta = document.getElementById('essay-editor') as HTMLTextAreaElement;
    if (!ta) { setEssay(e => e + ' ' + text + ' '); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    ta.value = val.substring(0, start) + ' ' + text + ' ' + val.substring(end);
    ta.focus();
    ta.selectionEnd = start + text.length + 2;
    setEssay(ta.value);
  }

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* 左栏: 图表与数据特征 */}
      <div className="col-span-5 bg-white border border-zinc-200 rounded p-3 flex flex-col justify-between h-[calc(100vh-68px)] overflow-hidden">
        <div className="overflow-y-auto pr-1 flex-1">
          <div className="border-b border-zinc-100 pb-2 mb-2 flex justify-between items-center">
            <div className="flex items-center gap-1.5 min-w-0">
              <BarChart3 className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="font-semibold text-zinc-800 truncate">{paper?.title || `${year}年大作文`}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <YearPicker years={(years || []).map(y => y.year)} value={year} onChange={handleYearChange} />
              <span className="text-zinc-400 text-xs">满分: 15分</span>
            </div>
          </div>

          {paper?.chartType === 'picture' || paper?.pictureInfo ? (
            <div className="my-1 border border-zinc-200 rounded p-3 bg-zinc-50/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900 border-b border-zinc-200/80 pb-1.5">
                <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded">Part B 漫画/图画作文</span>
                <span className="text-zinc-700">{paper?.pictureInfo?.title || paper?.title || `${year}年图画作文`}</span>
              </div>
              <div className="text-zinc-700 leading-relaxed bg-white p-2.5 rounded border border-zinc-200/80">
                <span className="font-semibold text-zinc-900 block mb-1">📷 画面构图与立意描述:</span>
                {paper?.pictureInfo?.description || paper?.prompt}
              </div>
              {paper?.pictureInfo?.keywords && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {paper.pictureInfo.keywords.map((kw: string, i: number) => (
                    <span key={i} className="bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded text-[11px] font-mono">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ECharts 容器 */
            <div className="relative w-full my-1">
              <div
                ref={chartRef}
                id="echart-container"
                style={{ height: '275px', width: '100%', minHeight: '275px' }}
                className="w-full border border-zinc-200/80 rounded bg-white"
              />
              {paperLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center text-xs text-zinc-500 font-medium">
                  图表数据加载中...
                </div>
              )}
              {!paperLoading && (!paper?.chartOption || Object.keys(paper.chartOption).length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-zinc-400 gap-1 bg-zinc-50">
                  <AlertCircle className="w-5 h-5 text-zinc-400" />
                  <span>暂无可用图表配置</span>
                </div>
              )}
            </div>
          )}
          {/* 核心采分数据 */}
          {paper?.keyPoints && paper.keyPoints.length > 0 && (
            <div className="mt-2.5 bg-zinc-50 border border-zinc-200 rounded p-2.5 text-zinc-600 text-xs leading-relaxed">
              <div className="font-semibold text-zinc-800 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-700" />
                <span>核心采分数据与特征：</span>
              </div>
              {(paper.keyPoints || []).map((kp, i) => <div key={i} className="py-0.5">• {kp}</div>)}
            </div>
          )}
          {(paper?.partB || paper?.prompt) && (
            <div className="mt-2 text-zinc-600 text-xs leading-relaxed whitespace-pre-line border-t border-zinc-100 pt-2 font-mono bg-zinc-50/80 p-2 rounded border border-zinc-200/60">
              <span className="font-semibold text-zinc-900 block mb-1">✍️ 大作文 Directions:</span>
              {paper.partB || paper.prompt}
            </div>
          )}
        </div>
        <div className="text-zinc-400 text-[11px] pt-1 border-t border-zinc-100">提示：试着选中左侧文字中的英文单词测试划词捕获。</div>
      </div>

      {/* 右栏: 写作积木与编辑器 */}
      <div className="col-span-7 bg-white border border-zinc-200 rounded p-3 flex flex-col justify-between h-[calc(100vh-68px)]">
        <div>
          <div className="border-b border-zinc-100 pb-2 mb-2">
            <span className="font-semibold text-zinc-800">常用表达积木 (点击插入光标处):</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(paper?.scaffolding?.trends || ['account for the largest proportion of', 'take the lead in', 'reach a peak at']).slice(0, 3).map((p: string) => (
                <button key={p} onClick={() => insertWord(p)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-xs transition" title="趋势句型">
                  [趋势] {p}
                </button>
              ))}
              {(paper?.scaffolding?.comparisons || ['in sharp contrast to', 'account for a larger share than']).slice(0, 2).map((p: string) => (
                <button key={p} onClick={() => insertWord(p)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200 text-xs transition" title="对比句型">
                  [对比] {p}
                </button>
              ))}
              {(paper?.scaffolding?.reasons || ['hinge upon the increasing need for', 'can be attributed to the accelerating pace of life']).slice(0, 2).map((p: string) => (
                <button key={p} onClick={() => insertWord(p)}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200 text-xs transition" title="归因句型">
                  [归因] {p}
                </button>
              ))}
            </div>
          </div>
          <textarea id="essay-editor" value={essay} onChange={e => setEssay(e.target.value)}
            placeholder="在此键入你的图表作文... (建议字数: 150词左右)"
            className="w-full h-64 p-3 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 font-mono text-xs leading-relaxed resize-none" />
          <div className="text-right text-zinc-400 mt-1 font-mono">当前字数: {wordCount} 词</div>
        </div>

        <div className="border-t border-zinc-100 pt-2 flex justify-between items-center">
          <button onClick={() => setEssay('')} className="text-zinc-500 hover:text-zinc-800">清空内容</button>
          <button disabled={busy} onClick={onReview}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-1.5 rounded font-medium disabled:opacity-60">
            {busy ? '批改中...' : '执行 AI 维度批改'}
          </button>
        </div>

        {/* AI 批改结果 */}
        {result && (
          <div className="mt-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-700 space-y-2 max-h-48 overflow-y-auto">
            <div className="font-bold text-zinc-900 flex justify-between">
              <span>预估得分: {(+result.total_score).toFixed(1)} / 15.0</span>
              <span className="font-normal text-zinc-500">
                数据: {+(result.s_data || 0).toFixed(1)} | 逻辑: {+(result.s_logic || 0).toFixed(1)} | 词汇: {+(result.s_vocab || 0).toFixed(1)} | 语法: {+(result.s_grammar || 0).toFixed(1)}
              </span>
            </div>
            <div className="text-zinc-600 text-xs leading-relaxed">{result.summary || result.data_feedback || '批改完成'}</div>
            {(result.corrections || []).slice(0, 2).map((c: any, i: number) => (
              <div key={i} className="text-xs border-t border-zinc-200 pt-1">
                <span className="text-zinc-500 line-through">{c.original}</span>
                <span className="text-zinc-900 ml-2">→ {c.improved}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}