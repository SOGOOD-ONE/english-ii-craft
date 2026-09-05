import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  BarChart3, 
  Languages, 
  BookOpen, 
  BrainCircuit, 
  Settings, 
  GraduationCap 
} from 'lucide-react';
import HomePage from '@/pages/Home';
import WritingPage from '@/pages/Writing';
import TranslationPage from '@/pages/Translation';
import ReadingPage from '@/pages/Reading';
import VocabPage from '@/pages/Vocab';
import SettingsPage from '@/pages/Settings';
import WordHoverTip from '@/components/common/WordHoverTip';
import { initDeviceId } from '@/store/device';
import '@/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

export type TabId = 'home' | 'writing' | 'translation' | 'reading' | 'vocab' | 'settings';

export default function App() {
  const [tab, setTab] = useState<TabId>(() => {
    return (localStorage.getItem('craft_current_tab') as TabId) || 'home';
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = '考研英语真题研习工坊';
    initDeviceId().then(() => setReady(true));
  }, []);

  const handleTabChange = (newTab: TabId) => {
    setTab(newTab);
    localStorage.setItem('craft_current_tab', newTab);
  };

  const tabs = [
    { id: 'home' as TabId, label: '主页', icon: Home },
    { id: 'writing' as TabId, label: '大作文写作', icon: BarChart3 },
    { id: 'translation' as TabId, label: '翻译精修', icon: Languages },
    { id: 'reading' as TabId, label: '阅读理解', icon: BookOpen },
    { id: 'vocab' as TabId, label: 'FSRS复习', icon: BrainCircuit },
    { id: 'settings' as TabId, label: '题库与设置', icon: Settings },
  ];

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center text-zinc-500 text-sm">
        初始化中...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans text-xs antialiased selection:bg-zinc-900 selection:text-white">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-zinc-200 h-11 px-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-6 w-full md:w-auto justify-between md:justify-start">
            {/* 品牌标识 / 主页快捷键 */}
            <button 
              onClick={() => handleTabChange('home')}
              className="flex items-center gap-2 hover:opacity-80 transition active:scale-95 cursor-pointer text-left"
              title="返回主页"
            >
              <div className="w-6.5 h-6.5 rounded bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-xs sm:text-sm text-zinc-900">
                  考研英语攻坚工坊
                </span>
              </div>
            </button>

            {/* 桌面/平板 顶部主导航菜单 */}
            <nav className="hidden md:flex space-x-1 overflow-x-auto py-1 relative">
              {tabs.map(t => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    className={`relative px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 whitespace-nowrap text-xs transition-colors duration-150 ${
                      isActive
                        ? 'text-white'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-zinc-900 rounded-md shadow-xs -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 移动端顶部状态指示器 */}
            <div className="flex md:hidden items-center gap-1.5 text-zinc-400 font-mono text-[10px]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>划词已激活</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>划词捕获已激活</span>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-2.5 sm:p-3 md:p-4 pb-20 md:pb-4 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {tab === 'home' && (
                <HomePage onSelectTab={handleTabChange} />
              )}
              {tab === 'writing' && <WritingPage />}
              {tab === 'translation' && <TranslationPage />}
              {tab === 'reading' && <ReadingPage />}
              {tab === 'vocab' && <VocabPage />}
              {tab === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* 移动端专属 底部导航栏 */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 shadow-lg px-1 py-1 flex justify-around items-center">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex-1 py-1 px-0.5 flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-lg transition-colors active:scale-95 ${
                  isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <div className={`p-1 rounded-md transition-all ${isActive ? 'bg-zinc-900 text-white shadow-xs' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] leading-tight scale-90 sm:scale-100">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <WordHoverTip />
      </div>
    </QueryClientProvider>
  );
}
