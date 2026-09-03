'use client';

import { useEffect, useState } from 'react';
import { Save, Trash2, CheckCircle2 } from 'lucide-react';
import { loadAiConfig, saveAiConfig, type AiConfig } from '@/lib/ai/client';
import { db } from '@/lib/db';

export default function SettingsPage() {
  const [cfg, setCfg] = useState<AiConfig>({ baseURL: '', apiKey: '', model: '' });
  const [saved, setSaved] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [reset, setReset] = useState(false);

  useEffect(() => {
    const loaded = loadAiConfig();
    if (loaded) setCfg(loaded);
    db.cards.count().then(setCardCount);
  }, []);

  const onSave = () => {
    saveAiConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const onReset = async () => {
    if (!confirm('确认清除本地生词本与全部复习进度?此操作不可恢复。')) return;
    await db.cards.clear();
    setCardCount(0);
    setReset(true);
    setTimeout(() => setReset(false), 1500);
  };

  return (
    <section className="max-w-2xl mx-auto space-y-3">
      <h2 className="text-lg font-bold">系统设置</h2>

      {/* AI 批改配置 */}
      <div className="bg-white border border-zinc-200 rounded p-4 space-y-3">
        <div>
          <div className="font-semibold text-zinc-800">AI 智能阅卷接口</div>
          <p className="text-zinc-500 text-[11px] mt-0.5">
            兼容 OpenAI / DeepSeek / Moonshot 等协议。Key 仅存本机 localStorage,不上传。
          </p>
        </div>

        <Field label="Base URL">
          <input
            value={cfg.baseURL}
            onChange={(e) => setCfg({ ...cfg, baseURL: e.target.value })}
            placeholder="https://api.deepseek.com/v1"
            className="input"
          />
        </Field>
        <Field label="API Key">
          <input
            type="password"
            value={cfg.apiKey}
            onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })}
            placeholder="sk-..."
            className="input"
          />
        </Field>
        <Field label="Model">
          <input
            value={cfg.model}
            onChange={(e) => setCfg({ ...cfg, model: e.target.value })}
            placeholder="deepseek-chat"
            className="input"
          />
        </Field>

        <button
          onClick={onSave}
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-1.5 rounded font-medium flex items-center gap-1.5"
        >
          {saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
          {saved ? '已保存' : '保存配置'}
        </button>
      </div>

      {/* 数据管理 */}
      <div className="bg-white border border-zinc-200 rounded p-4 space-y-3">
        <div>
          <div className="font-semibold text-zinc-800">本地数据管理</div>
          <p className="text-zinc-500 text-[11px] mt-0.5">
            零后端架构,所有生词与复习进度存于浏览器 IndexedDB。
          </p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded px-3 py-2 flex justify-between items-center">
          <span className="text-zinc-600">生词本卡片数</span>
          <span className="font-mono font-bold">{cardCount}</span>
        </div>
        <button
          onClick={onReset}
          className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-1.5 rounded font-medium flex items-center gap-1.5"
        >
          <Trash2 size={13} />
          {reset ? '已清除' : '清除生词本与进度'}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          height: 36px;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          padding: 0 10px;
          font-size: 12px;
          font-family: monospace;
          outline: none;
          background: #fafafa;
        }
        .input:focus {
          border-color: #18181b;
          background: #fff;
        }
      `}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-zinc-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
