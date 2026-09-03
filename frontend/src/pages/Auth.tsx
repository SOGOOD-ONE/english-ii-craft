import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/api';
import { useAuthStore } from '@/store/auth';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const setAuth = useAuthStore(s => s.setAuth);

  // 登录表单
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  // 注册表单
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', password2: '' });

  const loginMut = useMutation({
    mutationFn: () => api.auth.login(loginForm),
    onSuccess: (data) => {
      setAuth(data);
      setMsg({ type: 'ok', text: '✅ 登录成功，正在加载工作台...' });
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail || e?.response?.data?.non_field_errors?.[0] || '登录失败，请检查账号密码';
      setMsg({ type: 'err', text: detail });
    },
  });

  const regMut = useMutation({
    mutationFn: () => api.auth.register({ username: regForm.username, email: regForm.email, password: regForm.password }),
    onSuccess: (data) => {
      setAuth(data);
      setMsg({ type: 'ok', text: '✅ 备考档案建立完毕，已初始化真题语料词库！' });
    },
    onError: (e: any) => {
      const err = e?.response?.data;
      const detail = err?.detail || err?.username?.[0] || err?.email?.[0] || err?.password?.[0] || '注册失败';
      setMsg({ type: 'err', text: detail });
    },
  });

  function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      setMsg({ type: 'err', text: '请填写账号和密码' });
      return;
    }
    loginMut.mutate();
  }

  function onRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regForm.password !== regForm.password2) {
      setMsg({ type: 'err', text: '两次密码不一致' });
      return;
    }
    if (regForm.password.length < 6) {
      setMsg({ type: 'err', text: '密码至少6位' });
      return;
    }
    regMut.mutate();
  }

  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded p-5 shadow-sm">
        {/* Tab 切换 */}
        <div className="flex border-b border-zinc-100 pb-2 mb-4 justify-between items-end">
          <div className="flex space-x-4">
            <button
              onClick={() => { setMode('login'); setMsg(null); }}
              className={`text-xs pb-1 ${mode === 'login' ? 'font-bold border-b-2 border-zinc-900 text-zinc-900' : 'font-medium text-zinc-400 hover:text-zinc-700'}`}
            >
              用户登录
            </button>
            <button
              onClick={() => { setMode('register'); setMsg(null); }}
              className={`text-xs pb-1 ${mode === 'register' ? 'font-bold border-b-2 border-zinc-900 text-zinc-900' : 'font-medium text-zinc-400 hover:text-zinc-700'}`}
            >
              建立备考档案
            </button>
          </div>
          <span className="font-mono text-[10px] text-zinc-400">
            AUTH_MODE: {mode === 'login' ? 'SIGN_IN' : 'SIGN_UP'}
          </span>
        </div>

        {/* 登录表单 */}
        {mode === 'login' && (
          <form onSubmit={onLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 mb-1">学号 / 邮箱 / 研招网绑定邮箱</label>
              <input
                type="text" required placeholder="name@domain.com"
                value={loginForm.username}
                onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 font-mono text-xs placeholder:text-zinc-300"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-mono text-zinc-600">通行密码</label>
                <span className="text-[10px] text-zinc-400 hover:text-zinc-900 cursor-pointer">找回密码?</span>
              </div>
              <input
                type="password" required placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 font-mono text-xs placeholder:text-zinc-300"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-zinc-900 border-zinc-300 rounded" />
                <span className="text-[11px] text-zinc-500">保持本地 FSRS 学习缓存</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={loginMut.isPending}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2 rounded font-medium text-xs mt-2 transition-colors disabled:opacity-60"
            >
              {loginMut.isPending ? '登录中...' : '进入攻坚工作台 →'}
            </button>
          </form>
        )}

        {/* 注册表单 */}
        {mode === 'register' && (
          <form onSubmit={onRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 mb-1">用户名</label>
              <input
                type="text" required placeholder="yourname"
                value={regForm.username}
                onChange={e => setRegForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 font-mono text-xs placeholder:text-zinc-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 mb-1">邮箱地址</label>
              <input
                type="email" required placeholder="yourname@domain.com"
                value={regForm.email}
                onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 font-mono text-xs placeholder:text-zinc-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 mb-1">设置密码</label>
              <input
                type="password" required placeholder="至少包含 6 位字符"
                value={regForm.password}
                onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 font-mono text-xs placeholder:text-zinc-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-zinc-600 mb-1">确认密码</label>
              <input
                type="password" required placeholder="再次输入密码"
                value={regForm.password2}
                onChange={e => setRegForm(f => ({ ...f, password2: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 font-mono text-xs placeholder:text-zinc-300"
              />
            </div>
            {/* 考研画像 */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-zinc-200">
              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">目标年份</label>
                <select className="w-full px-2 py-1.5 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 text-xs bg-white text-zinc-800">
                  <option>2025 考研</option>
                  <option>2026 考研</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-600 mb-1">目标分数</label>
                <select className="w-full px-2 py-1.5 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 text-xs bg-white text-zinc-800">
                  <option>70+ (国家线/稳妥)</option>
                  <option selected>80+ (高分攻坚)</option>
                  <option>85+ (卓越冲刺)</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={regMut.isPending}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2 rounded font-medium text-xs mt-2 transition-colors disabled:opacity-60"
            >
              {regMut.isPending ? '注册中...' : '创建档案并加载真题语料'}
            </button>
            <div className="text-[10px] text-zinc-400 text-center leading-tight">
              注册后将自动按《英语二考纲》配置间隔复习权重与大作文数据模板
            </div>
          </form>
        )}

        {/* 消息提示 */}
        {msg && (
          <div className={`mt-3 p-2 rounded text-xs ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}