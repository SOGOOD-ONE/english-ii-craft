import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '@/pages/Home';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import WritingPage from '@/pages/Writing';
import TranslationPage from '@/pages/Translation';
import ReadingPage from '@/pages/Reading';
import VocabPage from '@/pages/Vocab';
import SettingsPage from '@/pages/Settings';
import ProtectedRoute from '@/router/ProtectedRoute';
import WordHoverTip from '@/components/common/WordHoverTip';
import '@/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

function Navbar() {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-md text-sm transition-colors ${
      isActive ? 'bg-violet-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:bg-slate-900/80 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
          <span className="inline-block w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-emerald-500 text-white grid place-items-center text-sm">E2</span>
          English II Craft
        </NavLink>
        <nav className="flex items-center gap-1">
          <NavLink to="/writing" className={linkCls}>图表写作</NavLink>
          <NavLink to="/translation" className={linkCls}>段落翻译</NavLink>
          <NavLink to="/reading" className={linkCls}>阅读理解</NavLink>
          <NavLink to="/vocab" className={linkCls}>生词本 FSRS</NavLink>
          <NavLink to="/settings" className={linkCls}>系统设置</NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-8">
            <Suspense fallback={<div className="text-center py-20 text-slate-500">加载中…</div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/writing" element={<WritingPage />} />
                <Route path="/translation" element={<TranslationPage />} />
                <Route path="/reading" element={<ReadingPage />} />
                <Route path="/vocab" element={<ProtectedRoute><VocabPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Suspense>
          </main>
          {/* hover 查词浮窗(全局挂载:在 React Router 内部,任意页面都生效) */}
          <WordHoverTip />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
