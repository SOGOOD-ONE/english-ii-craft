import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/api';
import { useAuthStore } from '@/store/auth';

export default function SettingsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user, profile, setMe, logout } = useAuthStore();
  const [mode, setMode] = useState<'default' | 'custom'>(profile?.has_custom_key ? 'custom' : 'default');
  const [form, setForm] = useState({
    ai_base_url: profile?.has_custom_key ? profile.ai_base_url : '',
    ai_api_key: '',
    ai_model: profile?.has_custom_key ? profile.ai_model : '',
    mastery_required: profile?.mastery_required ?? 2,
    daily_new_limit: profile?.daily_new_limit ?? 20,
  });
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const mut = useMutation({
    mutationFn: async () => {
      const payload: any = {
        mastery_required: Number(form.mastery_required),
        daily_new_limit: Number(form.daily_new_limit),
      };
      if (mode === 'custom') {
        payload.ai_base_url = form.ai_base_url || 'https://open.bigmodel.cn/api/paas/v4';
        payload.ai_model = form.ai_model || 'glm-4-flash';
        if (form.ai_api_key) payload.ai_api_key = form.ai_api_key; // 只在填了新 Key 才更新
      } else {
        // 模式切回默认时,把自定义配置清空
        payload.ai_base_url = '';
        payload.ai_api_key = '';
        payload.ai_model = '';
      }
      const resp = await api.auth.patchMe(payload);
      setMe({ user: resp.user, profile: resp.profile });
      setMsg({ type: 'ok', text: '✅ 设置已保存' });
    },
    onError: (e: any) => setMsg({ type: 'err', text: e?.response?.data?.detail || e?.message || '保存失败' }),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">⚙️ 系统设置</h1>
          <p className="text-slate-500 text-sm mt-1">当前账号: <b>{user?.username}</b> ({user?.email})</p>
        </div>
        <button onClick={() => { logout(); nav('/'); }} className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-sm">退出登录</button>
      </div>

      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-5">
        <div>
          <div className="font-semibold mb-2">AI 批改与查词模型</div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setMode('default')}
              className={`p-4 rounded-lg border text-left transition ${mode === 'default' ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <b>系统默认(免配置)</b>
              </div>
              <div className="text-xs text-slate-500 mt-1">用后端管理员配置的智谱全局 Key,无需自己填。</div>
            </button>
            <button onClick={() => setMode('custom')}
              className={`p-4 rounded-lg border text-left transition ${mode === 'custom' ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">🔑</span>
                <b>使用我自己的 Key</b>
              </div>
              <div className="text-xs text-slate-500 mt-1">支持智谱 / DeepSeek / Moonshot 等 OpenAI 兼容协议。</div>
            </button>
          </div>
          {profile && (
            <div className="mt-3 text-xs text-slate-500 p-3 rounded-md bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div>当前生效:<b>{profile.has_custom_key ? '你自己的 Key' : '系统默认 Key'}</b>
                {profile.has_custom_key && profile.ai_api_key_masked && <span className="ml-2 text-slate-600">{profile.ai_api_key_masked}</span>}</div>
              {profile.ai_base_url && <div>Base: {profile.ai_base_url}</div>}
              {profile.ai_model && <div>Model: {profile.ai_model}</div>}
            </div>
          )}
        </div>

        {mode === 'custom' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm block mb-1">Base URL</label>
              <input value={form.ai_base_url} onChange={e => setForm(f => ({ ...f, ai_base_url: e.target.value }))}
                placeholder="https://open.bigmodel.cn/api/paas/v4"
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 bg-transparent" />
            </div>
            <div>
              <label className="text-sm block mb-1">API Key {form.ai_api_key ? ' (留空则不更换)' : ''}</label>
              <input type="password" value={form.ai_api_key} onChange={e => setForm(f => ({ ...f, ai_api_key: e.target.value }))}
                placeholder="sk-xxxxxxxxxxxxxxxx" className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 bg-transparent" />
            </div>
            <div>
              <label className="text-sm block mb-1">Model</label>
              <input value={form.ai_model} onChange={e => setForm(f => ({ ...f, ai_model: e.target.value }))}
                placeholder="glm-4-flash / deepseek-chat / moonshot-v1-8k 等" className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 bg-transparent" />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1">FSRS 连续答对 N 次算「掌握」</label>
            <input type="number" min={1} max={10} value={form.mastery_required}
              onChange={e => setForm(f => ({ ...f, mastery_required: +e.target.value || 2 }))}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 bg-transparent" />
          </div>
          <div>
            <label className="text-sm block mb-1">每日新增生词上限(仅前端参考)</label>
            <input type="number" min={5} max={200} value={form.daily_new_limit}
              onChange={e => setForm(f => ({ ...f, daily_new_limit: +e.target.value || 20 }))}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 bg-transparent" />
          </div>
        </div>

        {msg && <div className={`p-2.5 rounded-md text-sm ${msg.type === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200'}`}>{msg.text}</div>}
        <div className="flex items-center gap-3">
          <button disabled={mut.isPending} onClick={() => { qc.invalidateQueries({ queryKey: ['vocab-cards'] }); mut.mutate(); }}
            className="px-5 py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">{mut.isPending ? '保存中…' : '保存设置'}</button>
          <button onClick={() => window.location.reload()} className="text-sm underline text-slate-500 hover:text-violet-600">取消还原</button>
        </div>
      </div>
    </div>
  );
}
