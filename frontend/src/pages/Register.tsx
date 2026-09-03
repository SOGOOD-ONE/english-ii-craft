import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { type RegisterPayload } from '@/api';
import { useAuthStore } from '@/store/auth';

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterPayload>({ username: '', email: '', password: '' });
  const [pwd2, setPwd2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== pwd2) { setErr('两次密码不一致'); return; }
    setErr('');
    setBusy(true);
    try {
      const resp = await api.auth.register(form);
      setAuth({ access: resp.access, refresh: resp.refresh, user: resp.user, profile: resp.profile });
      nav('/', { replace: true });
    } catch (er: any) {
      const d = er?.response?.data;
      setErr(d?.detail || (d ? Object.entries(d).map(([k, v]) => `${k}: ${(v as any[]).join(',')}`).join('; ') : er.message));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700">
      <h1 className="text-2xl font-bold mb-1">注册</h1>
      <p className="text-sm text-slate-500 mb-5">已有账号? <Link to="/login" className="text-violet-600 hover:underline">去登录</Link></p>
      <form onSubmit={submit} className="space-y-3">
        {[{ k: 'username', t: '用户名(3-150 位)' }, { k: 'email', t: '邮箱', type: 'email' }, { k: 'password', t: '密码(≥8 位)', type: 'password' }].map(x => (
          <div key={x.k}>
            <label className="text-sm block mb-1">{x.t}</label>
            <input required type={x.type || 'text'} value={(form as any)[x.k]}
              onChange={e => setForm(f => ({ ...f, [x.k]: e.target.value }))}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2" />
          </div>
        ))}
        <div>
          <label className="text-sm block mb-1">再次输入密码</label>
          <input required type="password" value={pwd2} onChange={e => setPwd2(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2" />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button disabled={busy} className="w-full py-2 rounded-md bg-violet-600 text-white disabled:opacity-60">{busy ? '注册中…' : '注册并登录'}</button>
      </form>
    </div>
  );
}
