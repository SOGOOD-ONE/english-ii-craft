'use client';

import { useMemo, useState } from 'react';
import { diffChars } from 'diff';
import { CheckCircle2 } from 'lucide-react';
import YearPicker from '@/components/common/YearPicker';
import { YEARS, getTranslation } from '@/content';

export default function TranslationPage() {
  const years = YEARS.translation;
  const [year, setYear] = useState<number>(years.includes(2023) ? 2023 : years[0]);
  const data = getTranslation(year);

  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const doneCount = Object.values(submitted).filter(Boolean).length;

  const onResetYear = () => {
    setInputs({});
    setSubmitted({});
  };
  const handleSubmit = (id: number) => {
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

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-800">段落翻译 Diff 精修台</span>
        <div className="flex items-center gap-2">
          <YearPicker years={years} value={year} onChange={(y) => { setYear(y); onResetYear(); }} />
          <span className="text-zinc-400 font-mono text-[11px]">
            进度: {doneCount}/{data.segments.length} 句
          </span>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded p-3">
        <div className="border-b border-zinc-100 pb-2 mb-3 flex justify-between items-center">
          <span className="font-semibold text-zinc-800">{data.title}</span>
          <span className="text-zinc-400 font-mono text-[11px]">{data.intro}</span>
        </div>

        {data.segments.map((seg) => {
          const isSubmitted = submitted[seg.id];
          const userZh = inputs[seg.id] ?? '';
          return (
            <div
              key={seg.id}
              className="border border-zinc-200 rounded p-3 mb-3 bg-zinc-50/50"
              data-source={`${year} 翻译`}
            >
              <div className="font-mono text-zinc-800 text-xs mb-2">
                <strong>[英文原句 {seg.id}]</strong> {seg.en}
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
                    className="bg-zinc-900 disabled:opacity-40 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} /> 提交并对比差异
                  </button>
                )}
              </div>

              {isSubmitted && (
                <div className="mt-3 pt-3 border-t border-zinc-200 space-y-2">
                  <div>
                    <div className="font-semibold text-zinc-700 mb-1">
                      译文差异比对 (Diff):
                      <span className="ml-2 font-normal text-[11px] text-zinc-400">
                        <span className="bg-emerald-100 text-emerald-800 px-1 rounded">绿色</span>{' '}
                        官方更佳/漏翻 ·{' '}
                        <span className="bg-rose-100 text-rose-800 line-through px-1 rounded">红色</span>{' '}
                        多翻/冗余
                      </span>
                    </div>
                    <div className="bg-white p-2 border border-zinc-200 rounded font-mono leading-relaxed">
                      <DiffView userZh={userZh} refZh={seg.refZh || '(参考译文待补)'} />
                    </div>
                  </div>

                  {seg.refZh && (
                    <div className="text-zinc-600 bg-zinc-50 p-2 rounded leading-normal border border-zinc-200">
                      <strong>参考译文:</strong> {seg.refZh}
                    </div>
                  )}

                  {seg.points.length > 0 && (
                    <div className="text-zinc-600 bg-zinc-100 p-2 rounded leading-normal">
                      <strong>考点解析:</strong>
                      <ol className="list-decimal pl-5 mt-1 space-y-0.5">
                        {seg.points.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {seg.pitfalls.length > 0 && (
                    <div className="text-zinc-600 bg-amber-50 border border-amber-200 p-2 rounded leading-normal">
                      <strong className="text-amber-800">易错陷阱:</strong>
                      <ol className="list-decimal pl-5 mt-1 space-y-0.5">
                        {seg.pitfalls.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {seg.refZh === '' && (
                    <div className="text-[11px] text-zinc-400 border border-dashed border-zinc-300 p-2 rounded">
                      📌 该年份的参考译文/考点/陷阱暂未录入,已从真题 PDF 提取出英文原句。
                      后续可在 content/translation/{year}.json 中补全 refZh/points/pitfalls 字段。
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
  const parts = useMemo(() => diffChars(userZh, refZh), [userZh, refZh]);
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
