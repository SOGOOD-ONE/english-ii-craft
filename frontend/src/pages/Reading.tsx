import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import YearPicker from '@/components/common/YearPicker';
import api from '@/api';

const MODULE = 'reading' as const;
const PASSAGE_ORDER = ['p1', 'p2', 'p3', 'p4'];

interface Passage {
  id: string;
  title: string;
  theme: string;
  category: string;
  word_count: number;
  paragraphs: string[];
  questions: Array<{
    no: number;
    stem: string;
    options: Array<{ label: string; text: string }>;
    answer: string;
    explanation: string;
    tags: string[];
    source_sentence?: string;
  }>;
}
interface ReadingData { year: number; title: string; intro: string; passages: Passage[]; }

export default function ReadingPage() {
  const [year, setYear] = useState(2025);
  const [tab, setTab] = useState<string>('p1');
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});

  const { data: years } = useQuery({ queryKey: ['exam-years', MODULE], queryFn: () => api.exam.years(MODULE) });
  const { data, error } = useQuery<ReadingData>({
    queryKey: ['exam-content', MODULE, year],
    queryFn: async () => {
      try { return await api.exam.content<ReadingData>(MODULE, year); } catch {
        const fallback = (await import.meta.glob('@/content/reading/*.json', { eager: true, import: 'default' }))[`/src/content/reading/${year}.json`];
        return fallback as ReadingData;
      }
    },
  });

  const passage: Passage | undefined = useMemo(() => {
    const idx = PASSAGE_ORDER.indexOf(tab);
    return data?.passages?.[idx] || data?.passages?.find(p => p.id === tab);
  }, [tab, data]);

  function toggleAnswer(no: number) {
    setShowAnswer(s => ({ ...s, [no]: !s[no] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">📖 阅读理解 Part A (Text 1-4)</h1>
          <p className="text-slate-500 text-sm mt-1">4 篇 × 5 题 × 2 分 = 40 分,年份切换 + 题型标签(细节/推断/主旨/态度)</p>
        </div>
        <YearPicker years={(years || []).map(y => y.year)} value={year} onChange={y => { setYear(y); setTab('p1'); }} />
      </div>

      {data && <div className="text-sm text-slate-500">{data.intro}</div>}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {PASSAGE_ORDER.map((pid, i) => {
          const p = data?.passages?.find(pp => pp.id === pid) || data?.passages?.[i];
          const title = p ? `${pid.toUpperCase()} · ${p.title}${p.category ? ' [' + p.category + ']' : ''}` : `Text ${i + 1}`;
          const active = (tab === pid || (!tab && i === 0));
          return (
            <button key={pid} onClick={() => setTab(pid)}
              className={`px-3 py-1.5 rounded-md text-sm transition border ${active ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {title}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左 3 列:文章 */}
        <article className="lg:col-span-3 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{passage?.category || 'Text'}</div>
            <div className="font-semibold text-lg">{passage?.title || '加载中…'}</div>
          </div>
          <div className="space-y-3 text-[15px] leading-8">
            {(passage?.paragraphs || ['(该年文本占位,后续从真题 PDF 填充。)']).map((para, i) => (
              <p key={i} className="indent-8 text-justify">{para}</p>
            ))}
          </div>
          {passage && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex gap-3 flex-wrap">
              <span>主题: {passage.theme}</span>
              <span>· 词数: {passage.word_count || '(占位)'}</span>
              <span>· 题型标签: {Array.from(new Set((passage.questions || []).flatMap(q => q.tags))).join(' / ') || '-'}</span>
            </div>
          )}
        </article>

        {/* 右 2 列:题目 */}
        <section className="lg:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between">
            <div className="font-semibold">题目 1-{passage?.questions?.length || 5}</div>
            <button onClick={() => {
              const allShown = passage?.questions?.every(q => showAnswer[q.no]);
              const next: any = {};
              (passage?.questions || []).forEach(q => { next[q.no] = !allShown; });
              setShowAnswer(next);
            }} className="text-xs px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100">
              {passage?.questions?.every(q => showAnswer[q.no]) ? '全部隐藏答案' : '一键显示所有答案'}
            </button>
          </div>
          {(passage?.questions || []).map(q => (
            <div key={q.no} className="p-3 rounded-md border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-start gap-2">
                <span className="px-1.5 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{q.no}</span>
                <div className="text-sm font-medium leading-6">{q.stem}</div>
              </div>
              <div className="pl-7 space-y-1.5 text-sm">
                {q.options.map(o => (
                  <div key={o.label} className={`flex gap-2 ${showAnswer[q.no] && o.label === q.answer ? 'text-emerald-600 dark:text-emerald-300 font-semibold' : ''}`}>
                    <span className="w-6">{o.label}.</span>
                    <span>{o.text}</span>
                  </div>
                ))}
              </div>
              <div className="pl-7 flex flex-wrap gap-1.5 text-xs">
                {q.tags.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">{t}</span>
                ))}
                <button onClick={() => toggleAnswer(q.no)} className="ml-auto text-xs underline text-slate-500 hover:text-violet-600">
                  {showAnswer[q.no] ? '隐藏答案' : '查看答案 & 解析'}
                </button>
              </div>
              {showAnswer[q.no] && (
                <div className="pl-7 mt-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs leading-5 space-y-1">
                  <div>✅ 正确答案: <b>{q.answer}</b></div>
                  {q.source_sentence && <div>📌 原文线索句: {q.source_sentence}</div>}
                  <div className="text-slate-600 dark:text-slate-300">💡 {q.explanation}</div>
                </div>
              )}
            </div>
          ))}
          {(!passage?.questions?.length) && <div className="text-slate-400 text-sm">题目占位,后续从真题 PDF 提取。</div>}
        </section>
      </div>

      {error && <div className="text-sm text-amber-600 p-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
        后端 API 不可用,已降级到前端本地副本。
      </div>}
    </div>
  );
}
