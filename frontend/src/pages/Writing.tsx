import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import YearPicker from '@/components/common/YearPicker';
import api from '@/api';
import { useAuthStore } from '@/store/auth';
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

  const { data: paper } = useQuery<WritingData>({
    queryKey: ['exam-content', MODULE, year],
    queryFn: async () => {
      try { return await api.exam.content<WritingData>(MODULE, year); } catch {
        const fallback = await import.meta.glob('@/content/writing/*.json', { eager: true, import: 'default' })[`/src/content/writing/${year}.json`];
        return fallback as WritingData;
      }
    },
  });

  const isAuthed = useAuthStore(s => s.isAuthenticated());
  useEffect(() => {
    if (isAuthed) {
      api.writing.aiConfig().then(setAiCfg).catch(() => void 0);
    } else {
      setAiCfg({ available: false, effective_model: '未登录，请登录后使用AI' });
    }
  }, [isAuthed]);

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
      <div className="col-span-5 bg-white border border-zinc-200 rounded p-3 flex flex-col justify-between h-[calc(100vh-68px)]">
        <div>
          <div className="border-b border-zinc-100 pb-2 mb-2 flex justify-between items-center">
            <span className="font-semibold text-zinc-800">{paper?.title || `${year}年大作文`}</span>
            <span className="text-zinc-400">满分: 15分</span>
          </div>
          {/* ECharts 容器 */}
          <div id="echart-container" className="w-full h-56 border border-zinc-100 rounded bg-zinc-50/50"></div>
          {/* 核心采分数据 */}
          {paper?.keyPoints && paper.keyPoints.length > 0 && (
            <div className="mt-3 bg-zinc-50 border border-zinc-200 rounded p-2 text-zinc-600 leading-relaxed">
              <div className="font-semibold text-zinc-800 mb-1">核心采分数据：</div>
              {paper.keyPoints.map((kp, i) => <div key={i}>{i + 1}. {kp}</div>)}
            </div>
          )}
          {paper?.prompt && (
            <div className="mt-2 text-zinc-400 text-[11px] leading-relaxed">{paper.prompt}</div>
          )}
        </div>
        <div className="text-zinc-400 text-[11px]">提示：试着选中左侧文字中的英文单词测试划词捕获。</div>
      </div>

      {/* 右栏: 写作积木与编辑器 */}
      <div className="col-span-7 bg-white border border-zinc-200 rounded p-3 flex flex-col justify-between h-[calc(100vh-68px)]">
        <div>
          <div className="border-b border-zinc-100 pb-2 mb-2">
            <span className="font-semibold text-zinc-800">常用表达积木 (点击插入光标处):</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['account for the largest proportion of', 'follow closely behind at', 'hinge upon the increasing need for', 'take the lead in'].map(p => (
                <button key={p} onClick={() => insertWord(p)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200 text-xs">
                  {p}
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
            {result.corrections?.slice(0, 2).map((c: any, i: number) => (
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