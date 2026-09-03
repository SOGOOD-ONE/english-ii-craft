import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api, { type LoginPayload } from '@/api';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const [form, setForm] = useState<LoginPayload>({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from || '/';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const resp = await api.auth.login(form);
      setAuth({ access: resp.access, refresh: resp.refresh, user: resp.user, profile: resp.profile });
      nav(from, { replace: true });
    } catch (er: any) {
      setErr(er?.response?.data?.detail || er?.message || '登录失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700">
      <h1 className="text-2xl font-bold mb-1">登录</h1>
      <p className="text-sm text-slate-500 mb-5">还没有账号? <Link to="/register" className="text-violet-600 hover:underline">去注册</Link></p>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-sm block mb-1">用户名</label>
          <input autoFocus required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2" />
        </div>
        <div>
          <label className="text-sm block mb-1">密码</label>
          <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2" />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button disabled={busy} className="w-full py-2 rounded-md bg-violet-600 text-white disabled:opacity-60">
          {busy ? '登录中…' : '登录'}
        </button>
      </form>
    </div>
  );
}
