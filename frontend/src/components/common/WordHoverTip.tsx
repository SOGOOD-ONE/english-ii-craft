// ============================================================
// 单词 Hover 释义提示框(全局单例)
//  - 预分词: 挂载时把所有英文单词包裹成 span，一次 DOM 操作
//  - 悬停: e.target 直接是 span，零延迟，无 I-beam 光标
//  - 单击: 固定弹窗，点 × 或点击外部关闭
//  - 查词 → POST /api/v1/vocab/words/lookup
//  - 发音 → Web Speech API + 有道回退
//  - 加生词 → POST /api/v1/vocab/cards (未登录弹窗提示)
// ============================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/api';

interface WordSense { pos?: string; definition?: string; [k: string]: any; }
interface CachedDef {
  id?: number; word: string; lemma: string; phonetic: string;
  senses: WordSense[]; collocations: string[]; from_cache?: boolean;
}

interface TipState {
  visible: boolean; pinned: boolean;
  x: number; y: number; word: string; context?: string;
  loading: boolean; def?: CachedDef; err?: string; saving?: boolean; saved?: boolean;
}
const INIT: TipState = { visible: false, pinned: false, x: 0, y: 0, word: '', loading: false };

const SKIP_TAGS = new Set(['INPUT','TEXTAREA','SELECT','BUTTON','STYLE','SCRIPT','CODE','PRE','OPTION','NOSCRIPT','TITLE','META','SVG','A']);
const SKIP_ATTR = 'data-no-wordtip';
const CLS = 'wt';

function normalizeWord(w: string): string {
  return (w || '').trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
}

function isSkipped(el: HTMLElement): boolean {
  let cur: HTMLElement | null = el;
  while (cur) {
    if (SKIP_TAGS.has(cur.tagName)) return true;
    if (cur.getAttribute?.(SKIP_ATTR) != null) return true;
    if (cur.getAttribute?.('data-wordtip-root') != null) return true;
    cur = cur.parentElement;
  }
  return false;
}

/** 将 root 下的所有文本节点的英文单词包裹成 span */
function tokenize(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const p = n.parentElement;
      if (!p || isSkipped(p)) return NodeFilter.FILTER_REJECT;
      if (!n.textContent || !/[A-Za-z]{2,}/.test(n.textContent)) return NodeFilter.FILTER_REJECT;
      if (p.closest && p.closest('.' + CLS)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) tokenizeNode(node);
}

function tokenizeNode(node: Text) {
  const text = node.textContent || '';
  const re = /[A-Za-z][A-Za-z']*/g;
  let m: RegExpExecArray | null;
  let last = 0;
  const frag = document.createDocumentFragment();
  let changed = false;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length < 2) continue;
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const span = document.createElement('span');
    span.className = CLS;
    span.textContent = m[0];
    frag.appendChild(span);
    last = m.index + m[0].length;
    changed = true;
  }
  if (!changed) return;
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  node.parentNode?.replaceChild(frag, node);
}

/** 获取上下文句子 */
function getContext(el: HTMLElement): string | undefined {
  const block = el.closest('p,li,td,th,div,section,article,blockquote,pre') || el.parentElement;
  if (!block) return undefined;
  const raw = block.textContent || '';
  const w = normalizeWord(el.textContent || '');
  const idx = raw.toLowerCase().indexOf(w);
  if (idx < 0) return raw.slice(0, 200);
  const s = Math.max(0, idx - 80);
  const e = Math.min(raw.length, idx + w.length + 120);
  return raw.slice(s, e).replace(/\s+/g, ' ').trim().slice(0, 200);
}

