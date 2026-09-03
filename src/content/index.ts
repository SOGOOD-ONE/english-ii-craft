// ============================================================
// content/ 静态真题数据索引:按年份暴露
//
// 说明:Next 在 Webpack 编译期会把 require.context 静态解析,
// 所以此处用 require.context 注入翻译/写作两份 JSON 目录。
// 注:Node 的 require 和 Webpack 的 require.context 形态不同,
// 因此需要先断言再调用。Next 在客户端与 SSR 都支持该模式。
// ============================================================
import type { WritingData, TranslationData } from '@/types';

type ReqCtx = {
  keys: () => string[];
  (id: string): any;
};

function loadAll<T>(
  reqCtx: ReqCtx,
): Map<number, T> {
  const m = new Map<number, T>();
  for (const k of reqCtx.keys()) {
    const match = /(\d{4})\.json$/.exec(k);
    const y = match ? parseInt(match[1], 10) : 0;
    if (y) m.set(y, reqCtx(k) as T);
  }
  return m;
}

// require.context 是 Webpack 提供的编译期宏,通过 @ts-ignore 跳过 TS 类型检查
// @ts-ignore
const transCtx = require.context('../../content/translation', false, /\.json$/) as ReqCtx;
// @ts-ignore
const writeCtx = require.context('../../content/writing', false, /\.json$/) as ReqCtx;

const TRANS_MAP = loadAll<TranslationData>(transCtx);
const WRITE_MAP = loadAll<WritingData>(writeCtx);

function yearsOf<T>(m: Map<number, T>): number[] {
  return Array.from(m.keys()).sort((a, b) => b - a);
}

export const YEARS = {
  translation: yearsOf(TRANS_MAP),
  writing: yearsOf(WRITE_MAP),
};

export function getTranslation(year: number): TranslationData | undefined {
  return TRANS_MAP.get(year);
}

export function getWriting(year: number): WritingData | undefined {
  return WRITE_MAP.get(year);
}
