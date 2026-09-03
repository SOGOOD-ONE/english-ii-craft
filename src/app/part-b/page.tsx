'use client';

import { useState } from 'react';
import { Radar } from 'lucide-react';
import partb2023 from '../../../content/part-b/2023.json';

export default function PartBPage() {
  const data = partb2023;
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

  // 当前悬停选项对应的需高亮原文片段 id
  const activeHighlightId = hoveredOptionId
    ? data.synonymMappings.find((m) => m.optionId === hoveredOptionId)?.textHighlightId
    : undefined;
  const activeExplanation = hoveredOptionId
    ? data.synonymMappings.find((m) => m.optionId === hoveredOptionId)?.explanation
    : undefined;

  return (
    <section className="grid grid-cols-12 gap-3">
      {/* 左栏:文章段落 */}
      <div
        className="col-span-12 lg:col-span-8 bg-white border border-zinc-200 rounded p-3 lg:h-[calc(100vh-68px)] overflow-y-auto"
        data-source="2023 新题型"
      >
        <div className="border-b border-zinc-100 pb-2 mb-3 font-semibold text-zinc-800">
          {data.title}
        </div>

        <div className="space-y-4 leading-relaxed text-zinc-700">
          {data.paragraphs.map((p, idx) => {
            const correctOpt = data.options.find((o) => o.id === p.correctOptionId);
            // 把原文按高亮子串切分
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

      {/* 右栏:选项池与同义词联动 */}
      <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-200 rounded p-3 lg:h-[calc(100vh-68px)] flex flex-col justify-between">
        <div>
          <div className="border-b border-zinc-100 pb-2 mb-3 font-semibold text-zinc-800">
            小标题选项 (将鼠标悬停在选项上体验同义词联动):
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
    </section>
  );
}

function splitHighlight(
  text: string,
  highlight: string,
  highlightId: string
): { text: string; highlightId: string | null }[] {
  const idx = text.indexOf(highlight);
  if (idx === -1) return [{ text, highlightId: null }];
  return [
    { text: text.slice(0, idx), highlightId: null },
    { text: highlight, highlightId },
    { text: text.slice(idx + highlight.length), highlightId: null },
  ];
}
