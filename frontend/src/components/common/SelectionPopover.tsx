import { useEffect, useRef, useState } from 'react';
import { captureFromSelection, getSourceLabel, isEnglishWord } from '@/lib/utils/selection';
import { addCard } from '@/lib/db';

interface PopoverState {
  visible: boolean;
  word: string;
  sentence: string;
  source: string;
  x: number;
  y: number;
  saving: boolean;
  saved: boolean;
}

const INITIAL: PopoverState = {
  visible: false, word: '', sentence: '', source: '',
  x: 0, y: 0, saving: false, saved: false,
};

export default function SelectionPopover() {
  const [state, setState] = useState<PopoverState>(INITIAL);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-selection-popover]')) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? '';
        if (!text || !isEnglishWord(text)) {
          setState((s) => (s.visible ? { ...INITIAL } : s));
          return;
        }
        const captured = captureFromSelection();
        if (!captured) return;
        const source = getSourceLabel(sel);
        setState({
          visible: true, word: captured.word, sentence: captured.sentence,
          source, x: captured.rect.x, y: captured.rect.y,
          saving: false, saved: false,
        });
      }, 30);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSave = async () => {
    setState((s) => ({ ...s, saving: true }));
    let phonetic = '';
    let definition = '(请手动补充释义)';
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(state.word)}`
      );
      if (res.ok) {
        const data = await res.json();
        const entry = data?.[0];
        const meaning = entry?.meanings?.[0];
        const def = meaning?.definitions?.[0]?.definition;
        if (def) definition = `${meaning.partOfSpeech ?? ''} ${def}`.trim();
        phonetic = entry?.phonetic || entry?.phonetics?.[0]?.text || '';
      }
    } catch { /* offline fallback */ }
    await addCard({
      word: state.word, phonetic: phonetic || undefined, definition,
      contextSentence: state.sentence, source: state.source,
    });
    setState((s) => ({ ...s, saving: false, saved: true }));
    setTimeout(() => setState(INITIAL), 900);
  };

  if (!state.visible) return null;

  return (
    <div
      data-selection-popover
      className="fixed z-50 bg-zinc-900 text-white px-2.5 py-1.5 rounded shadow-lg text-[11px] flex items-center space-x-2"
      style={{ left: `${state.x + 8}px`, top: `${state.y - 40}px` }}
    >
      <span>
        已选中: <strong className="font-mono">{state.word}</strong>
      </span>
      <button
        onClick={handleSave}
        disabled={state.saving || state.saved}
        className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-60 px-2 py-0.5 rounded text-white font-medium transition-colors"
      >
        {state.saved ? '已存入 ✓' : state.saving ? '存入中...' : '存入生词本'}
      </button>
    </div>
  );
}