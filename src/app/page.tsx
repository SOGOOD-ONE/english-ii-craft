import Link from 'next/link';
import { PenLine, Languages, Layers, MousePointerClick } from 'lucide-react';

const MODULES = [
  {
    href: '/writing',
    icon: PenLine,
    title: '图表大作文实验室',
    score: '15分',
    desc: '动态图表渲染 + 语料积木点击插入 + 智谱 glm-4-flash 四维度智能阅卷。',
  },
  {
    href: '/translation',
    icon: Languages,
    title: '段落翻译 Diff 精修台',
    score: '15分',
    desc: '句子切片训练 + jsdiff 字符级红绿高亮 + 考点陷阱透视。',
  },
  {
    href: '/vocab',
    icon: Layers,
    title: 'FSRS 语境生词本',
    score: '闭环',
    desc: '全局 hover 查词 + 划词抓取真题原句 + FSRS 间隔重复卡片流,形成记忆闭环。',
  },
];

export default function Home() {
  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="bg-white border border-zinc-200 rounded p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              考研英语二 · 攻坚工坊
            </h1>
            <p className="text-zinc-500 mt-1">
              专攻主观题(作文 + 翻译,总分 30 分)+ 记忆闭环,零后端架构,本地数据优先。
            </p>
          </div>
          <div className="bg-zinc-900 text-white px-3 py-1.5 rounded font-mono text-[11px]">
            数据源: 2010–2026 真题
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-zinc-500 text-[11px] bg-zinc-50 border border-zinc-200 rounded px-3 py-2">
          <MousePointerClick size={13} />
          <span>
            任意英文文本 hover 自动查释义(智谱 glm-4-flash,本地 Dexie 缓存),选中单词可抓取进生词本。
          </span>
        </div>
      </section>

      {/* 模块导航 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="group bg-white border border-zinc-200 rounded p-4 hover:border-zinc-900 transition-colors flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center transition-colors">
                    <Icon size={14} />
                  </span>
                  <span className="font-semibold text-zinc-900">{m.title}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5">
                  {m.score}
                </span>
              </div>
              <p className="text-zinc-500 leading-relaxed">{m.desc}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { k: '图表写作', v: '15' },
          { k: '段落翻译', v: '15' },
        ].map((s) => (
          <div key={s.k} className="bg-white border border-zinc-200 rounded p-4">
            <div className="text-2xl font-bold font-mono">{v(s.v)}</div>
            <div className="text-zinc-500 mt-1">{s.k} 满分 {s.v} 分</div>
          </div>
        ))}
      </section>
    </div>
  );
}

function v(n: string) {
  return n.padStart(2, '0');
}