/** 发音 */
function speakWord(word: string) {
  if (typeof window === 'undefined') return;
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US'; u.rate = 0.9; u.pitch = 1; u.volume = 1;
    window.speechSynthesis.speak(u);
    return;
  }
  new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=0`).play().catch(() => {});
}

export default function WordHoverTip() {
  const [state, setState] = useState<TipState>(INIT);
  const stateRef = useRef(state); stateRef.current = state;
  const enterTimer = useRef<number | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const abortRef = useRef<number | null>(null);
  const currentWordRef = useRef<string>('');
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(true);
  const moRef = useRef<MutationObserver | null>(null);

  // 初始化: 读取 localStorage
  useEffect(() => {
    if (localStorage.getItem('eii_wordtip_disabled') === '1') setEnabled(false);
  }, []);

  // 分词: enabled 时监听 DOM 变化
  useEffect(() => {
    if (!enabled) return;
    const doTokenize = () => {
      try { tokenize(document.body); } catch {}
    };
    doTokenize();
    moRef.current?.disconnect();
    const mo = new MutationObserver(() => doTokenize());
    mo.observe(document.body, { childList: true, subtree: true });
    moRef.current = mo;
    return () => { mo.disconnect(); };
  }, [enabled]);

  // 查词
  const fetchWord = useCallback(async (word: string, context: string | undefined, wordKey: string, cx: number, cy: number) => {
    currentWordRef.current = wordKey;
    const show = (patch: Partial<TipState>) => setState(s => ({ ...s, visible: true, x: cx, y: cy, word, context, loading: false, ...patch }));
    show({ loading: true });
    if (abortRef.current) window.clearTimeout(abortRef.current);
    const id = Date.now(); abortRef.current = id;
    try {
      const r = await api.vocab.lookupWord(word, context || '');
      if (abortRef.current !== id || currentWordRef.current !== wordKey) return;
      const def: CachedDef = {
        id: r.id, word: r.lemma, lemma: r.lemma, phonetic: r.phonetic || '',
        senses: (r.senses || []).map((s: any) => ({ pos: s.pos, definition: s.definition ?? (typeof s === 'string' ? s : JSON.stringify(s)) })),
        collocations: r.collocations || [], from_cache: !!r.from_cache,
      };
      show({ loading: false, def });
    } catch (err: any) {
      if (abortRef.current !== id || currentWordRef.current !== wordKey) return;
      show({ loading: false, err: err?.response?.data?.detail || err?.message || '查词失败' });
    }
  }, []);

  // 悬停: mouseover 检测 .wt 元素
  useEffect(() => {
    if (!enabled) return;
    const onOver = (e: MouseEvent) => {
      const span = (e.target as HTMLElement).closest?.('.' + CLS) as HTMLElement | null;
      if (!span) return;
      if (span.closest?.('[data-wordtip-root]')) return;
      if (stateRef.current.pinned) return;
      const word = span.textContent || '';
      const wordKey = normalizeWord(word);
      if (!wordKey || wordKey.length < 2) return;
      if (enterTimer.current) window.clearTimeout(enterTimer.current);
      if (leaveTimer.current) { window.clearTimeout(leaveTimer.current); leaveTimer.current = null; }
      const rect = span.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.bottom + 6;
      if (currentWordRef.current === wordKey && stateRef.current.def) {
        setState(s => ({ ...s, visible: true, x: cx, y: cy }));
        return;
      }
      enterTimer.current = window.setTimeout(() => {
        fetchWord(word, getContext(span), wordKey, cx, cy);
      }, 200);
    };
    const onOut = (e: MouseEvent) => {
      const to = (e as MouseEvent & { relatedTarget?: Node | null }).relatedTarget as Node | null;
      if (rootRef.current && to && rootRef.current.contains(to)) return;
      if (stateRef.current.pinned) return;
      if (enterTimer.current) { window.clearTimeout(enterTimer.current); enterTimer.current = null; }
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => { setState(s => ({ ...s, visible: false })); currentWordRef.current = ''; }, 180);
    };
    const onEnter = () => { if (leaveTimer.current) { window.clearTimeout(leaveTimer.current); leaveTimer.current = null; } };
    const onLeave = () => {
      if (stateRef.current.pinned) return;
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => { setState(s => ({ ...s, visible: false })); currentWordRef.current = ''; }, 120);
    };
    document.addEventListener('mouseover', onOver, false);
    document.addEventListener('mouseout', onOut, false);
    rootRef.current?.addEventListener('mouseenter', onEnter);
    rootRef.current?.addEventListener('mouseleave', onLeave);
    return () => {
      document.removeEventListener('mouseover', onOver, false);
      document.removeEventListener('mouseout', onOut, false);
      rootRef.current?.removeEventListener('mouseenter', onEnter);
      rootRef.current?.removeEventListener('mouseleave', onLeave);
      if (enterTimer.current) window.clearTimeout(enterTimer.current);
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    };
  }, [enabled, fetchWord]);

  // 单击: 固定
  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      if (stateRef.current.pinned) { setState(INIT); currentWordRef.current = ''; return; }
      const span = (e.target as HTMLElement).closest?.('.' + CLS) as HTMLElement | null;
      if (!span) return;
      const word = span.textContent || '';
      const wordKey = normalizeWord(word);
      if (!wordKey || wordKey.length < 2) return;
      e.preventDefault();
      const rect = span.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.bottom + 6;
      if (currentWordRef.current === wordKey && stateRef.current.def) {
        setState(s => ({ ...s, pinned: true, x: cx, y: cy }));
        return;
      }
      setState(s => ({ ...s, pinned: true }));
      fetchWord(word, getContext(span), wordKey, cx, cy);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [enabled, fetchWord]);

  const pos = useAutoFlip(state.x, state.y, state.visible);

  const onSave = async () => {
    if (!state.word) return;
    setState(s => ({ ...s, saving: true, saved: false }));
    try {
      const d = state.def || (await api.vocab.lookupWord(state.word, state.context || ''));
      const p: any = {
        lemma: d.lemma || normalizeWord(state.word), phonetic: d.phonetic,
        senses: (d.senses || []).map((s: any) => typeof s === 'string' ? { definition: s } : s),
        collocations: d.collocations || [], context_sentence: state.context || '', source_path: '',
      };
      if (d.id) p.word_id = d.id;
      await api.vocab.cardsCreate(p);
      setState(s => ({ ...s, saving: false, saved: true }));
      setTimeout(() => setState(s => ({ ...s, saved: false })), 1500);
    } catch (e: any) {
      setState(s => ({ ...s, saving: false, err: e?.response?.data?.detail || e?.message || '加词失败' }));
    }
  };

  const fmt = (s: WordSense): string => {
    const p = [];
    if (s.pos) p.push(s.pos.endsWith('.') ? s.pos : s.pos + '.');
    if (s.definition) p.push(s.definition);
    else p.push(...Object.entries(s).filter(([k]) => !['pos', 'definition'].includes(k)).map(([_, v]) => String(v)));
    return p.join(' ');
  };

  const close = () => { setState(INIT); currentWordRef.current = ''; };

  return (
    <>
      {/* 开关 */}
      <button
        type="button"
        title={enabled ? '关闭悬停查词' : '开启悬停查词'}
        onClick={() => {
          const n = !enabled; setEnabled(n);
          localStorage.setItem('eii_wordtip_disabled', n ? '0' : '1');
          if (!n) close();
        }}
        className="fixed right-3 bottom-3 z-40 bg-white/95 border border-zinc-200 shadow-md hover:shadow-lg rounded-full w-8 h-8 flex items-center justify-center text-zinc-700 hover:text-zinc-900"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={enabled ? '' : 'opacity-40'}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </button>

      {state.visible && (
        <div
          ref={rootRef}
          data-wordtip-root="1"
          style={pos.style}
          className={`fixed z-50 w-64 max-w-[90vw] bg-zinc-900 text-zinc-100 rounded-md shadow-xl border border-zinc-700 p-2 text-[11px] leading-relaxed ${pos.flip ? 'origin-bottom-center' : 'origin-top-center'} ${state.pinned ? 'ring-2 ring-zinc-500' : ''}`}
        >
          <div className={`absolute ${pos.flip ? 'top-full' : 'bottom-full'} left-1/2 -translate-x-1/2 w-0 h-0 border-8 border-transparent ${pos.flip ? 'border-t-zinc-700' : 'border-b-zinc-700'}`} />
          <div className={`absolute ${pos.flip ? 'top-full' : 'bottom-full'} left-1/2 -translate-x-1/2 w-0 h-0 border-6 border-transparent ${pos.flip ? 'border-t-zinc-900' : 'border-b-zinc-900'} ${pos.flip ? 'mt-[-1px]' : 'mb-[-1px]'}`} />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-sm text-white">{state.word}</span>
              {state.def?.phonetic && <span className="text-zinc-400 font-mono text-[10px] italic">{state.def.phonetic}</span>}
              <button type="button" onClick={() => speakWord(state.word)} title="发音" className="shrink-0 p-0.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={onSave} disabled={state.saving || state.saved} className="border border-zinc-600 rounded px-2 py-0.5 hover:bg-zinc-800 disabled:opacity-60 text-[10px] whitespace-nowrap">
                {state.saved ? '✓ 已加入' : state.saving ? '...' : '+ 词库'}
              </button>
              {state.pinned && (
                <button type="button" onClick={close} className="p-0.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white" title="关闭">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {state.loading && <div className="text-zinc-400 text-[10px] mt-1.5">查词中...</div>}
          {state.err && !state.loading && <div className="text-amber-300 text-[10px] mt-1.5">{state.err}</div>}
          {state.def && !state.loading && state.def.senses.length > 0 && (
            <div className="mt-1.5 border-t border-zinc-700 pt-1">
              {state.def.senses.slice(0, 2).map((s, i) => (
                <div key={i} className="text-zinc-100 text-[11px]"><span className="text-zinc-400">{i + 1}.</span> {fmt(s)}</div>
              ))}
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
    if (typeof window !== 'undefined' && y + 160 > window.innerHeight - 12) setFlip(true);
  }, [x, y, visible]);
  const left = typeof window !== 'undefined' ? Math.max(12, Math.min(window.innerWidth - 12 - 256, x - 128)) : x - 128;
  const top = flip ? y - 8 - 180 : y;
  return { flip, style: { left: `${left}px`, top: `${top}px` } as React.CSSProperties };
}