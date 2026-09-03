'use client';

import { useEffect, useState } from 'react';
import { Save, Trash2, CheckCircle2, KeyRound, Sparkles } from 'lucide-react';
import { loadAiConfig, saveAiConfig, type AiConfig } from '@/lib/ai/client';
import { ZHIPU_DEFAULT, resolveCfg } from '@/lib/ai/zhipu';
import { db } from '@/lib/db';

type KeyMode = 'default' | 'custom';

const DEFAULT_CFG: AiConfig = {
  baseURL: ZHIPU_DEFAULT.baseURL,
  apiKey: ZHIPU_DEFAULT.apiKey,
  model: ZHIPU_DEFAULT.model,
};

export default function SettingsPage() {
  const [cfg, setCfg] = useState<AiConfig>(DEFAULT_CFG);
  const [mode, setMode] = useState<KeyMode>('default');
  const [saved, setSaved] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [wordCacheCount, setWordCacheCount] = useState(0);
  const [reset, setReset] = useState(false);

  useEffect(() => {
    const loaded = loadAiConfig();
    // 根据是否填了自定义(非默认)key 来恢复 mode
    if (loaded) {
      const isCustom =
        loaded.apiKey &&
        loaded.apiKey.length > 0 &&
        loaded.apiKey !== ZHIPU_DEFAULT.apiKey;
      setMode(isCustom ? 'custom' : 'default');
      setCfg({ ...DEFAULT_CFG, ...loaded });
    } else {
      // localStorage 空:直接用智谱默认
      setCfg(DEFAULT_CFG);
      setMode('default');
    }
    Promise.all([db.cards.count(), db.words.count()]).then(([c, w]) => {
      setCardCount(c);
      setWordCacheCount(w);
    });
  }, []);

  const onSave = () => {
    const payload: AiConfig =
      mode === 'default'
        ? { ...DEFAULT_CFG }
        : {
            baseURL: cfg.baseURL || DEFAULT_CFG.baseURL,
            apiKey: cfg.apiKey?.trim() || DEFAULT_CFG.apiKey,
            model: cfg.model?.trim() || DEFAULT_CFG.model,
          };
    saveAiConfig(payload);
    setCfg(payload);
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

  const onClearWordCache = async () => {
    if (!confirm('确认清除单词释义缓存?下次 hover 会重新查询。')) return;
    await db.words.clear();
    setWordCacheCount(0);
  };

  const effective = resolveCfg(mode === 'default' ? DEFAULT_CFG : cfg);

  return (
    <section className="max-w-2xl mx-auto space-y-3">
      <h2 className="text-lg font-bold">系统设置</h2>

      {/* AI 批改配置 */}
      <div className="bg-white border border-zinc-200 rounded p-4 space-y-3">
        <div>
          <div className="font-semibold text-zinc-800 flex items-center gap-1.5">
            <KeyRound size={14} /> AI 智能阅卷 & 划词释义
          </div>
          <p className="text-zinc-500 text-[11px] mt-0.5">
            默认使用内置智谱 glm-4-flash 免费 Key;也可切换为你自己的配置(兼容 OpenAI 协议)。
            Key 仅存本机 localStorage,不上传。
          </p>
        </div>

        {/* 模式选择 */}
        <div className="grid grid-cols-2 gap-2">
          <label
            className={`cursor-pointer rounded border p-3 ${
              mode === 'default'
                ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <input
              type="radio"
              name="mode"
              className="hidden"
              checked={mode === 'default'}
              onChange={() => setMode('default')}
            />
            <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
              <Sparkles size={14} className="text-emerald-600" />
              系统默认(免配置)
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              智谱 glm-4-flash 永久免费模型 · 已内置 Key
            </div>
          </label>
          <label
            className={`cursor-pointer rounded border p-3 ${
              mode === 'custom'
                ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <input
              type="radio"
              name="mode"
              className="hidden"
              checked={mode === 'custom'}
              onChange={() => setMode('custom')}
            />
            <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
              <KeyRound size={14} className="text-indigo-600" />
              使用我自己的 Key
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              填你自己的智谱/DeepSeek/Moonshot 等
            </div>
          </label>
        </div>

        <div
          className={`space-y-3 ${mode === 'custom' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
        >
          <Field label="Base URL">
            <input
              value={cfg.baseURL}
              onChange={(e) => setCfg({ ...cfg, baseURL: e.target.value })}
              placeholder={ZHIPU_DEFAULT.baseURL}
              className="input"
              disabled={mode !== 'custom'}
            />
          </Field>
          <Field label="API Key">
            <input
              type="password"
              value={mode === 'custom' ? cfg.apiKey : ''}
              onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })}
              placeholder="sk-... 或 智谱格式 xxxxxxxxx.xxxxxxx"
              className="input"
              disabled={mode !== 'custom'}
            />
          </Field>
          <Field label="Model">
            <input
              value={cfg.model}
              onChange={(e) => setCfg({ ...cfg, model: e.target.value })}
              placeholder="glm-4-flash / glm-4 / deepseek-chat ..."
              className="input"
              disabled={mode !== 'custom'}
            />
          </Field>
        </div>

        {/* 当前生效配置(只读展示) */}
        <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded p-2.5 space-y-1 text-[11px]">
          <div>
            <span className="text-zinc-500 w-16 inline-block">生效 URL: </span>
            <span className="font-mono text-zinc-800">{effective.baseURL}</span>
          </div>
          <div>
            <span className="text-zinc-500 w-16 inline-block">生效模型: </span>
            <span className="font-mono text-zinc-800">{effective.model}</span>
          </div>
          <div>
            <span className="text-zinc-500 w-16 inline-block">生效 Key: </span>
            <span className="font-mono text-zinc-800">
              {maskKey(effective.apiKey)}
            </span>
          </div>
        </div>

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
            零后端架构,生词卡、FSRS 调度、单词释义缓存全存本机浏览器 IndexedDB。
          </p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded divide-y divide-zinc-100">
          <div className="px-3 py-2 flex justify-between items-center">
            <span className="text-zinc-600 text-sm">生词本卡片数</span>
            <span className="font-mono font-bold">{cardCount}</span>
          </div>
          <div className="px-3 py-2 flex justify-between items-center">
            <span className="text-zinc-600 text-sm">单词释义缓存(hover 用过的词)</span>
            <span className="font-mono font-bold">{wordCacheCount}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onClearWordCache}
            className="border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 px-4 py-1.5 rounded font-medium"
          >
            清除单词释义缓存
          </button>
          <button
            onClick={onReset}
            className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-1.5 rounded font-medium flex items-center gap-1.5"
          >
            <Trash2 size={13} />
            {reset ? '已清除' : '清除生词本与进度'}
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          height: 36px;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          padding: 0 10px;
          font-size: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          outline: none;
          background: #fafafa;
        }
        .input:focus {
          border-color: #18181b;
          background: #fff;
        }
        .input:disabled {
          cursor: not-allowed;
          color: #71717a;
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

function maskKey(key: string): string {
  if (!key) return '(空)';
  if (key.length <= 8) return `${'*'.repeat(key.length)}`;
  return `${key.slice(0, 6)}……${key.slice(-4)}`;
}
