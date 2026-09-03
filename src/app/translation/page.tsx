'use client';

import { useMemo, useState } from 'react';
import { diffChars } from 'diff';
import { CheckCircle2, BookOpen, Eye, EyeOff } from 'lucide-react';
import YearPicker from '@/components/common/YearPicker';
import { YEARS, getTranslation } from '@/content';
import type { TranslationSlice } from '@/types';

export default function TranslationPage() {
  const years = YEARS.translation;
  const [year, setYear] = useState<number>(years.includes(2023) ? 2023 : years[0]);
  const data = getTranslation(year);

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showRef, setShowRef] = useState(false);

  const slices: TranslationSlice[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.slices) && data.slices.length > 0) return data.slices;
    // 退化:仅有整段 source,还没切句,兜底按句子切
    const text = data.source || '';
    const tokens = text
      .replace(/\s+/g, ' ')
      .match(/[^.!?]+[.!?]+['"]?\s*/g) || [text];
    return tokens
      .map((t, i) => ({
        id: `s${i + 1}`,
        start: 0,
        end: 0,
        text: t.trim(),
        refZh: '',
        points: [],
        pitfalls: [],
        vocabIds: [],
      }))
      .filter((s) => s.text.length >= 4);
  }, [data]);

  const doneCount = Object.values(submitted).filter(Boolean).length;
  const total = slices.length;

  const onResetYear = () => {
    setInputs({});
    setSubmitted({});
    setShowRef(false);
  };

  const handleSubmit = (id: string) => {
    setSubmitted((s) => ({ ...s, [id]: true }));
  };

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-800">段落翻译 Diff 精修台</span>
          <YearPicker years={years} value={year} onChange={(y) => { setYear(y); onResetYear(); }} />
        </div>
        <div className="bg-white border border-zinc-200 rounded p-8 text-center text-zinc-400">
          该年份暂无翻译数据
        </div>
      </div>
    );
  }

  const hasRef = Boolean(data.refZh || slices.some((s) => s.refZh));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-800">段落翻译 Diff 精修台</span>
        <div className="flex items-center gap-2">
          <YearPicker years={years} value={year} onChange={(y) => { setYear(y); onResetYear(); }} />
          <span className="text-zinc-400 font-mono text-[11px]">
            进度 {doneCount}/{total}
          </span>
        </div>
      </div>

      {/* 整段原文 + 参考译文 */}
      <div className="bg-white border border-zinc-200 rounded p-3 space-y-2">
        <div className="border-b border-zinc-100 pb-2 flex justify-between items-center">
          <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
            <BookOpen size={14} />
            {year} 年 · 英译汉原文
          </span>
          {hasRef ? (
            <button
              type="button"
              onClick={() => setShowRef((v) => !v)}
              className="text-[11px] text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
            >
              {showRef ? <><EyeOff size={12} /> 隐藏参考译文</> : <><Eye size={12} /> 显示参考译文</>}
            </button>
          ) : (
            <span className="text-[11px] text-zinc-400">📌 参考译文待补(可直接粘贴入 content/translation/{year}.json)</span>
          )}
        </div>

        <div className="font-mono text-[12.5px] text-zinc-800 leading-[1.9] whitespace-pre-wrap bg-zinc-50 border border-zinc-200 p-3 rounded">
          {data.source}
        </div>

        {showRef && hasRef && (
          <div className="text-[13px] text-zinc-700 leading-[1.9] whitespace-pre-wrap bg-emerald-50/60 border border-emerald-200 p-3 rounded">
            <strong className="text-emerald-800">参考译文:</strong> {data.refZh || slices.map((s) => s.refZh).filter(Boolean).join(' ')}
          </div>
        )}

        {(data.points?.length ?? 0) > 0 && (
          <div className="text-zinc-600 bg-sky-50 border border-sky-200 p-2 rounded leading-normal text-[12.5px]">
            <strong className="text-sky-800">整段考点:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {data.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        {(data.pitfalls?.length ?? 0) > 0 && (
          <div className="text-zinc-600 bg-amber-50 border border-amber-200 p-2 rounded leading-normal text-[12.5px]">
            <strong className="text-amber-800">常见误区:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {data.pitfalls.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 逐句精修 */}
      <div className="bg-white border border-zinc-200 rounded p-3">
        <div className="border-b border-zinc-100 pb-2 mb-3 flex justify-between items-center">
          <span className="font-semibold text-zinc-800 text-sm">逐句翻译 + Diff 对比</span>
          <span className="text-zinc-400 font-mono text-[11px]">共 {total} 句</span>
        </div>

        {slices.map((seg, idx) => {
          const isSubmitted = submitted[seg.id];
          const userZh = inputs[seg.id] ?? '';
          return (
            <div
              key={seg.id}
              className="border border-zinc-200 rounded p-3 mb-3 bg-zinc-50/50 last:mb-0"
              data-source={`${year} 翻译 句${idx + 1}`}
            >
              <div className="font-mono text-zinc-800 text-[12px] mb-2 leading-[1.8]">
                <strong className="inline-block mr-1 text-zinc-500">[句 {idx + 1}]</strong>
                {seg.text}
              </div>
              <div className="mb-2">
                <textarea
                  value={userZh}
                  onChange={(e) =>
                    setInputs((s) => ({ ...s, [seg.id]: e.target.value }))
                  }
                  disabled={isSubmitted}
                  className="w-full p-2 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 text-xs disabled:bg-zinc-100 disabled:cursor-not-allowed"
                  rows={2}
                  placeholder="在此输入你的中文译文..."
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-[11px]">
                  {isSubmitted
                    ? '已提交,下方为字符级 Diff 对比与考点透视'
                    : '点击提交即可查看字符级 Diff 对比与考点透视'}
                </span>
                {!isSubmitted && (
                  <button
                    onClick={() => handleSubmit(seg.id)}
                    disabled={!userZh.trim()}
                    className="bg-zinc-900 disabled:opacity-40 text-white px-3 py-1 rounded flex items-center gap-1 text-xs"
                  >
                    <CheckCircle2 size={12} /> 提交并对比差异
                  </button>
                )}
              </div>

              {isSubmitted && (
                <div className="mt-3 pt-3 border-t border-zinc-200 space-y-2">
                  <div>
                    <div className="font-semibold text-zinc-700 mb-1 text-xs">
                      译文差异比对 (Diff):
                      <span className="ml-2 font-normal text-[11px] text-zinc-400">
                        <span className="bg-emerald-100 text-emerald-800 px-1 rounded">绿色</span>{' '}
                        官方更佳/漏翻 ·{' '}
                        <span className="bg-rose-100 text-rose-800 line-through px-1 rounded">红色</span>{' '}
                        多翻/冗余
                      </span>
                    </div>
                    <div className="bg-white p-2 border border-zinc-200 rounded font-mono leading-relaxed text-[12px]">
                      <DiffView userZh={userZh} refZh={seg.refZh || ''} />
                      {!seg.refZh && (
                        <div className="mt-2 text-[11px] text-zinc-400 border border-dashed border-zinc-300 p-2 rounded">
                          📌 该句暂未录入参考译文。可在 content/translation/{year}.json 中
                          补全 <code>slices[{idx}].refZh</code> 后,此处会出现正确的 Diff。
                        </div>
                      )}
                    </div>
                  </div>

                  {seg.refZh && (
                    <div className="text-zinc-600 bg-zinc-50 p-2 rounded leading-normal border border-zinc-200 text-[12.5px]">
                      <strong>参考译文:</strong> {seg.refZh}
                    </div>
                  )}

                  {seg.points?.length > 0 && (
                    <div className="text-zinc-600 bg-sky-50 p-2 rounded leading-normal border border-sky-200 text-[12.5px]">
                      <strong className="text-sky-800">考点解析:</strong>
                      <ol className="list-decimal pl-5 mt-1 space-y-0.5">
                        {seg.points.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {seg.pitfalls?.length > 0 && (
                    <div className="text-zinc-600 bg-amber-50 border border-amber-200 p-2 rounded leading-normal text-[12.5px]">
                      <strong className="text-amber-800">易错陷阱:</strong>
                      <ol className="list-decimal pl-5 mt-1 space-y-0.5">
                        {seg.pitfalls.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DiffView({ userZh, refZh }: { userZh: string; refZh: string }) {
  const parts = useMemo(() => diffChars(userZh, refZh || '(参考译文待补)'), [userZh, refZh]);
  return (
    <>
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span key={i} className="bg-emerald-100 text-emerald-800 px-0.5 rounded">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={i} className="bg-rose-100 text-rose-800 line-through px-0.5 rounded">
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}
