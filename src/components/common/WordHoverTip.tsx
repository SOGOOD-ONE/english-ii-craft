'use client';

// ============================================================
// 单词 Hover 释义提示框(全局单例)
// ============================================================
// 思路:鼠标悬停于英文文本上时,在文本节点内部用 <span data-w> 包裹当前 hover 的英文单词
// (避免每次都整段切词,只按需切当前 mouseover 的文本节点),然后 debounce 调 glm-4-flash
// 拿释义,读 Dexie 缓存命中直接显示。
//
// 技术点:
//   - TreeWalker 找 text node,避免破坏 react 组件渲染
//   - mouseover 做切词;mouseleave 做延迟隐藏
//   - 用 Position: fixed + getBoundingClientRect 贴齐单词下方,自动翻页
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Loader2, AlertTriangle, Plus } from 'lucide-react';
import { lookupWord, normalizeWord } from '@/lib/ai/zhipu';
import type { WordDefinition } from '@/types';
import { addCard } from '@/lib/db';

interface TipState {
  visible: boolean;
  x: number;
  y: number;
  word: string;
  context?: string;
  loading: boolean;
  def?: WordDefinition;
  err?: string;
  saving?: boolean;
  saved?: boolean;
}

const INIT: TipState = { visible: false, x: 0, y: 0, word: '', loading: false };

// 跳过不可切词的元素(input/textarea/button/标签/代码/已切过的 word-span 本身等)
const SKIP_TAGS = new Set([
  'INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'STYLE', 'SCRIPT',
  'CODE', 'PRE', 'OPTION', 'NOSCRIPT', 'TITLE', 'META',
]);
const SKIP_ATTR = 'data-no-wordtip';
const SPAN_ATTR = 'data-w';

// 英文单词 token 正则(允许 a-z A-Z、单词中间的 - ' ,含 Unicode 拉丁扩展简单支持)
const WORD_RE = /[A-Za-z][A-Za-z'\-]*/g;

function isInsideSkip(root: HTMLElement): boolean {
  let el: HTMLElement | null = root;
  while (el) {
    if (el.nodeType === 1) {
      const tag = el.tagName;
      if (SKIP_TAGS.has(tag)) return true;
      if (el.getAttribute && el.getAttribute(SKIP_ATTR) !== null) return true;
      // 已经在 tip 内部
      if ((el as HTMLElement).getAttribute &&
          (el as HTMLElement).getAttribute('data-wordtip-root') !== null) return true;
    }
    el = el.parentElement;
  }
  return false;
}

/** 在 textNode 中把 targetOffsetStart~end 用 <span data-w> 包起来,返回 span,或 null */
function wrapWordInText(node: Text, start: number, end: number): HTMLElement | null {
  if (start >= end) return null;
  if (start === 0 && end === node.data.length) return null;
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
  } catch {
    return null;
  }
}

/** 找当前 textnode 内,鼠标命中的 token span(或者已切过的 SPAN_ATTR span) 以及单词字符串 + 上下文句子 */
function resolveTarget(target: EventTarget | null): { el: HTMLElement; word: string; context?: string } | null {
  if (!target || !(target instanceof Node)) return null;

  // Case 1:已经是切好的 span
  if (target.nodeType === 1 && (target as HTMLElement).getAttribute(SPAN_ATTR) === '1') {
    const el = target as HTMLElement;
    return { el, word: el.textContent || '', context: getContextSentence(el) };
  }

  // Case 2:在文本节点上 → 现场切
  if (target.nodeType === 3) {
    const textNode = target as Text;
    const parentEl = textNode.parentElement;
    if (!parentEl) return null;
    if (isInsideSkip(parentEl)) return null;
    const text = textNode.data;
    if (!text || !/[A-Za-z]/.test(text)) return null;

    // 借助 CSS 计算光标命中的 offset
    // 注:用最简单办法:找到 caret position 可以用 window.getSelection(),但 mouseover 一般没 selection;
    // 退而求其次:用 caretRangeFromPoint 拿字符偏移
    const sel = window.getSelection();
    if (!sel) return null;
    const hostEl = parentEl;
    if (!hostEl.isConnected) return null;

    // mouseover 事件没有坐标,需要借助缓存的最后一次 mousemove 坐标(外部维护)
    const pt = LAST_MOVE.current;
    if (!pt) return null;
    let range: Range | null = null;
    if (typeof (document as any).caretRangeFromPoint === 'function') {
      range = (document as any).caretRangeFromPoint(pt.x, pt.y) as Range | null;
    } else if (typeof (document as any).caretPositionFromPoint === 'function') {
      const cp = (document as any).caretPositionFromPoint(pt.x, pt.y) as
        | { offsetNode: Node; offset: number }
        | null;
      if (cp) {
        range = document.createRange();
        try {
          range.setStart(cp.offsetNode, cp.offset);
          range.setEnd(cp.offsetNode, cp.offset);
        } catch {
          range = null;
        }
      }
    }
    if (!range) return null;
    let offset = -1;
    try {
      if (range.startContainer === textNode) {
        offset = range.startOffset;
      } else {
        // 可能不同节点,用遍历比较(因为事件 target 就是 textNode,一般是相等的)
        offset = Math.min(textNode.data.length, Math.max(0, textNode.data.length >> 1));
      }
    } catch {
      return null;
    }

    // 在整个 text 里找包含 offset 的 token
    let m: RegExpExecArray | null;
    const re = new RegExp(WORD_RE.source, 'g');
    while ((m = re.exec(text)) !== null) {
      const s = m.index;
      const e = s + m[0].length;
      if (offset >= s && offset <= e) {
        const fresh = wrapWordInText(textNode, s, e);
        if (fresh) {
          return { el: fresh, word: fresh.textContent || '', context: getContextSentence(fresh) };
        }
        return null;
      }
    }
    return null;
  }
  return null;
}

