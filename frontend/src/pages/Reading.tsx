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
  translations?: string[];
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
  const [showTranslate, setShowTranslate] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [aiTranslations, setAiTranslations] = useState<Record<string, string[]>>({});

  // 调用AI翻译，完成后直接显示8:2分栏
  async function doAITranslate() {
    if (!passage || !passage.paragraphs || passage.paragraphs.length === 0) return;
    const cacheKey = `${year}-${tab}`;
    
    // 如果已经翻译过了，直接显示
    if (aiTranslations[cacheKey]) {
      setShowTranslate(true);
      return;
    }
    
    setTranslating(true);
    try {
      const res = await api.exam.translate(passage.paragraphs);
      if (res.error) {
        alert(res.error);
        return;
      }
      setAiTranslations(prev => ({ ...prev, [cacheKey]: res.translations }));
      setShowTranslate(true);
    } catch (e: any) {
      alert(`翻译失败: ${e.message || e}`);
    } finally {
      setTranslating(false);
    }
  }

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
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-zinc-800">阅读理解 Part A (Text 1-4)</span>
          <span className="text-zinc-400 text-[11px]">4 篇 × 5 题 × 2 分 = 40 分</span>
        </div>
        <YearPicker years={(years || []).map(y => y.year)} value={year} onChange={y => { setYear(y); setTab('p1'); }} />
      </div>

      {data?.intro && <div className="text-zinc-400 text-[11px]">{data.intro}</div>}

      <div className="flex flex-wrap gap-1 border-b border-zinc-200 pb-2">
        {PASSAGE_ORDER.map((pid, i) => {
          const title = `${pid.toUpperCase()} Text ${i+1}`;
          const active = (tab === pid || (!tab && i === 0));
          return (
            <button key={pid} onClick={() => setTab(pid)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'}`}>
              {title}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* 左 3 列:文章 */}
        <article className="lg:col-span-3 p-3 rounded border border-zinc-200 bg-white">
          {/* 标题 + 翻译按钮 */}
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm">{passage?.title || `Text ${tab}`}</div>
            <div className="flex items-center gap-1.5">
              {showTranslate && (
                <button
                  onClick={() => setShowTranslate(false)}
                  className="text-[11px] px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100"
                >
                  隐藏翻译
                </button>
              )}
              <button
                onClick={doAITranslate}
                disabled={translating}
                className="text-[11px] px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 disabled:opacity-50"
              >
                {translating ? '翻译中...' : '全文翻译'}
              </button>
            </div>
          </div>
          {/* 文章正文容器 */}
          <div className="overflow-y-auto pr-2 -mr-2">
            {/* 文章正文 - 根据翻译显示切换布局 */}
            {!showTranslate ? (
              // 单栏:只显示英文原文
              <div className="space-y-2 text-xs leading-7">
                {(passage?.paragraphs || ['(该年文本占位,后续从真题 PDF 填充。)']).map((para, i) => (
                  <p key={i} className="indent-8 text-justify">{para}</p>
                ))}
              </div>
            ) : (
              // 上下排列:英文段落下面紧跟中文翻译
              <div className="space-y-3 text-xs leading-7">
                {(passage?.paragraphs || ['']).map((para, i) => {
                  const cacheKey = `${year}-${tab}`;
                  const cachedAi = aiTranslations[cacheKey]?.[i];
                  const jsonTr = passage?.translations?.[i];
                  const tr = jsonTr || cachedAi;
                  return (
                    <div key={i} className="space-y-2">
                      {/* 英文原文 */}
                      <p className="indent-8 text-justify text-zinc-900">{para}</p>
                      {/* 中文翻译 */}
                      <div className="pl-6 border-l-2 border-zinc-200 bg-zinc-50 py-1 pr-2 rounded">
                        <p className="indent-4 text-justify text-zinc-600">
                          {tr || <span className="text-zinc-300 italic">[待翻译]</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* 始终显示底部统计信息 */}
            {passage && (
              <div className="pt-2 mt-3 border-t border-zinc-200 text-[11px] text-zinc-500 flex gap-3 flex-wrap">
                <span>主题: {passage.theme}</span>
                <span>· 词数: {passage.word_count || '(占位)'}</span>
                <span>· 标签: {Array.from(new Set((passage.questions || []).flatMap(q => q.tags))).join(' / ') || '-'}</span>
              </div>
            )}
          </div>
        </article>

        {/* 右 2 列:题目 */}
        <section className="lg:col-span-2 p-3 rounded border border-zinc-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-xs">题目 1-{passage?.questions?.length || 5}</div>
            <button onClick={() => {
              const allShown = passage?.questions?.every(q => showAnswer[q.no]);
              const next: any = {};
              (passage?.questions || []).forEach(q => { next[q.no] = !allShown; });
              setShowAnswer(next);
            }} className="text-[11px] px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100">
              {passage?.questions?.every(q => showAnswer[q.no]) ? '全部隐藏' : '一键显示答案'}
            </button>
          </div>
          {(passage?.questions || []).map(q => (
            <div key={q.no} className="p-2 rounded border border-zinc-200 space-y-1.5">
              <div className="flex items-start gap-1.5">
                <span className="px-1 text-[10px] rounded bg-zinc-100 text-zinc-600">{q.no}</span>
                <div className="text-xs leading-5">{q.stem}</div>
              </div>
              <div className="pl-6 space-y-1 text-xs">
                {q.options.map(o => (
                  <div key={o.label} className={`flex gap-1.5 ${showAnswer[q.no] && o.label === q.answer ? 'text-emerald-700 font-semibold' : ''}`}>
                    <span className="w-5">{o.label}.</span>
                    <span>{o.text}</span>
                  </div>
                ))}
              </div>
              <div className="pl-6 flex flex-wrap gap-1 text-[10px]">
                {q.tags.map((t, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">{t}</span>
                ))}
                <button onClick={() => toggleAnswer(q.no)} className="ml-auto text-[10px] underline text-zinc-500 hover:text-zinc-900">
                  {showAnswer[q.no] ? '隐藏答案' : '查看答案'}
                </button>
              </div>
              {showAnswer[q.no] && (
                <div className="pl-6 mt-1.5 p-1.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] leading-5 space-y-0.5">
                  <div>✅ 正确答案: <b>{q.answer}</b></div>
                  {q.source_sentence && <div>📌 原文线索句: {q.source_sentence}</div>}
                  <div className="text-zinc-600">💡 {q.explanation}</div>
                </div>
              )}
            </div>
          ))}
          {(!passage?.questions?.length) && <div className="text-zinc-400 text-xs">题目占位,后续从真题 PDF 提取。</div>}
        </section>
      </div>

      {error && <div className="text-xs text-amber-600 p-2 rounded border border-amber-200 bg-amber-50">
        后端 API 不可用,已降级到前端本地副本。
      </div>}
    </div>
  );
}