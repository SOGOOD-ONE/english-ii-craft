'use client';

import { useEffect, useState, useCallback } from 'react';
import { Inbox, Volume2 } from 'lucide-react';
import type { VocabCard, Rating } from '@/types';
import { getDueCards, updateCard } from '@/lib/db';
import { scheduleCard, previewNextLabel, RATING_LABEL } from '@/lib/fsrs';

const RATINGS: Rating[] = [1, 2, 3, 4];

export default function VocabPage() {
  const [queue, setQueue] = useState<VocabCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const due = await getDueCards();
    setQueue(due);
    setIdx(0);
    setFlipped(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Space 翻面
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && queue[idx] && !flipped) {
        e.preventDefault();
        setFlipped(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [queue, idx, flipped]);

  const card = queue[idx];

  const rate = async (rating: Rating) => {
    if (!card?.id) return;
    const patch = scheduleCard(card, rating);
    await updateCard(card.id, patch);
    if (idx + 1 < queue.length) {
      setIdx(idx + 1);
      setFlipped(false);
    } else {
      setQueue([]);
      setIdx(0);
    }
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  if (loading) {
    return <div className="text-center text-zinc-400 py-20">加载生词本...</div>;
  }

  if (queue.length === 0 || !card) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-full max-w-lg bg-white border border-zinc-200 rounded p-8 text-center">
          <Inbox size={28} className="mx-auto text-zinc-300" />
          <div className="font-semibold text-zinc-800 mt-3">暂无待复习卡片</div>
          <p className="text-zinc-400 mt-1">
            去各模块划词抓取生词,或所有卡片均已排程到未来复习。
          </p>
        </div>
      </div>
    );
  }

  const cloze = makeCloze(card.contextSentence, card.word);

  return (
    <section className="flex justify-center py-6">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded p-4 shadow-sm">
        <div className="border-b border-zinc-100 pb-2 mb-4 flex justify-between items-center">
          <span className="font-semibold text-zinc-800">FSRS 间隔复习流</span>
          <span className="text-zinc-400 font-mono text-[11px]">
            待复习: {queue.length - idx} 张 · 第 {idx + 1}/{queue.length}
          </span>
        </div>

        {/* 卡片正面 */}
        {!flipped && (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900">
                {card.word}
              </div>
              <button
                onClick={() => speak(card.word)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                <Volume2 size={14} />
              </button>
            </div>
            {card.phonetic && (
              <div className="text-zinc-400 mb-4 font-mono">{card.phonetic}</div>
            )}

            <div className="bg-zinc-50 p-3 rounded text-zinc-700 text-left border border-zinc-100 leading-relaxed font-mono">
              &ldquo;{cloze}&rdquo;
            </div>
            <div className="text-[11px] text-zinc-400 text-left mt-1">
              来源标签: {card.source}
            </div>

            <button
              onClick={() => setFlipped(true)}
              className="mt-6 w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-medium"
            >
              显示释义与完整原句 (Space)
            </button>
          </div>
        )}

        {/* 卡片背面 */}
        {flipped && (
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between py-2">
              <span className="text-zinc-800">
                <strong>{card.word}</strong>{' '}
                <span className="text-zinc-400 font-mono">{card.phonetic}</span>
              </span>
              <button
                onClick={() => speak(card.word)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                <Volume2 size={14} />
              </button>
            </div>
            <div className="py-2 text-zinc-800">
              <strong>释义:</strong> {card.definition}
            </div>
            <div className="py-2 text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-100 font-mono leading-relaxed">
              &ldquo;{card.contextSentence}&rdquo;
            </div>

            <div className="mt-3 text-[11px] text-zinc-400">
              评分后按算法排程下次复习(掌握判定:新词 3 次认识 / 复习 2 次认识)
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-zinc-100 font-mono">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  onClick={() => rate(r)}
                  className="p-2 border border-zinc-200 hover:bg-zinc-100 rounded text-center transition-colors"
                >
                  <div className="font-bold">{RATING_LABEL[r]}</div>
                  <div className="text-zinc-400 text-[10px]">
                    {previewNextLabel(r, card)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function makeCloze(sentence: string, word: string) {
  return sentence.replace(new RegExp(escapeRegExp(word), 'gi'), '_______');
}
