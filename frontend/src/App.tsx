import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthPage from '@/pages/Auth';
import WritingPage from '@/pages/Writing';
import TranslationPage from '@/pages/Translation';
import ReadingPage from '@/pages/Reading';
import VocabPage from '@/pages/Vocab';
import SettingsPage from '@/pages/Settings';
import WordHoverTip from '@/components/common/WordHoverTip';
import '@/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

type TabId = 'writing' | 'translation' | 'reading' | 'vocab' | 'auth' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'writing', label: '图表写作' },
  { id: 'translation', label: '段落翻译' },
  { id: 'reading', label: '阅读理解' },
  { id: 'vocab', label: 'FSRS复习' },
  { id: 'auth', label: '账号接入' },
  { id: 'settings', label: '系统设置' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('writing');

  useEffect(() => {
    document.title = 'English-II-Craft 考研英语二攻坚工坊';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans text-xs antialiased selection:bg-zinc-900 selection:text-white">
        {/* 紧凑导航 */}
        <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 h-10 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="font-bold tracking-tight text-sm">ENGLISH-II CRAFT</span>
            <nav className="flex space-x-1">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-2.5 py-1 rounded font-medium ${
                    tab === t.id
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="text-zinc-400 font-mono text-[11px]">
            划词捕获已激活
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-7xl mx-auto p-3">
          {tab === 'auth' && <AuthPage />}
          {tab === 'writing' && <WritingPage />}
          {tab === 'translation' && <TranslationPage />}
          {tab === 'reading' && <ReadingPage />}
          {tab === 'vocab' && <VocabPage />}
          {tab === 'settings' && <SettingsPage />}
        </main>

        {/* 全局单词悬停提示 */}
        <WordHoverTip />
      </div>
    </QueryClientProvider>
  );
}