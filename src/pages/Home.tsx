import { motion } from 'motion/react';
import { ArrowRight, BarChart3, Languages, BookOpen, BrainCircuit } from 'lucide-react';

interface HomePageProps {
  onSelectTab: (tab: 'writing' | 'translation' | 'reading' | 'vocab' | 'settings') => void;
}

export default function HomePage({ onSelectTab }: HomePageProps) {
  const modules = [
    {
      id: 'writing' as const,
      title: '大作文写作',
      desc: '图表/图画作文精准研习，支持 AI 维度评分、高分范文对比与句子积木。',
      icon: BarChart3,
      color: 'bg-zinc-900 text-white',
    },
    {
      id: 'translation' as const,
      title: '翻译精修',
      desc: '历年真题划线句与段落翻译精修，附带考点解析与易错陷阱避坑。',
      icon: Languages,
      color: 'bg-zinc-800 text-white',
    },
    {
      id: 'reading' as const,
      title: '阅读理解',
      desc: '历年真题文章精读、题干定位分析、全文中英对照与智能划词查词。',
      icon: BookOpen,
      color: 'bg-zinc-700 text-white',
    },
    {
      id: 'vocab' as const,
      title: 'FSRS复习',
      desc: '基于 FSRS 算法的智能记忆卡片，高效复习考研核心词汇与生词本。',
      icon: BrainCircuit,
      color: 'bg-zinc-600 text-white',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-10 px-2 sm:px-4 space-y-6 sm:space-y-8 select-none">
      {/* 简明标题区 */}
      <motion.div 
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-1.5 sm:space-y-2 text-center"
      >
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
          考研英语真题研习工坊
        </h1>
        <p className="text-[11px] sm:text-xs text-zinc-500">
          全套真题精准攻坚 · 多维 AI 辅助辅导 · 模块化深度研习
        </p>
      </motion.div>

      {/* 模块导航 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.id}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelectTab(m.id)}
              className="group cursor-pointer rounded-xl p-4 sm:p-5 border border-zinc-200 hover:border-zinc-400 bg-white shadow-xs flex flex-col justify-between transition-all"
            >
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs ${m.color}`}>
                    <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 group-hover:text-zinc-700">
                    进入模块 <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-zinc-900 group-hover:text-black">
                    {m.title}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}



