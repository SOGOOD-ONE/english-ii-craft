import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { getDeviceId } from '@/store/device';

export default function SettingsPage() {
  const qc = useQueryClient();

  const { data: cfg, isLoading } = useQuery({
    queryKey: ['device-me'],
    queryFn: () => api.device.getMe(),
  });

  const [mode, setMode] = useState<'default' | 'custom'>('default');
  const [form, setForm] = useState({
    ai_base_url: '',
    ai_api_key: '',
    ai_model: '',
    mastery_required: 2,
    daily_new_limit: 20,
  });
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!cfg) return;
    setMode(cfg.ai_base_url ? 'custom' : 'default');
    setForm({
      ai_base_url: cfg.ai_base_url || '',
      ai_api_key: '',
      ai_model: cfg.ai_model || '',
      mastery_required: cfg.mastery_required ?? 2,
      daily_new_limit: cfg.daily_new_limit ?? 20,
    });
  }, [cfg]);

  const mut = useMutation({
    mutationFn: async () => {
      const payload: any = {
        mastery_required: Number(form.mastery_required),
        daily_new_limit: Number(form.daily_new_limit),
      };
      if (mode === 'custom') {
        payload.ai_base_url = form.ai_base_url || 'https://open.bigmodel.cn/api/paas/v4';
        payload.ai_model = form.ai_model || 'glm-4-flash';
        if (form.ai_api_key) payload.ai_api_key = form.ai_api_key;
      } else {
        payload.ai_base_url = '';
        payload.ai_api_key = '';
        payload.ai_model = '';
      }
      await api.device.patchMe(payload);
      setMsg({ type: 'ok', text: '✅ 设置已保存' });
      qc.invalidateQueries({ queryKey: ['device-me'] });
    },
    onError: (e: any) => setMsg({ type: 'err', text: e?.response?.data?.detail || e?.message || '保存失败' }),
  });

  const deviceId = getDeviceId();

  const handleCopy = () => {
    if (deviceId) {
      navigator.clipboard.writeText(deviceId).then(() => {
        setMsg({ type: 'ok', text: '✅ 设备 ID 已复制到剪贴板' });
      }).catch(() => {
        setMsg({ type: 'err', text: '复制失败，请手动选择复制' });
      });
    }
  };

  if (isLoading) return <div className="text-zinc-500 text-xs p-4">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-800">系统设置</span>
      </div>

      {/* 设备 ID 显示/迁移 */}
      <div className="p-3 rounded border border-zinc-200 bg-white">
        <div className="font-semibold text-xs mb-2">设备身份 (多设备迁移用)</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-[11px] font-mono">{deviceId}</code>
          <button onClick={handleCopy} className="px-2.5 py-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-[11px] whitespace-nowrap">复制 ID</button>
        </div>
        <div className="text-[11px] text-zinc-500 mt-1">复制此 ID 到新设备的设置页，即可恢复生词本数据。</div>
      </div>

      <div className="p-3 rounded border border-zinc-200 bg-white space-y-4">
        <div>
          <div className="font-semibold text-xs mb-2">AI 批改与查词模型</div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode('default')}
              className={`p-3 rounded border text-left transition text-xs ${mode === 'default' ? 'border-zinc-900 ring-1 ring-zinc-300' : 'border-zinc-200 hover:bg-zinc-50'}`}>
              <b>系统默认(免配置)</b>
              <div className="text-zinc-500 mt-1">用后端管理员配置的智谱全局 Key,无需自己填。</div>
            </button>
            <button onClick={() => setMode('custom')}
              className={`p-3 rounded border text-left transition text-xs ${mode === 'custom' ? 'border-zinc-900 ring-1 ring-zinc-300' : 'border-zinc-200 hover:bg-zinc-50'}`}>
              <b>使用我自己的 Key</b>
              <div className="text-zinc-500 mt-1">支持智谱 / DeepSeek / Moonshot 等。</div>
            </button>
          </div>
          {cfg && (
            <div className="mt-2 text-[11px] text-zinc-500 p-2 rounded bg-zinc-50 border border-zinc-200">
              <div>当前生效: <b>{cfg.ai_base_url ? '你自己的 Key' : '系统默认 Key'}</b>
                {(cfg as any).ai_api_key_masked && <span className="ml-1 text-zinc-600">{(cfg as any).ai_api_key_masked}</span>}
              </div>
              {cfg.ai_base_url && <div>Base: {cfg.ai_base_url}</div>}
              {cfg.ai_model && <div>Model: {cfg.ai_model}</div>}
            </div>
          )}
        </div>

        {mode === 'custom' && (
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-[11px] block mb-1">Base URL</label>
              <input value={form.ai_base_url} onChange={e => setForm(f => ({ ...f, ai_base_url: e.target.value }))}
                placeholder="https://open.bigmodel.cn/api/paas/v4"
                className="w-full rounded border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900" />
            </div>
            <div>
              <label className="text-[11px] block mb-1">API Key {form.ai_api_key ? ' (留空则不更换)' : ''}</label>
              <input type="password" value={form.ai_api_key} onChange={e => setForm(f => ({ ...f, ai_api_key: e.target.value }))}
                placeholder="sk-xxxxxxxxxxxxxxxx" className="w-full rounded border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900" />
            </div>
            <div>
              <label className="text-[11px] block mb-1">Model</label>
              <input value={form.ai_model} onChange={e => setForm(f => ({ ...f, ai_model: e.target.value }))}
                placeholder="glm-4-flash / deepseek-chat" className="w-full rounded border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900" />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] block mb-1">FSRS 连续答对 N 次算「掌握」</label>
            <input type="number" min={1} max={10} value={form.mastery_required}
              onChange={e => setForm(f => ({ ...f, mastery_required: +e.target.value || 2 }))}
              className="w-full rounded border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900" />
          </div>
          <div>
            <label className="text-[11px] block mb-1">每日新增生词上限</label>
            <input type="number" min={5} max={200} value={form.daily_new_limit}
              onChange={e => setForm(f => ({ ...f, daily_new_limit: +e.target.value || 20 }))}
              className="w-full rounded border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900" />
          </div>
        </div>

        {msg && <div className={`p-2 rounded text-xs ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>}
        <div className="flex items-center gap-3">
          <button disabled={mut.isPending} onClick={() => { qc.invalidateQueries({ queryKey: ['vocab-cards'] }); mut.mutate(); }}
            className="px-4 py-1.5 rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60 text-xs">{mut.isPending ? '保存中…' : '保存设置'}</button>
          <button onClick={() => window.location.reload()} className="text-xs underline text-zinc-500 hover:text-zinc-900">取消还原</button>
        </div>
      </div>
    </div>
  );
}