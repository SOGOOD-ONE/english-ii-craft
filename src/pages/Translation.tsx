import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Languages, Sparkles } from 'lucide-react';
import YearPicker from '@/components/common/YearPicker';
import api from '@/api';
import type { TranslationData, TranslationSlice } from '@/types';

const MODULE = 'translation' as const;

export default function TranslationPage() {
  const subject = 'eng2';

  const [year, setYear] = useState<number>(() => {
    const saved = localStorage.getItem('translation_selected_year');
    return saved ? parseInt(saved, 10) : 2025;
  });
  const [activeSlice, setActiveSlice] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [diff, setDiff] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [revealedSlices, setRevealedSlices] = useState<Record<string, boolean>>({});

  function handleYearChange(newYear: number) {
    setYear(newYear);
    localStorage.setItem('translation_selected_year', String(newYear));
    setActiveSlice(null);
    setDiff(null);
  }

  const { data: years } = useQuery({ 
    queryKey: ['exam-years', MODULE, subject], 
    queryFn: () => api.exam.years(MODULE, subject) 
  });

  const { data } = useQuery<TranslationData>({
    queryKey: ['exam-content', MODULE, year, subject],
    queryFn: async () => {
      try { 
        return await api.exam.content<TranslationData>(MODULE, year, subject); 
      } catch {
        const fallbacks = import.meta.glob('@/content/**/*.json', { eager: true, import: 'default' });
        const path1 = `/src/content/${subject}/translation/${year}.json`;
        const path2 = `/src/content/translation/${year}.json`;
        return (fallbacks[path1] || fallbacks[path2]) as TranslationData;
      }
    },
  });

  const slices: TranslationSlice[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.slices) && data.slices.length > 0) return data.slices;
    const text = data.source || '';
    const toks = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+['"]?\s*/g) || [text];
    return toks.map((t, i) => ({
      id: `s${i + 1}`, start: 0, end: 0, text: t.trim(),
      refZh: '', points: [], pitfalls: [], vocabIds: [],
    })).filter(s => s.text.length >= 4);
  }, [data]);

  function toggleReveal(id: string) {
    setRevealedSlices(prev => ({ ...prev, [id]: !prev[id] }));
  }

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
      setRevealedSlices(prev => ({ ...prev, [activeSlice]: true }));
    } catch (e: any) {
      alert(e?.response?.data?.detail || '提交失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-5 px-1.5 sm:px-3">
      {/* 统一段落翻译工作台主容器 */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* 顶部标题与年份/控制栏 */}
        <div className="p-3 sm:p-4 border-b border-zinc-100 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-zinc-800 text-xs sm:text-sm">
                  {year}年 考研英语 · Part C 段落翻译精修
                </span>
                <span className="text-[10px] sm:text-[11px] bg-zinc-100 text-zinc-700 border border-zinc-200/80 px-2 py-0.5 rounded font-mono font-medium">
                  Part C / 15分
                </span>
              </div>
              <p className="text-zinc-500 text-[11px] sm:text-xs mt-1">
                支持按真题官方段落逐句切片练习、字符级 Diff 对比、考点解析与易错避坑。
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={() => setShowFullText(!showFullText)}
                className="flex items-center gap-1 text-xs border border-zinc-200/80 text-zinc-700 hover:bg-zinc-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer bg-white active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                <span>{showFullText ? '收起完整原文' : '完整真题与译文'}</span>
                {showFullText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <YearPicker
                years={(Array.isArray(years) ? years : Array.isArray((years as any)?.years) ? (years as any).years : []).map((y: any) => typeof y === 'number' ? y : y?.year).filter((y: any): y is number => typeof y === 'number')}
                value={year}
                onChange={handleYearChange}
              />
            </div>
          </div>

          {/* 全文对照折叠面板 */}
          {showFullText && data && (
            <div className="mt-4 p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="space-y-2">
                <div className="font-semibold text-zinc-800 flex items-center gap-1.5 pb-1 border-b border-zinc-200/80">
                  <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                  英语真题完整原文 (Official English Text)
                </div>
                <div className="text-zinc-800 whitespace-pre-line font-serif leading-6 bg-white p-3 rounded border border-zinc-200/80">
                  {data.source || ''}
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-semibold text-zinc-800 flex items-center gap-1.5 pb-1 border-b border-zinc-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  权威官方参考译文 (Reference Translation)
                </div>
                <div className="text-zinc-700 whitespace-pre-line leading-6 bg-white p-3 rounded border border-zinc-200/80">
                  {data.refZh || '暂无完整参考译文'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 文章分句精修区域 */}
        <div className="divide-y divide-zinc-100 bg-white">
          <div className="px-5 py-2.5 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500 font-medium border-b border-zinc-100">
            <span>逐句切片修文面板 (共 {slices.length} 句)</span>
            <span className="text-[11px] text-zinc-400">点击“开始翻译”针对特定语句进行精修对比</span>
          </div>

          {slices.map((s, i) => {
            const isCurrent = activeSlice === s.id;
            const isRevealed = Boolean(revealedSlices[s.id]);

            return (
              <div
                key={s.id}
                className={`p-4 sm:p-5 transition-all ${
                  isCurrent ? 'bg-zinc-50/80 border-l-3 border-l-zinc-900' : 'hover:bg-zinc-50/50'
                }`}
              >
                {/* 句子序号与英文原句 */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center justify-center bg-zinc-100 text-zinc-800 border border-zinc-200/80 text-[11px] font-semibold px-2 py-0.5 rounded-md font-mono">
                        Sentence {i + 1}
                      </span>
                    </div>
                    <div className="text-zinc-900 text-sm sm:text-base font-serif leading-relaxed">
                      {s.text}
                    </div>
                  </div>
                </div>

                {isCurrent ? (
                  <div className="mt-3 pt-3 border-t border-zinc-200 bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
                    <div className="mb-2">
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">你的中文译文：</label>
                      <textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        className="w-full p-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 text-xs leading-relaxed bg-zinc-50/30"
                        rows={3}
                        placeholder="请在此输入你对本句的中文翻译..."
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        提交后自动执行字符级 Diff 差异比对与考点解析
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveSlice(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-800 px-2.5 py-1.5 cursor-pointer"
                        >
                          收起
                        </button>
                        <button
                          type="button"
                          disabled={busy || !draft.trim()}
                          onClick={onSubmit}
                          className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-1.5 rounded-lg text-xs disabled:opacity-50 transition cursor-pointer shadow-xs"
                        >
                          {busy ? '正在比对中...' : '提交并对比差异'}
                        </button>
                      </div>
                    </div>

                    {/* Diff 对比与考点解析报告 */}
                    {diff && (
                      <div className="mt-3 pt-3 border-t border-zinc-200/80 space-y-3">
                        <div>
                          <div className="font-semibold text-zinc-800 text-xs mb-1.5 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>标准参考译文：</span>
                          </div>
                          <div className="bg-zinc-50/80 p-3 border border-zinc-200/80 rounded-lg text-xs text-zinc-900 leading-relaxed font-sans">
                            {s.refZh || '(暂无)'}
                          </div>
                        </div>

                        {diff.diff_report?.diffs && diff.diff_report.diffs.length > 0 && (
                          <div className="p-3 bg-white border border-zinc-200/80 rounded-lg text-xs leading-relaxed">
                            <div className="text-[11px] text-zinc-500 mb-2 flex flex-wrap gap-3">
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2.5 h-2.5 bg-emerald-200 border border-emerald-400 rounded-sm"></span>
                                你的翻译独有 (绿色)
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2.5 h-2.5 bg-rose-200 border border-rose-400 rounded-sm"></span>
                                参考译文要点 (红色中划线)
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2.5 h-2.5 bg-white border border-zinc-300 rounded-sm"></span>
                                完全吻合
                              </span>
                            </div>
                            <div className="p-2.5 bg-zinc-50/80 rounded-lg border border-zinc-200/80 break-words font-mono text-xs leading-6">
                              {diff.diff_report.diffs.map(([op, txt]: [number, string], k: number) => {
                                if (op === -1) {
                                  return (
                                    <span
                                      key={k}
                                      className="bg-rose-100 text-rose-800 px-0.5 mx-0.5 rounded line-through border border-rose-200"
                                      title="参考译文存在，你的翻译未译出"
                                    >
                                      {txt}
                                    </span>
                                  );
                                }
                                if (op === 1) {
                                  return (
                                    <span
                                      key={k}
                                      className="bg-emerald-100 text-emerald-800 px-0.5 mx-0.5 rounded font-medium border border-emerald-200"
                                      title="你的译文独有"
                                    >
                                      {txt}
                                    </span>
                                  );
                                }
                                return <span key={k} className="text-zinc-800">{txt}</span>;
                              })}
                            </div>
                          </div>
                        )}

                        {/* 考点与易错陷阱 */}
                        {s.points && s.points.length > 0 && (
                          <div className="text-zinc-800 bg-amber-50/60 border border-amber-200/80 p-3 rounded-lg text-xs leading-relaxed">
                            <strong className="text-amber-900 block mb-1">💡 核心考点透视：</strong>
                            {(s.points || []).map((p, j) => (
                              <div key={j} className="text-zinc-700 pl-1">• {p}</div>
                            ))}
                          </div>
                        )}

                        {s.pitfalls && s.pitfalls.length > 0 && (
                          <div className="text-amber-800 bg-amber-50/60 border border-amber-200 p-3 rounded-lg text-xs leading-relaxed">
                            <strong className="text-amber-900 block mb-1">⚠️ 易错陷阱提示：</strong>
                            {(s.pitfalls || []).map((p, j) => (
                              <div key={j} className="text-amber-800 pl-1">• {p}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-zinc-500 text-xs">
                      {isRevealed ? (
                        <span className="text-zinc-800 bg-zinc-50 px-2.5 py-1 rounded border border-zinc-100 inline-block">
                          <strong>参考译文：</strong> {s.refZh}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">
                          {s.refZh ? '参考译文已准备就绪' : '暂无参考'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => toggleReveal(s.id)}
                        className="text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 px-2.5 py-1 rounded-lg transition cursor-pointer bg-white"
                      >
                        {isRevealed ? '隐藏参考' : '查看参考'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onFocusSlice(s)}
                        className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        <span>开始翻译</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