/** 取当前单词所在的短句(最多 200 字符),给 AI 多义词消歧用 */
function getContextSentence(el: HTMLElement): string | undefined {
  // 优先取最近 1 段祖先块的 text
  const block =
    el.closest('p, li, td, th, div, section, article, blockquote, pre, h1, h2, h3, h4, h5, h6') ||
    el.parentElement;
  if (!block) return undefined;
  const raw = block.textContent || '';
  // 找到单词在其中的一个窗口
  const w = normalizeWord(el.textContent || '');
  const idx = raw.toLowerCase().indexOf(w);
  if (idx < 0) return raw.slice(0, 200);
  const start = Math.max(0, idx - 80);
  const end = Math.min(raw.length, idx + w.length + 120);
  let s = raw.slice(start, end);
  // 取最后一个句末标点之前到第一个句末标点之后的子句,取 150 字
  s = s.replace(/\s+/g, ' ').trim();
  return s.slice(0, 200);
}

const LAST_MOVE = { current: { x: 0, y: 0 } as { x: number; y: number } | null };

export default function WordHoverTip() {
  const [state, setState] = useState<TipState>(INIT);
  const stateRef = useRef(state);
  stateRef.current = state;
  const enterTimer = useRef<number | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const currentWordRef = useRef<string>('');
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem('eii_wordtip_disabled');
    if (s === '1') setEnabled(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      LAST_MOVE.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e: MouseEvent) => {
      // 忽略 tip 本身
      const tgt = e.target as HTMLElement | null;
      if (!tgt) return;
      if (tgt.closest && tgt.closest('[data-wordtip-root]')) return;

      const resolved = resolveTarget(e.target);
      if (!resolved) return;

      const wordKey = normalizeWord(resolved.word);
      if (!wordKey || wordKey.length < 2) return;

      const rect = resolved.el.getBoundingClientRect();
      const show = (patch: Partial<TipState>) => {
        setState({
          visible: true,
          x: rect.left + rect.width / 2,
          y: rect.bottom + 6,
          word: resolved.word,
          context: resolved.context,
          loading: false,
          ...patch,
        });
      };

      if (enterTimer.current) window.clearTimeout(enterTimer.current);
      if (leaveTimer.current) {
        window.clearTimeout(leaveTimer.current);
        leaveTimer.current = null;
      }

      // 如果就是当前已经显示的词,不重复请求
      if (currentWordRef.current === wordKey && stateRef.current.def) {
        show({ def: stateRef.current.def });
        return;
      }

      enterTimer.current = window.setTimeout(() => {
        currentWordRef.current = wordKey;
        show({ loading: true, def: undefined, err: undefined });
        // abort 之前未完成的请求
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        lookupWord(resolved.word, resolved.context)
          .then((def) => {
            if (ctrl.signal.aborted) return;
            if (currentWordRef.current !== wordKey) return;
            show({ loading: false, def, err: undefined });
          })
          .catch((err) => {
            if (ctrl.signal.aborted) return;
            if (currentWordRef.current !== wordKey) return;
            show({
              loading: false,
              err: err instanceof Error ? err.message : '查询失败',
            });
          });
      }, 260);
    };

    const onOut = (e: MouseEvent) => {
      // 移出目标或 tip 区域就启动延迟隐藏
      const to = (e as MouseEvent & { relatedTarget?: Node | null }).relatedTarget as Node | null;
      const tip = rootRef.current;
      if (tip && to && tip.contains(to)) return;
      if (enterTimer.current) {
        window.clearTimeout(enterTimer.current);
        enterTimer.current = null;
      }
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => {
        setState((s) => ({ ...s, visible: false }));
        currentWordRef.current = '';
      }, 220);
    };

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    // tip 上悬停时保持显示
    const tipEnter = () => {
      if (leaveTimer.current) {
        window.clearTimeout(leaveTimer.current);
        leaveTimer.current = null;
      }
    };
    const tipLeave = () => {
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => {
        setState((s) => ({ ...s, visible: false }));
        currentWordRef.current = '';
      }, 150);
    };
    const el = rootRef.current;
    el?.addEventListener('mouseenter', tipEnter);
    el?.addEventListener('mouseleave', tipLeave);

    return () => {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
      el?.removeEventListener('mouseenter', tipEnter);
      el?.removeEventListener('mouseleave', tipLeave);
      if (enterTimer.current) window.clearTimeout(enterTimer.current);
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [enabled]);

  // 位置调整(出界反向显示)
  const pos = useAutoFlip(state.x, state.y, state.visible);

  const onSaveWord = async () => {
    if (!state.def && !state.word) return;
    setState((s) => ({ ...s, saving: true, saved: false }));
    try {
      const d = state.def || (await lookupWord(state.word, state.context));
      const firstSense = d.senses[0] || '';
      // "n. 可持续性 / environmental ~ ..."  → 拆分 pos + def
      const posMatch = firstSense.match(/^([a-z]+\.)\s*(.*)$/i);
      const pos = posMatch ? posMatch[1].replace(/\.$/, '') : '';
      const defText = posMatch ? posMatch[2].split(' / ')[0].trim() : firstSense;
      await addCard({
        word: d.word || normalizeWord(state.word),
        phonetic: d.phonetic,
        pos,
        definition: defText || firstSense,
        contextSentence: state.context || '',
        source: 'hover:wordtip',
      });
      setState((s) => ({ ...s, saving: false, saved: true }));
      setTimeout(() => setState((s) => ({ ...s, saved: false })), 1500);
    } catch (e) {
      setState((s) => ({ ...s, saving: false, err: e instanceof Error ? e.message : '加生词失败' }));
    }
  };

  return (
    <>
      {/* 右下角开关:随时关闭 hover 查词(防打扰阅读),存 localStorage */}
      <button
        type="button"
        title={enabled ? '关闭鼠标悬停查词' : '开启鼠标悬停查词'}
        onClick={() => {
          const next = !enabled;
          setEnabled(next);
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
                <div className="text-zinc-400 font-mono text-[10px] mt-0.5">
                  {state.def.phonetic}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onSaveWord}
              disabled={state.saving || state.saved}
              title="加入生词本"
              className="shrink-0 border border-zinc-600 rounded px-2 py-0.5 hover:bg-zinc-800 disabled:opacity-60 text-[10px] flex items-center gap-1"
            >
              {state.saved ? (
                <>✓ 已加入</>
              ) : state.saving ? (
                <>
                  <Loader2 size={10} className="animate-spin" />
                  保存中
                </>
              ) : (
                <>
                  <Plus size={10} />
                  生词本
                </>
              )}
            </button>
          </div>

          {state.loading && (
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Loader2 size={11} className="animate-spin" />
              glm-4-flash 查询中...
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
                  <li key={i} className="flex gap-1.5">
                    <span className="text-zinc-500 shrink-0 w-4">{i + 1}.</span>
                    <span className="break-words text-zinc-100">{s}</span>
                  </li>
                ))}
              </ol>
              {state.def.collocations && state.def.collocations.length > 0 && (
                <div>
                  <div className="text-zinc-400 text-[10px] mb-0.5">常见搭配</div>
                  <div className="flex flex-wrap gap-1">
                    {state.def.collocations.map((c, i) => (
                      <span
                        key={i}
                        className="rounded border border-zinc-700 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-200"
                      >
                        {c}
                      </span>
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

/** 根据视口边界,自动 flip tooltip 到单词上方(放不下时),返回 style */
function useAutoFlip(x: number, y: number, visible: boolean) {
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (!visible) return;
    // 估算 tooltip 尺寸
    const W = 288;
    const H = 140; // 最高不会超,只是粗估 flip
    const needFlip = typeof window !== 'undefined' && y + H > window.innerHeight - 12;
    setFlip(needFlip);
  }, [x, y, visible]);

  const left =
    typeof window !== 'undefined'
      ? Math.max(12, Math.min(window.innerWidth - 12 - 288, x - 144))
      : x - 144;
  const top = flip ? y - 8 - 150 : y;
  return {
    flip,
    style: {
      left: `${left}px`,
      top: `${top}px`,
    } as React.CSSProperties,
  };
}
