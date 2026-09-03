// ============================================================
// 划词定位与原句智能截取算法
// ============================================================
// 用户在任意模块选中文本中的英文单词,自动以被选单词为中心,
// 向前/向后检索句号(. ! ?),抓取该单词所在的完整真题原句。
// ============================================================

export interface CaptureResult {
  word: string;
  sentence: string;
  rect: { x: number; y: number };
}

const WORD_RE = /^[a-zA-Z][a-zA-Z-']*$/;
const SENTENCE_END = /[.!?。！？]/;

/** 判定选中文本是否为合法英文单词 */
export function isEnglishWord(text: string): boolean {
  return WORD_RE.test(text.trim());
}

/**
 * 从当前 window.getSelection() 提取单词与其所在完整原句。
 * 返回 null 表示无合法选词。
 */
export function captureFromSelection(
  sourceLabel?: string
): CaptureResult | null {
  if (typeof window === 'undefined') return null;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return null;
  const text = sel.toString().trim();
  if (!isEnglishWord(text)) return null;

  const anchor = sel.anchorNode;
  if (!anchor) return null;
  const nodeText = anchor.textContent || '';
  const offset = sel.anchorOffset;

  // 向前找句末
  let start = 0;
  for (let i = offset - 1; i >= 0; i--) {
    if (SENTENCE_END.test(nodeText[i])) {
      start = i + 1;
      break;
    }
  }
  // 向后找句末
  let end = nodeText.length;
  for (let i = offset; i < nodeText.length; i++) {
    if (SENTENCE_END.test(nodeText[i])) {
      end = i + 1;
      break;
    }
  }
  const sentence = nodeText.substring(start, end).trim();

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    word: text,
    sentence,
    rect: { x: rect.left, y: rect.top },
    // sourceLabel 由调用方通过 data-source 属性注入,见 SelectionPopover
  } as CaptureResult & { source?: string };
}

/** 读取划词所在最近祖先元素的 data-source 标签(出处) */
export function getSourceLabel(sel: Selection | null): string {
  if (!sel || !sel.anchorNode) return '未标注来源';
  let node: Node | null = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode as HTMLElement;
  while (node && node.nodeType === 1) {
    const el = node as HTMLElement;
    if (el.dataset?.source) return el.dataset.source;
    node = el.parentElement;
  }
  return '未标注来源';
}
