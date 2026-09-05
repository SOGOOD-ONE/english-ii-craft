import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, AlertCircle } from 'lucide-react';
import YearPicker from '@/components/common/YearPicker';
import ReadingNotesCanvas, { ReadingNotesCanvasHandle } from '@/components/exam/ReadingNotesCanvas';
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
  const subject = 'eng2';

  const [year, setYear] = useState<number>(() => {
    const saved = localStorage.getItem('reading_selected_year');
    return saved ? parseInt(saved, 10) : 2025;
  });
  const [pendingTargetYear, setPendingTargetYear] = useState<number | null>(null);
  const canvasHandleRef = useRef<ReadingNotesCanvasHandle | null>(null);

  const [tab, setTab] = useState<string>('p1');
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [showTranslate, setShowTranslate] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [aiTranslations, setAiTranslations] = useState<Record<string, string[]>>({});
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);

  function changeYear(newYear: number) {
    setYear(newYear);
    localStorage.setItem(`reading_selected_year_${subject}`, String(newYear));
    localStorage.setItem('reading_selected_year', String(newYear));
    setTab('p1');
  }

  function handleYearChange(targetYear: number) {
    if (targetYear === year) return;
    const hasStrokes = isDrawingMode && (canvasHandleRef.current?.hasStrokes() ?? false);
    if (hasStrokes) {
      setPendingTargetYear(targetYear);
    } else {
      changeYear(targetYear);
    }
  }

  // 调用AI翻译，完成后直接显示8:2分栏
  async function doAITranslate(forceRefresh = false) {
    if (!passage || !passage.paragraphs || passage.paragraphs.length === 0) return;
    const cacheKey = `${subject}-${year}-${tab}`;
    
    // 1. 如果已有真实中文译文且非强制刷新，直接显示
    if (!forceRefresh) {
      if (
        passage.translations &&
        passage.translations.length >= passage.paragraphs.length &&
        passage.translations.some(t => /[\u4e00-\u9fa5]/.test(t))
      ) {
        setAiTranslations(prev => ({ ...prev, [cacheKey]: passage.translations! }));
        setShowTranslate(true);
        return;
      }
      if (aiTranslations[cacheKey] && aiTranslations[cacheKey].some(t => /[\u4e00-\u9fa5]/.test(t))) {
        setShowTranslate(true);
        return;
      }
    }
    
    setTranslating(true);
    try {
      const res = await api.exam.translate(passage.paragraphs, { year, passageId: passage.id, subject });
      if (res.error) {
        alert(res.error);
        return;
      }
      if (res.translations && res.translations.some((t: string) => /[\u4e00-\u9fa5]/.test(t))) {
        setAiTranslations(prev => ({ ...prev, [cacheKey]: res.translations }));
        setShowTranslate(true);
      } else {
        alert('暂未获取到有效的中文译文，请稍后再试。');
      }
    } catch (e: any) {
      alert(`翻译失败: ${e.message || e}`);
    } finally {
      setTranslating(false);
    }
  }

  const { data: years } = useQuery({ 
    queryKey: ['exam-years', MODULE, subject], 
    queryFn: () => api.exam.years(MODULE, subject) 
  });

  const { data, error } = useQuery<ReadingData>({
    queryKey: ['exam-content', MODULE, year, subject],
    queryFn: async () => {
      try { 
        return await api.exam.content<ReadingData>(MODULE, year, subject); 
      } catch {
        const fallbacks = import.meta.glob('@/content/**/*.json', { eager: true, import: 'default' });
        const path1 = `/src/content/${subject}/reading/${year}.json`;
        const path2 = `/src/content/reading/${year}.json`;
        return (fallbacks[path1] || fallbacks[path2]) as ReadingData;
      }
    },
  });

  const passageIdx = PASSAGE_ORDER.indexOf(tab);
  const passage: Passage | undefined = data?.passages?.[passageIdx] || data?.passages?.find(p => p.id === tab);

  function toggleAnswer(no: number) {
    setShowAnswer(s => ({ ...s, [no]: !s[no] }));
  }

  const yearList = Array.isArray(years) ? years : Array.isArray((years as any)?.years) ? (years as any).years : [];
  const yearNumbers = yearList.map((y: any) => typeof y === 'number' ? y : y?.year).filter((y: any): y is number => typeof y === 'number');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-700 shrink-0" />
          <span className="font-semibold text-zinc-800 text-xs sm:text-sm">阅读理解 Part A (Text 1-4)</span>
          <span className="text-zinc-400 text-[10px] sm:text-[11px] hidden sm:inline ml-1">4 篇 × 5 题 = 40 分</span>
        </div>
        <YearPicker years={yearNumbers} value={year} onChange={handleYearChange} />
      </div>

      {data?.intro && <div className="text-zinc-400 text-[11px]">{data.intro}</div>}

      <div className="flex gap-1 border-b border-zinc-200 pb-2 overflow-x-auto whitespace-nowrap">
        {PASSAGE_ORDER.map((pid, i) => {
          const title = `Text ${i+1}`;
          const active = (tab === pid || (!tab && i === 0));
          return (
            <button key={pid} onClick={() => setTab(pid)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${active ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'}`}>
              <FileText className="w-3.5 h-3.5" />
              <span>{title}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* 左 3 列:文章 */}
        <article className="lg:col-span-3 p-3 sm:p-4 rounded-xl border border-zinc-200 bg-white">
          {/* 标题 + 翻译按钮 */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="font-semibold text-xs sm:text-sm">
              {passage?.title ? passage.title.split('·')[0].split('-')[0].trim() : `Text ${passageIdx + 1}`}
            </div>
            <div className="flex items-center gap-1.5">
              {showTranslate && (
                <>
                  <button
                    onClick={() => setShowTranslate(false)}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-100 active:scale-95 transition"
                  >
                    隐藏翻译
                  </button>
                  <button
                    onClick={() => doAITranslate(true)}
                    disabled={translating}
                    title="强制调用最新引擎重新翻译"
                    className="text-[11px] px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-100 disabled:opacity-50 text-zinc-600 active:scale-95 transition"
                  >
                    {translating ? '更新中...' : '重新翻译'}
                  </button>
                </>
              )}
              {!showTranslate && (
                <button
                  onClick={() => doAITranslate(false)}
                  disabled={translating}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-100 disabled:opacity-50 active:scale-95 transition"
                >
                  {translating ? '翻译中...' : '全文翻译'}
                </button>
              )}
            </div>
          </div>

          {/* 文章正文与做笔记画板 */}
          <div className="overflow-y-auto pr-2 -mr-2">
            <ReadingNotesCanvas
              ref={canvasHandleRef}
              year={year}
              passageId={tab}
              passageTitle={passage?.title ? passage.title.split('·')[0].split('-')[0].trim() : `Text ${passageIdx + 1}`}
              isDrawingMode={isDrawingMode}
              setIsDrawingMode={setIsDrawingMode}
            >
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
                    const cacheKey = `${subject}-${year}-${tab}`;
                    const cachedAi = aiTranslations[cacheKey]?.[i];
                    const jsonTr = passage?.translations?.[i];
                    const validJsonTr = (jsonTr && /[\u4e00-\u9fa5]/.test(jsonTr)) ? jsonTr : '';
                    const validCachedAi = (cachedAi && /[\u4e00-\u9fa5]/.test(cachedAi)) ? cachedAi : '';
                    const tr = validJsonTr || validCachedAi;
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
            </ReadingNotesCanvas>

            {/* 始终显示底部统计信息 */}
            {passage && (
              <div className="pt-2 mt-3 border-t border-zinc-200 text-[11px] text-zinc-500 flex gap-3 flex-wrap">
                <span>主题: {passage.theme}</span>
                <span>· 词数: {passage.word_count || '(占位)'}</span>
                <span>· 标签: {Array.from(new Set((passage.questions || []).flatMap(q => q.tags || []))).filter(Boolean).join(' / ') || '-'}</span>
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
                {(q.options || []).map(o => {
                  const isSelected = selectedOptions[q.no] === o.label;
                  const isCorrect = o.label === q.answer;
                  const isRevealed = showAnswer[q.no];
                  
                  let optStyle = 'border-transparent hover:bg-zinc-100 text-zinc-700';
                  if (isRevealed) {
                    if (isCorrect) optStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
                    else if (isSelected) optStyle = 'bg-rose-50 text-rose-800 border-rose-300 line-through';
                  } else if (isSelected) {
                    optStyle = 'bg-zinc-900 text-white border-zinc-900 font-medium';
                  }

                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      key={o.label}
                      onClick={() => setSelectedOptions(prev => ({ ...prev, [q.no]: o.label }))}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedOptions(prev => ({ ...prev, [q.no]: o.label })); } }}
                      className={`w-full text-left flex items-start gap-1.5 p-1.5 rounded border transition cursor-pointer select-text ${optStyle}`}
                    >
                      <span className="w-5 font-mono select-none">{o.label}.</span>
                      <span className="flex-1">{o.text}</span>
                      {isRevealed && isCorrect && <span className="text-emerald-600 font-bold ml-1 select-none">✓</span>}
                      {isRevealed && isSelected && !isCorrect && <span className="text-rose-600 font-bold ml-1 select-none">✗</span>}
                    </div>
                  );
                })}
              </div>
              <div className="pl-6 flex flex-wrap gap-1 text-[10px]">
                {(q.tags || []).map((t, i) => (
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

      {/* 切换真题年份时的画板笔记保存确认弹窗 */}
      {pendingTargetYear !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 p-5 max-w-sm w-full space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-100 text-amber-700 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 mb-1">保存画板笔记？</h3>
                <p className="text-zinc-600 leading-relaxed">
                  检测到您在当前 <span className="font-semibold text-zinc-800">{year}年</span> 真题已绘制画板笔记。在切换至 <span className="font-semibold text-zinc-800">{pendingTargetYear}年</span> 真题前，是否保存当前笔记？
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setPendingTargetYear(null)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-medium cursor-pointer transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = pendingTargetYear;
                  setPendingTargetYear(null);
                  changeYear(target);
                }}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-medium cursor-pointer transition"
              >
                不保存直接切换
              </button>
              <button
                type="button"
                onClick={() => {
                  canvasHandleRef.current?.saveCurrentNotes();
                  const target = pendingTargetYear;
                  setPendingTargetYear(null);
                  changeYear(target);
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium cursor-pointer transition shadow-xs"
              >
                保存笔记并切换
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}