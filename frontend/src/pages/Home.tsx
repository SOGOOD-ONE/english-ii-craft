import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const modules = [
  { to: '/writing', title: '图表写作', sub: 'AI 4 维度批改 + 高分润色', pts: '15', icon: '📊' },
  { to: '/translation', title: '段落翻译', sub: '逐句 Diff + 参考译文对照', pts: '15', icon: '✍️' },
  { to: '/reading', title: '阅读理解(新增)', sub: 'Text 1-4 + 题干标签体系(细节/推断/主旨)', pts: '40', icon: '📖' },
  { to: '/vocab', title: '生词本 FSRS', sub: '间隔重复 + Good/Easy 2 次掌握', pts: '∞', icon: '🧠' },
];

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();
  const totalSum = (15 + 15 + 40).toString();
  return (
    <div className="space-y-10">
      <section className="flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            考研英语二 攻坚工坊
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl">
            主观题 + 阅读 + 生词记忆全流程工具:智谱 AI 大作文批改 · 段落翻译精修 Diff · 阅读 4 篇年份切换 · FSRS 间隔重复生词本。
            <br />前后端严格分离(Django 5.1 + DRF · React/Vite SPA),Key 永远不暴露前端。
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <button onClick={() => nav('/login')} className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100">登录</button>
              <button onClick={() => nav('/register')} className="px-4 py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700">注册</button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Hi, <b>{user.username}</b></span>
              <button onClick={() => { logout(); nav('/'); }} className="px-3 py-1.5 rounded-md text-sm border border-slate-300 hover:bg-slate-100">退出</button>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {modules.map(m => (
          <Link key={m.to} to={m.to} className="group block p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md hover:border-violet-400 transition">
            <div className="flex items-start justify-between">
              <div className="text-3xl">{m.icon}</div>
              <div className="px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold">{m.pts} 分</div>
            </div>
            <div className="mt-4 font-semibold text-lg group-hover:text-violet-700 dark:group-hover:text-violet-300">{m.title}</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{m.sub}</div>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700">
          <h2 className="font-semibold text-lg mb-2">满分总计(客观+主观重点)</h2>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-violet-600">{totalSum}</div>
            <div className="text-slate-500 text-sm">满分 100 内的重点题型(70%),阅读 + 写作 + 翻译是提分三驾马车。</div>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700">
          <h2 className="font-semibold text-lg mb-2">技术 & 安全</h2>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-5">
            <li>AI Key 后端集中代理(glm-4-flash),支持用户自定义 Key 覆盖全局</li>
            <li>生词本 FSRS v5: 后端调度,前后端规则一致</li>
            <li>JWT 鉴权 + refresh token 自动续期,翻译/批改历史跨设备可查</li>
            <li>Swagger UI 在线调试: <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 rounded">/api/schema/docs</code></li>
          </ul>
        </div>
      </section>
    </div>
  );
}
