import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';
import Navbar from '@/components/common/Navbar';

// WordHoverTip / SelectionPopover 都依赖浏览器 DOM 事件(mousemove / selectionchange)
// 且 TRAE 预览宿主会向页面元素注入 data-trae-ref / data-trae-theme 等属性。
// 用 ssr:false 让这两个组件只在客户端挂载,从根本消除 SSR vs 客户端 hydration 属性差异 warning。
const SelectionPopover = dynamic(
  () => import('@/components/common/SelectionPopover').then((m) => m.default),
  { ssr: false }
);
const WordHoverTip = dynamic(
  () => import('@/components/common/WordHoverTip').then((m) => m.default),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'English-II-Craft 考研英语二攻坚工坊',
  description: '专攻考研英语二主观题:图表写作智能阅卷、段落翻译 Diff 精修、FSRS 语境生词本。零后端,本地数据优先。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: TRAE 预览 / 浏览器插件可能向 <html>/<body> 注入
    // data-trae-theme / data-theme 等属性,导致 SSR vs 客户端 hydration 属性不一致 warning。
    // 官方文档推荐用 suppressHydrationWarning 压掉宿主/扩展带来的非破坏性属性差异。
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-zinc-100 text-zinc-900 font-sans text-xs antialiased selection:bg-zinc-900 selection:text-white">
        <Navbar />
        <SelectionPopover />
        <WordHoverTip />
        <main className="max-w-7xl mx-auto p-3">{children}</main>
      </body>
    </html>
  );
}
