import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/common/Navbar';
import SelectionPopover from '@/components/common/SelectionPopover';
import WordHoverTip from '@/components/common/WordHoverTip';

export const metadata: Metadata = {
  title: 'English-II-Craft 考研英语二攻坚工坊',
  description: '专攻考研英语二主观题:图表写作智能阅卷、段落翻译 Diff 精修、FSRS 语境生词本。零后端,本地数据优先。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-zinc-100 text-zinc-900 font-sans text-xs antialiased selection:bg-zinc-900 selection:text-white">
        <Navbar />
        <SelectionPopover />
        <WordHoverTip />
        <main className="max-w-7xl mx-auto p-3">{children}</main>
      </body>
    </html>
  );
}
