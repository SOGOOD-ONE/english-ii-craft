'use client';

import { useState } from 'react';
import { Radar } from 'lucide-react';
import YearPicker from '@/components/common/YearPicker';
import { YEARS, getPartB } from '@/content';
import type { PartBData } from '@/types';

function isStructured(data: PartBData | undefined): boolean {
  return !!data && data.paragraphs.length > 0 && data.options.length > 0;
}

function splitHighlight(text: string, highlight: string, highlightId: string) {
  const idx = text.indexOf(highlight);
  if (idx === -1) return [{ text, highlightId: null }];
  return [
    { text: text.slice(0, idx), highlightId: null },
    { text: highlight, highlightId },
    { text: text.slice(idx + highlight.length), highlightId: null },
  ];
}

export default function PartBPage() {
  const years = YEARS['part-b'];
  const [year, setYear] = useState<number>(years.includes(2023) ? 2023 : years[0]);
  const data = getPartB(year);
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

  const activeHighlightId = hoveredOptionId && data
    ? data.synonymMappings.find((m) => m.optionId === hoveredOptionId)?.textHighlightId
    : undefined;
  const activeExplanation = hoveredOptionId && data
    ? data.synonymMappings.find((m) => m.optionId === hoveredOptionId)?.explanation
    : undefined;

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-800">新题型逻辑雷达</span>
          <YearPicker years={years} value={year} onChange={setYear} />
        </div>
        <div className="bg-white border border-zinc-200 rounded p-8 text-center text-zinc-400">
          该年份暂无新题型数据
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-800">新题型逻辑雷达</span>
        <YearPicker years={years} value={year} onChange={setYear} />
      </div>

      {!isStructured(data) ? (
        // ------- 降级视图:直接显示从 PDF 提取的 raw 文本 -------
        <div className="bg-white border border-zinc-200 rounded p-4" data-source={`${year} 新题型`}>
          <div className="border-b border-zinc-100 pb-2 mb-3 flex justify-between items-center">
            <span className="font-semibold text-zinc-800">
              {year}年新题型{data.type ? `(${data.type === 'subheading' ? '小标题对应' : data.type})` : ''}
            </span>
            <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              待解析
            </span>
          </div>
          <div className="bg-zinc-50 p-3 border border-dashed border-zinc-300 rounded whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-700">
            {data.raw || data.title}
          </div>
          <div className="mt-3 text-[11px] text-zinc-400 border border-zinc-200 rounded p-2">
            📌 该年份已提取出原题面文本,但 paragraphs/options 结构化字段、答案、
            同义词映射、干扰项原因等尚待人工整理。
            补全内容后写入 content/part-b/{year}.json,会自动切换到右侧的联动高亮交互视图。
          </div>
        </div>
      ) : (
        // ------- 结构化视图:联动高亮 + 干扰项靶场 -------
        <div className="grid grid-cols-12 gap-3">
          <div
            className="col-span-12 lg:col-span-8 bg-white border border-zinc-200 rounded p-3 lg:h-[calc(100vh-116px)] overflow-y-auto"
            data-source={`${year} 新题型`}
          >
            <div className="border-b border-zinc-100 pb-2 mb-3 font-semibold text-zinc-800">
              {year}年新题型:{data.type === 'subheading' ? '小标题对应' : data.type}
            </div>
            <div className="space-y-4 leading-relaxed text-zinc-700">
              {data.paragraphs.map((p, idx) => {
                const correctOpt = data.options.find((o) => o.id === p.correctOptionId);
                const parts = p.highlight
                  ? splitHighlight(p.text, p.highlight.text, p.highlight.id)
                  : [{ text: p.text, highlightId: null }];
                return (
                  <div key={p.id} className="p-2 border border-zinc-100 rounded">
                    <div className="font-bold text-zinc-900 mb-1">[Paragraph {idx + 1}]</div>
                    <p>
                      {parts.map((seg, i) =>
                        seg.highlightId ? (
                          <span
                            key={i}
                            id={seg.highlightId}
                            className={
                              seg.highlightId === activeHighlightId
                                ? 'synonym-glow px-0.5 rounded'
                                : 'px-0.5 rounded'
                            }
                          >
                            {seg.text}
                          </span>
                        ) : (
                          <span key={i}>{seg.text}</span>
                        )
                      )}
                    </p>
                    <div className="mt-2 text-zinc-400">
                      选择匹配小标题:{' '}
                      <span className="text-zinc-800 font-semibold">
                        [{p.correctOptionId}] {correctOpt?.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-200 rounded p-3 lg:h-[calc(100vh-116px)] flex flex-col justify-between">
            <div>
              <div className="border-b border-zinc-100 pb-2 mb-3 font-semibold text-zinc-800">
                小标题选项 (悬停体验同义词联动):
              </div>
              <div className="space-y-2 font-mono">
                {data.options.map((opt) => {
                  const mapping = data.synonymMappings.find((m) => m.optionId === opt.id);
                  return (
                    <div
                      key={opt.id}
                      onMouseEnter={() => setHoveredOptionId(opt.id)}
                      onMouseLeave={() => setHoveredOptionId(null)}
                      className={
                        opt.isDistractor
                          ? 'p-2 border border-dashed border-zinc-200 rounded text-zinc-400'
                          : 'p-2 border border-zinc-200 rounded hover:border-zinc-900 cursor-pointer transition-colors'
                      }
                    >
                      <div>
                        [{opt.id}] {opt.text}
                      </div>
                      {mapping && (
                        <div className="text-[10px] text-zinc-400 font-sans mt-0.5">
                          同义替换: {mapping.explanation}
                        </div>
                      )}
                      {opt.isDistractor && opt.distractorReason && (
                        <div className="text-[10px] text-zinc-400 font-sans mt-0.5">
                          干扰项: {opt.distractorReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {activeExplanation && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-[11px] text-yellow-800 leading-relaxed">
                  <Radar size={11} className="inline mr-1" />
                  {activeExplanation}
                </div>
              )}
            </div>
            <div className="p-2 bg-zinc-50 border border-zinc-200 rounded text-zinc-500">
              逻辑说明:新题型 100% 考察词汇同义替换,无需通篇翻译,锁定题干核心词即可秒杀。
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
