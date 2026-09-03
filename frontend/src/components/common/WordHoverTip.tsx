// ============================================================
// 单词 Hover 释义提示框(全局单例)
// 前后端分离版本:
//   - 查词  → POST /api/v1/vocab/words/lookup
//   - 加生词 → POST /api/v1/vocab/cards(未登录时弹窗提示登录,不会存 Dexie)
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Loader2, AlertTriangle, Plus } from 'lucide-react';
import api from '@/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface WordSense { pos?: string; definition?: string; [k: string]: any; }
interface CachedDef {
  id?: number;
  word: string;
  lemma: string;
  phonetic: string;
  senses: WordSense[];
  collocations: string[];
  from_cache?: boolean;
}

interface TipState {
  visible: boolean; x: number; y: number; word: string; context?: string;
  loading: boolean; def?: CachedDef; err?: string; saving?: boolean; saved?: boolean;
}
const INIT: TipState = { visible: false, x: 0, y: 0, word: '', loading: false };

const SKIP_TAGS = new Set(['INPUT','TEXTAREA','SELECT','BUTTON','STYLE','SCRIPT','CODE','PRE','OPTION','NOSCRIPT','TITLE','META']);
const SKIP_ATTR = 'data-no-wordtip';
const SPAN_ATTR = 'data-w';
const WORD_RE = /[A-Za-z][A-Za-z'\-]*/g;

function normalizeWord(w: string): string {
  return (w || '').trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
}

function isInsideSkip(root: HTMLElement): boolean {
  let el: HTMLElement | null = root;
  while (el) {
    if (el.nodeType === 1) {
      if (SKIP_TAGS.has(el.tagName)) return true;
      if ((el as HTMLElement).getAttribute?.(SKIP_ATTR) != null) return true;
      if ((el as HTMLElement).getAttribute?.('data-wordtip-root') != null) return true;
    }
    el = el.parentElement;
  }
  return false;
}
function wrapWordInText(node: Text, start: number, end: number): HTMLElement | null {
  if (start >= end) return null;
  try {
    const before = node.splitText(start);
    const middle = before.splitText(end - start);
    const span = document.createElement('span');
    span.setAttribute(SPAN_ATTR, '1');
    span.className = 'wordtip-token';
    span.textContent = middle.data;
    (middle.parentNode as Node).insertBefore(span, middle);
    (middle.parentNode as Node).removeChild(middle);
    return span;
  } catch { return null; }
}
function getContextSentence(el: HTMLElement): string | undefined {
  const block = el.closest('p, li, td, th, div, section, article, blockquote, pre, h1, h2, h3, h4, h5, h6') || el.parentElement;
  if (!block) return undefined;
  const raw = block.textContent || '';
  const w = normalizeWord(el.textContent || '');
  const idx = raw.toLowerCase().indexOf(w);
  if (idx < 0) return raw.slice(0, 200);
  const start = Math.max(0, idx - 80);
  const end = Math.min(raw.length, idx + w.length + 120);
  return raw.slice(start, end).replace(/\s+/g, ' ').trim().slice(0, 200);
}
const LAST_MOVE: { current: { x: number; y: number } | null } = { current: null };

function resolveTarget(target: EventTarget | null): { el: HTMLElement; word: string; context?: string } | null {
  if (!target || !(target instanceof Node)) return null;
  if (target.nodeType === 1 && (target as HTMLElement).getAttribute(SPAN_ATTR) === '1') {
    const el = target as HTMLElement;
    return { el, word: el.textContent || '', context: getContextSentence(el) };
  }
  if (target.nodeType === 3) {
    const textNode = target as Text;
    const parentEl = textNode.parentElement;
    if (!parentEl || isInsideSkip(parentEl)) return null;
    const text = textNode.data;
    if (!text || !/[A-Za-z]/.test(text)) return null;
    const pt = LAST_MOVE.current; if (!pt) return null;
    let range: Range | null = null;
    if (typeof (document as any).caretRangeFromPoint === 'function') {
      range = (document as any).caretRangeFromPoint(pt.x, pt.y) as Range | null;
    } else if (typeof (document as any).caretPositionFromPoint === 'function') {
      const cp = (document as any).caretPositionFromPoint(pt.x, pt.y);
      if (cp) { range = document.createRange(); try { range.setStart(cp.offsetNode, cp.offset); range.setEnd(cp.offsetNode, cp.offset); } catch { range = null; } }
    }
    if (!range) return null;
    let offset = range.startContainer === textNode ? range.startOffset : textNode.data.length >> 1;
    const re = new RegExp(WORD_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const s = m.index; const e = s + m[0].length;
      if (offset >= s && offset <= e) {
        const fresh = wrapWordInText(textNode, s, e);
        if (fresh) return { el: fresh, word: fresh.textContent || '', context: getContextSentence(fresh) };
        return null;
      }
    }
  }
  return null;
}

export default function WordHoverTip() {
  const nav = useNavigate();
  const isAuthed = useAuthStore(s => s.isAuthenticated());
  const [state, setState] = useState<TipState>(INIT);
  const stateRef = useRef(state); stateRef.current = state;
  const enterTimer = useRef<number | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const abortRef = useRef<number | null>(null);
  const currentWordRef = useRef<string>('');
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('eii_wordtip_disabled') === '1') setEnabled(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => { LAST_MOVE.current = { x: e.clientX, y: e.clientY }; };
    const onOver = (e: MouseEvent) => {
      const tgt = e.target as HTMLElement | null; if (!tgt) return;
      if (tgt.closest && tgt.closest('[data-wordtip-root]')) return;
      const resolved = resolveTarget(e.target); if (!resolved) return;
      const wordKey = normalizeWord(resolved.word);
      if (!wordKey || wordKey.length < 2) return;
      const rect = resolved.el.getBoundingClientRect();
      const show = (patch: Partial<TipState>) => setState({ visible: true, x: rect.left + rect.width / 2, y: rect.bottom + 6, word: resolved.word, context: resolved.context, loading: false, ...patch });
      if (enterTimer.current) window.clearTimeout(enterTimer.current);
      if (leaveTimer.current) { window.clearTimeout(leaveTimer.current); leaveTimer.current = null; }
      if (currentWordRef.current === wordKey && stateRef.current.def) { show({ def: stateRef.current.def }); return; }
      enterTimer.current = window.setTimeout(async () => {
        currentWordRef.current = wordKey;
        show({ loading: true, def: undefined, err: undefined });
        if (abortRef.current) window.clearTimeout(abortRef.current);
        const myReq = Date.now(); abortRef.current = myReq;
        try {
          const r = await api.vocab.lookupWord(resolved.word, resolved.context || '');
          if (abortRef.current !== myReq) return;
          if (currentWordRef.current !== wordKey) return;
          const def: CachedDef = {
            id: r.id, word: r.lemma, lemma: r.lemma, phonetic: r.phonetic || '',
            senses: (r.senses || []).map((s: any) => ({
              pos: s.pos, definition: s.definition ?? (typeof s === 'string' ? s : JSON.stringify(s)),
            })),
            collocations: r.collocations || [], from_cache: !!r.from_cache,
          };
          show({ loading: false, def, err: undefined });
        } catch (err: any) {
          if (abortRef.current !== myReq) return;
          if (currentWordRef.current !== wordKey) return;
          show({ loading: false, err: err?.response?.data?.detail || err?.message || '查询失败,请登录后再试或检查后端 Key' });
        }
      }, 260);
    };
    const onOut = (e: MouseEvent) => {
      const to = (e as MouseEvent & { relatedTarget?: Node | null }).relatedTarget as Node | null;
      const tip = rootRef.current;
      if (tip && to && tip.contains(to)) return;
      if (enterTimer.current) { window.clearTimeout(enterTimer.current); enterTimer.current = null; }
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => { setState(s => ({ ...s, visible: false })); currentWordRef.current = ''; }, 220);
    };
    const tipEnter = () => { if (leaveTimer.current) { window.clearTimeout(leaveTimer.current); leaveTimer.current = null; } };
    const tipLeave = () => {
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => { setState(s => ({ ...s, visible: false })); currentWordRef.current = ''; }, 150);
    };
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    const el = rootRef.current;
    el?.addEventListener('mouseenter', tipEnter); el?.addEventListener('mouseleave', tipLeave);
    return () => {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
      el?.removeEventListener('mouseenter', tipEnter); el?.removeEventListener('mouseleave', tipLeave);
      if (enterTimer.current) window.clearTimeout(enterTimer.current);
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    };
  }, [enabled]);

  const pos = useAutoFlip(state.x, state.y, state.visible);

  const onSaveWord = async () => {
    if (!state.word) return;
    if (!isAuthed) {
      if (confirm('加入生词本需要先登录,现在去登录?')) nav('/login');
      return;
    }
    setState(s => ({ ...s, saving: true, saved: false }));
    try {
      const d = state.def || (await api.vocab.lookupWord(state.word, state.context || ''));
      const payload: any = {
        lemma: d.lemma || normalizeWord(state.word),
        phonetic: d.phonetic,
        senses: (d.senses || []).map((s: any) => typeof s === 'string' ? { definition: s } : s),
        collocations: d.collocations || [],
        context_sentence: state.context || '',
        source_path: '',
      };
      if (d.id) payload.word_id = d.id;
      await api.vocab.cardsCreate(payload);
      setState(s => ({ ...s, saving: false, saved: true }));
      setTimeout(() => setState(s => ({ ...s, saved: false })), 1500);
    } catch (e: any) {
      setState(s => ({ ...s, saving: false, err: e?.response?.data?.detail || e?.message || '加生词失败' }));
    }
  };

  const fmtSense = (s: WordSense): string => {
    const parts = [];
    if (s.pos) parts.push(s.pos.endsWith('.') ? s.pos : s.pos + '.');
    const def = s.definition; if (def) parts.push(def);
    else {
      const rest = Object.entries(s).filter(([k]) => !['pos', 'definition'].includes(k)).map(([_, v]) => String(v));
      parts.push(...rest);
    }
    return parts.join(' ');
  };

  return (
    <>
      <button
        type="button"
        title={enabled ? '关闭鼠标悬停查词' : '开启鼠标悬停查词'}
        onClick={() => {
          const next = !enabled; setEnabled(next);
          localStorage.setItem('eii_wordtip_disabled', next ? '1' : '0');
        }}
        className="fixed right-3 bottom-3 z-40 bg-white/95 border border-zinc-200 shadow-md hover:shadow-lg rounded-full w-8 h-8 flex items-center justify-center text-zinc-700 hover:text-zinc-900 backdrop-blur"
      >
        <BookOpen size={14} className={enabled ? '' : 'text-zinc-400'} />
      </button>

      {state.visible && (
        <div
          ref={rootRef}
          data-wordtip-root="1"
          style={pos.style}
          className={[
            'fixed z-50 w-72 max-w-[92vw] bg-zinc-900 text-zinc-100 rounded-md shadow-xl border border-zinc-700 p-2.5 text-[11px] leading-relaxed',
            pos.flip ? 'origin-bottom-center' : 'origin-top-center',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <div className="font-bold text-sm text-white break-words">{state.word}</div>
              {state.def?.phonetic && (
                <div className="text-zinc-400 font-mono text-[10px] mt-0.5">{state.def.phonetic}</div>
              )}
              {state.def?.from_cache && <div className="text-[10px] text-emerald-300 mt-0.5">✨ 数据库缓存命中</div>}
            </div>
            <button
              type="button"
              onClick={onSaveWord}
              disabled={state.saving || state.saved}
              title="加入生词本(需登录)"
              className="shrink-0 border border-zinc-600 rounded px-2 py-0.5 hover:bg-zinc-800 disabled:opacity-60 text-[10px] flex items-center gap-1"
            >
              {state.saved ? (<>✓ 已加入</>) : state.saving ? (<><Loader2 size={10} className="animate-spin" />保存中</>) : (<><Plus size={10} />生词本</>)}
            </button>
          </div>
          {state.loading && (
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Loader2 size={11} className="animate-spin" />后端 /vocab/words/lookup 查询中…
            </div>
          )}
          {state.err && !state.loading && (
            <div className="flex items-start gap-1.5 text-amber-300">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              <div className="break-words">{state.err}</div>
            </div>
          )}
          {state.def && !state.loading && (
            <div className="space-y-1.5">
              <ol className="space-y-0.5">
                {state.def.senses.map((s, i) => (
                  <li key={i} className="flex gap-1.5"><span className="text-zinc-500 shrink-0 w-4">{i + 1}.</span>
                    <span className="break-words text-zinc-100">{fmtSense(s)}</span></li>
                ))}
              </ol>
              {state.def.collocations?.length > 0 && (
                <div>
                  <div className="text-zinc-400 text-[10px] mb-0.5">常见搭配</div>
                  <div className="flex flex-wrap gap-1">
                    {state.def.collocations.map((c, i) => (
                      <span key={i} className="rounded border border-zinc-700 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-200">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function useAutoFlip(x: number, y: number, visible: boolean) {
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const H = 140;
    const needFlip = typeof window !== 'undefined' && y + H > window.innerHeight - 12;
    setFlip(needFlip);
  }, [x, y, visible]);
  const left = typeof window !== 'undefined' ? Math.max(12, Math.min(window.innerWidth - 12 - 288, x - 144)) : x - 144;
  const top = flip ? y - 8 - 150 : y;
  return { flip, style: { left: `${left}px`, top: `${top}px` } as React.CSSProperties };
}
