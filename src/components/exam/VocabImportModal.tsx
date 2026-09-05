import React, { useState, useMemo } from 'react';
import {
  X,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/api';

interface VocabImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string, importedSourcePath?: string) => void;
}

// 考研精选系统词包
const PRESET_BUNDLES = [
  {
    id: 'core-50',
    title: '考研英语二 2015-2026 真题核心 50 词',
    desc: '包含历年真题中出现频率最高、占比/趋势/对比题型必用的高阶谓语动词与名形容词',
    tag: '真题必备',
    count: 50,
    items: [
      { word: 'dramatic', pos: 'adj.', definition: '剧烈的，戏剧性的' },
      { word: 'fluctuate', pos: 'v.', definition: '波动，起伏' },
      { word: 'substantial', pos: 'adj.', definition: '大量的，可观的' },
      { word: 'underlying', pos: 'adj.', definition: '潜在的，基础的' },
      { word: 'inevitable', pos: 'adj.', definition: '不可避免的' },
      { word: 'perspective', pos: 'n.', definition: '视角，观点' },
      { word: 'proportion', pos: 'n.', definition: '比例，部分' },
      { word: 'attribute', pos: 'v./n.', definition: '把…归因于; 属性' },
      { word: 'surge', pos: 'n./v.', definition: '激增，奔涌' },
      { word: 'decline', pos: 'n./v.', definition: '下降，衰退' },
      { word: 'peak', pos: 'n.', definition: '顶峰，极值' },
      { word: 'account', pos: 'v.', definition: '占比(account for); 账目' },
      { word: 'hinge', pos: 'v.', definition: '依赖于(hinge upon)' },
      { word: 'boom', pos: 'n./v.', definition: '繁荣，激增' },
      { word: 'slump', pos: 'n./v.', definition: '骤降，萧条' },
      { word: 'ratio', pos: 'n.', definition: '比例，比率' },
      { word: 'trend', pos: 'n.', definition: '趋势，倾向' },
      { word: 'manifest', pos: 'v.', definition: '表露，显现' },
      { word: 'accommodate', pos: 'v.', definition: '容纳，适应' },
      { word: 'accelerate', pos: 'v.', definition: '加速' },
      { word: 'advocate', pos: 'v./n.', definition: '提倡; 拥护者' },
      { word: 'allocate', pos: 'v.', definition: '分配，拨给' },
      { word: 'anticipate', pos: 'v.', definition: '预期，期望' },
      { word: 'boost', pos: 'v./n.', definition: '促进，推动' },
      { word: 'compensate', pos: 'v.', definition: '补偿，赔偿' },
      { word: 'cultivate', pos: 'v.', definition: '培养，陶冶' },
      { word: 'deteriorate', pos: 'v.', definition: '恶化' },
      { word: 'diminish', pos: 'v.', definition: '减少，降低' },
      { word: 'distinguish', pos: 'v.', definition: '区分，辨别' },
      { word: 'encounter', pos: 'v./n.', definition: '遭遇，遇到' },
      { word: 'enhance', pos: 'v.', definition: '提高，增强' },
      { word: 'guarantee', pos: 'v./n.', definition: '保证，担保' },
      { word: 'illustrate', pos: 'v.', definition: '阐明，说明' },
      { word: 'imply', pos: 'v.', definition: '暗示，意味着' },
      { word: 'indicate', pos: 'v.', definition: '表明，指出' },
      { word: 'initiate', pos: 'v.', definition: '发起，倡议' },
      { word: 'inspect', pos: 'v.', definition: '检查，视察' },
      { word: 'integrate', pos: 'v.', definition: '整合，合并' },
      { word: 'maintain', pos: 'v.', definition: '维持，主张' },
      { word: 'manipulate', pos: 'v.', definition: '操纵，控制' },
      { word: 'modify', pos: 'v.', definition: '修改，调整' },
      { word: 'negotiate', pos: 'v.', definition: '谈判，协商' },
      { word: 'oblige', pos: 'v.', definition: '迫使，感恩' },
      { word: 'perceive', pos: 'v.', definition: '感知，察觉' },
      { word: 'predict', pos: 'v.', definition: '预测' },
      { word: 'promote', pos: 'v.', definition: '提升，推广' },
      { word: 'reinforce', pos: 'v.', definition: '加强，巩固' },
      { word: 'restrict', pos: 'v.', definition: '限制，约束' },
      { word: 'stimulate', pos: 'v.', definition: '刺激，激发' },
      { word: 'transform', pos: 'v.', definition: '改变，转型' },
    ],
  },
  {
    id: 'phrases-30',
    title: '考研高分介词短语与固定搭配 30 词',
    desc: '专为写作与英译汉打造的逻辑衔接与图表归因黄金词组',
    tag: '写作翻译加分',
    count: 30,
    items: [
      { word: 'account for', pos: 'phr.', definition: '占…比例；解释…' },
      { word: 'in proportion to', pos: 'phr.', definition: '与…成比例' },
      { word: 'in sharp contrast to', pos: 'phr.', definition: '与…形成鲜明对比' },
      { word: 'hinge upon', pos: 'phr.', definition: '取决于，依赖于' },
      { word: 'be attributed to', pos: 'phr.', definition: '归因于…' },
      { word: 'take into account', pos: 'phr.', definition: '把…考虑在内' },
      { word: 'a surge in demand', pos: 'phr.', definition: '需求激增' },
      { word: 'on the decline', pos: 'phr.', definition: '呈下降趋势' },
      { word: 'dramatic shift', pos: 'phr.', definition: '剧烈转变' },
      { word: 'reach a peak of', pos: 'phr.', definition: '达到…的顶峰' },
      { word: 'in terms of', pos: 'phr.', definition: '在…方面，依据' },
      { word: 'with respect to', pos: 'phr.', definition: '关于，至于' },
      { word: 'by virtue of', pos: 'phr.', definition: '凭借，由于' },
      { word: 'for the sake of', pos: 'phr.', definition: '为了…起见' },
      { word: 'on behalf of', pos: 'phr.', definition: '代表…' },
      { word: 'in harmony with', pos: 'phr.', definition: '与…和谐一致' },
      { word: 'in line with', pos: 'phr.', definition: '与…相符' },
      { word: 'contrary to', pos: 'phr.', definition: '与…相反' },
      { word: 'in accordance with', pos: 'phr.', definition: '依照，根据' },
      { word: 'subject to', pos: 'phr.', definition: '受制于，易遭受' },
      { word: 'apply to', pos: 'phr.', definition: '适用于' },
      { word: 'contribute to', pos: 'phr.', definition: '导致，有助于' },
      { word: 'focus on', pos: 'phr.', definition: '专注于' },
      { word: 'lead to', pos: 'phr.', definition: '导致' },
      { word: 'result in', pos: 'phr.', definition: '导致，造成' },
      { word: 'lie in', pos: 'phr.', definition: '在于' },
      { word: 'rely on', pos: 'phr.', definition: '依靠' },
      { word: 'consist of', pos: 'phr.', definition: '由…组成' },
      { word: 'adapt to', pos: 'phr.', definition: '适应' },
      { word: 'access to', pos: 'phr.', definition: '获得…的机会/途径' },
    ],
  },
  {
    id: 'polysemy-30',
    title: '考研熟词生义与高频易混 30 词',
    desc: '阅读理解深度障碍词，精准破译考研英语熟词生义与多义词陷阱',
    tag: '阅读陷阱突破',
    count: 30,
    items: [
      { word: 'subject', pos: 'n./adj.', definition: '实验对象；主题；受…支配的' },
      { word: 'observe', pos: 'v.', definition: '遵守(规律)；观察；注意到' },
      { word: 'check', pos: 'n./v.', definition: '抑制，检查；支票' },
      { word: 'address', pos: 'v./n.', definition: '解决(问题)；演讲；地址' },
      { word: 'capital', pos: 'n.', definition: '资本；资金；首都' },
      { word: 'appreciate', pos: 'v.', definition: '升值；欣赏；感激' },
      { word: 'contain', pos: 'v.', definition: '控制，遏制；包含' },
      { word: 'decline', pos: 'v.', definition: '谢绝；下降' },
      { word: 'deliver', pos: 'v.', definition: '发表(演讲)；交付；实现' },
      { word: 'figure', pos: 'n./v.', definition: '人物；数字；认为' },
      { word: 'article', pos: 'n.', definition: '物品，条款；文章' },
      { word: 'cause', pos: 'n./v.', definition: '事业，原因；引起' },
      { word: 'company', pos: 'n.', definition: '陪伴；公司' },
      { word: 'court', pos: 'v./n.', definition: '招致，求爱；法庭' },
      { word: 'credit', pos: 'n.', definition: '赞扬，信用；学分' },
      { word: 'interest', pos: 'n.', definition: '利益；利息；兴趣' },
      { word: 'issue', pos: 'n./v.', definition: '焦点问题；发行；发布' },
      { word: 'mean', pos: 'adj./v.', definition: '吝啬的，平均的；意味着' },
      { word: 'note', pos: 'v./n.', definition: '注意到，指出；笔记' },
      { word: 'present', pos: 'v./n.', definition: '展现；提出；礼物' },
      { word: 'record', pos: 'n./adj.', definition: '履历，记录；创纪录的' },
      { word: 'yield', pos: 'v./n.', definition: '产生，屈服；收益，产量' },
      { word: 'scale', pos: 'n.', definition: '规模；等级；鳞片' },
      { word: 'board', pos: 'n./v.', definition: '董事会；木板；登机' },
      { word: 'sound', pos: 'adj./n.', definition: '健康的，合理的；声音' },
      { word: 'flat', pos: 'adj./n.', definition: '萧条的，平的；公寓' },
      { word: 'gross', pos: 'adj.', definition: '总共的，严重的' },
      { word: 'fine', pos: 'n./adj.', definition: '罚金；细微的' },
      { word: 'host', pos: 'n.', definition: '大量，东道主' },
      { word: 'spell', pos: 'n.', definition: '一段时间；拼写' },
    ],
  },
];

export default function VocabImportModal({ isOpen, onClose, onSuccess }: VocabImportModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'preset'>('text');
  const [inputText, setInputText] = useState('');
  const [customLexiconName, setCustomLexiconName] = useState('自定义词库');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 解析输入的文本 (Unconditional Hook)
  const parsedItems = useMemo(() => {
    if (!inputText.trim()) return [];

    // 判断是否为 JSON 格式
    const trimmed = inputText.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const jsonList = JSON.parse(trimmed);
        if (Array.isArray(jsonList)) {
          return jsonList.map((item: any) => ({
            word: item.word || item.lemma || '',
            phonetic: item.phonetic || '',
            definition: item.definition || item.def || '',
            pos: item.pos || '',
            context_sentence: item.context || item.context_sentence || '',
          })).filter(i => i.word);
        }
      } catch {}
    }

    // 按行解析文本/CSV
    const lines = trimmed.split(/\r?\n/);
    const results: Array<{ word: string; phonetic?: string; definition?: string; pos?: string; context_sentence?: string }> = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;

      // 尝试匹配带有逗号或制表符的 CSV 格式: word,phonetic,definition
      let parts = line.split(/[,\t]/);
      if (parts.length >= 2) {
        const w = parts[0].trim();
        const pOrDef = parts[1].trim();
        const def = parts.slice(2).join(',').trim() || pOrDef;
        const phonetic = pOrDef.startsWith('/') || pOrDef.startsWith('[') ? pOrDef : '';

        if (w) {
          results.push({
            word: w,
            phonetic,
            definition: phonetic ? def : pOrDef,
          });
          continue;
        }
      }

      // 尝试匹配 word [音标] 释义 格式
      const spaceMatch = line.match(/^([a-zA-Z\s\-']+)(?:\s+[/[\]]([^/\]]+)[/\]])?\s*(.*)$/);
      if (spaceMatch) {
        const w = spaceMatch[1].trim();
        const p = spaceMatch[2] ? `/${spaceMatch[2]}/` : '';
        const def = spaceMatch[3].trim();
        if (w) {
          results.push({
            word: w,
            phonetic: p,
            definition: def || '自定义词汇',
          });
          continue;
        }
      }

      // 普通单词按行
      const cleanW = line.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').trim();
      if (cleanW) {
        results.push({ word: cleanW, definition: '自定义导入词汇' });
      }
    }

    return results;
  }, [inputText]);

  if (!isOpen) return null;

  // 下载 Excel 导入模板
  const downloadExcelTemplate = () => {
    const templateData = [
      {
        '单词 (Word)': 'fluctuate',
        '音标 (Phonetic)': '/ˈflʌktʃueɪt/',
        '词性 (POS)': 'v.',
        '释义 (Definition)': '波动，起伏',
        '例句 (Context)': 'Prices fluctuate according to supply and demand.'
      },
      {
        '单词 (Word)': 'substantial',
        '音标 (Phonetic)': '/səbˈstænʃl/',
        '词性 (POS)': 'adj.',
        '释义 (Definition)': '大量的，可观的',
        '例句 (Context)': 'A substantial number of members supported the proposal.'
      },
      {
        '单词 (Word)': 'account for',
        '音标 (Phonetic)': '',
        '词性 (POS)': 'phr.',
        '释义 (Definition)': '占…比例；解释…',
        '例句 (Context)': 'High housing costs account for a big share of monthly expenses.'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '导入模板');
    XLSX.writeFile(wb, '考研英语二-词库批量导入模板.xlsx');
  };

  // 处理文件上传 (支持 .xlsx, .xls, .txt, .csv, .json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    if (file.name) {
      setCustomLexiconName(file.name);
    }
    const fileName = file.name.toLowerCase();

    // 如果是 Excel 文件 (.xlsx 或 .xls)
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!jsonRows || jsonRows.length === 0) {
            setErrorMsg('Excel 表格内容为空，请重新选择');
            return;
          }

          const extractedLines: string[] = [];
          for (const row of jsonRows) {
            if (typeof row === 'object' && row !== null) {
              const keys = Object.keys(row);
              let word = '';
              let phonetic = '';
              let def = '';
              let pos = '';

              for (const key of keys) {
                const k = key.trim().toLowerCase();
                const val = String(row[key] || '').trim();
                if (!val) continue;

                if (k.includes('单词') || k.includes('word') || k.includes('lemma')) {
                  word = val;
                } else if (k.includes('音标') || k.includes('phonetic')) {
                  phonetic = val;
                } else if (k.includes('释义') || k.includes('definition') || k.includes('meaning') || k.includes('翻译')) {
                  def = val;
                } else if (k.includes('词性') || k.includes('pos')) {
                  pos = val;
                }
              }

              // 如果未能在表头匹配到 key，回退到第一列为单词，第二列为释义
              if (!word && keys.length > 0) {
                word = String(row[keys[0]] || '').trim();
                if (keys.length > 1) def = String(row[keys[1]] || '').trim();
              }

              if (word) {
                const fullDef = pos ? `${pos} ${def}`.trim() : def;
                if (phonetic && fullDef) {
                  extractedLines.push(`${word}, ${phonetic}, ${fullDef}`);
                } else if (fullDef) {
                  extractedLines.push(`${word}, ${fullDef}`);
                } else {
                  extractedLines.push(word);
                }
              }
            }
          }

          if (extractedLines.length > 0) {
            setInputText(extractedLines.join('\n'));
          } else {
            setErrorMsg('未能从 Excel 中识别到有效单词列');
          }
        } catch (err: any) {
          setErrorMsg('解析 Excel 文件出错：' + (err.message || '格式无法识别'));
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // 普通文本文件 (.txt, .csv, .json)
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(text);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // 提交批量导入
  const handleConfirmImport = async (itemsToImport = parsedItems, bundleTitle = customLexiconName || '自定义词库导入') => {
    if (itemsToImport.length === 0) {
      setErrorMsg('解析到的有效单词为空，请检查文本格式');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.vocab.importBatch(itemsToImport, bundleTitle);
      setLoading(false);
      onSuccess(res.message || `成功导入词库《${bundleTitle}》，包含 ${res.imported_count} 个单词`, bundleTitle);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.response?.data?.detail || err.message || '导入失败，请稍后重试');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal 头部 */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">导入自定义词库</h2>
              <p className="text-[11px] text-zinc-500">支持批量文本、CSV/JSON 文件或考研精选系统词包</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-b border-zinc-200 bg-zinc-100/60 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-1.5 font-medium rounded-md transition text-center cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            文本 / 文件粘贴导入
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-1.5 font-medium rounded-md transition text-center flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>考研精选系统词包 (一键收录)</span>
          </button>
        </div>

        {/* Modal 主内容区 */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              {/* 文件上传与说明 */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-50 border border-zinc-200/80 rounded-lg p-3 text-xs">
                <div className="text-zinc-600 leading-relaxed">
                  <span className="font-semibold text-zinc-900">支持格式:</span> Excel 表格 (<code className="bg-emerald-100 text-emerald-800 px-1 rounded font-mono">.xlsx / .xls</code>) / CSV / TXT / JSON
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition cursor-pointer"
                    title="下载标准的 Excel 导入模板表"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>下载 Excel 模板</span>
                  </button>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-medium transition cursor-pointer shadow-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>上传 Excel / 文本文件</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.txt,.csv,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* 词库包名称 */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-zinc-800 whitespace-nowrap">词库包名称：</label>
                <input
                  type="text"
                  value={customLexiconName}
                  onChange={(e) => setCustomLexiconName(e.target.value)}
                  placeholder="例如: 2026考研英语二词汇.xlsx"
                  className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white"
                />
              </div>

              {/* 文本输入框 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-zinc-700">在下方粘贴词库内容：</label>
                  {inputText && (
                    <button
                      type="button"
                      onClick={() => setInputText('')}
                      className="text-[11px] text-zinc-400 hover:text-rose-600"
                    >
                      清空文本
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`示例 1 (纯单词):\ndramatic\nfluctuate\nsubstantial\n\n示例 2 (带释义):\naccount for, phr. 占…比例；解释…\nin proportion to, phr. 与…成比例\n\n示例 3 (CSV/音标):\nsurge, /sɜːdʒ/, n./v. 激增`}
                  className="w-full p-3 font-mono text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50/50"
                />
              </div>

              {/* 实时解析预览 */}
              {parsedItems.length > 0 && (
                <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
                  <div className="px-3 py-2 bg-zinc-100/70 text-xs font-bold text-zinc-800 flex items-center justify-between">
                    <span>解析预览 (共识别出 {parsedItems.length} 个单词)</span>
                    <span className="text-[11px] font-normal text-zinc-500">重复词汇将在导入时自动剔除</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-zinc-100 text-xs font-mono">
                    {parsedItems.slice(0, 15).map((item, idx) => (
                      <div key={idx} className="px-3 py-1.5 flex items-center justify-between hover:bg-zinc-50">
                        <span className="font-bold text-zinc-900">{item.word}</span>
                        <span className="text-zinc-500 text-[11px] truncate max-w-xs">{item.definition || '考研真题重点词汇'}</span>
                      </div>
                    ))}
                    {parsedItems.length > 15 && (
                      <div className="px-3 py-1.5 text-center text-zinc-400 text-[11px]">
                        ...以及另外 {parsedItems.length - 15} 个单词
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                预设词包由团队根据考研英语二 2015-2026 历年真题精准筛选，涵盖归因词汇、写作固定搭配与阅读易混陷阱词。
              </p>

              <div className="grid grid-cols-1 gap-3">
                {PRESET_BUNDLES.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="p-4 border border-zinc-200 rounded-xl bg-white hover:border-zinc-300 transition flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                          <BookOpen className="w-3 h-3" />
                          {bundle.tag}
                        </span>
                        <span className="text-xs font-mono text-zinc-400 font-semibold">{bundle.count} 词</span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 mb-1">{bundle.title}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed mb-3">{bundle.desc}</p>

                      {/* 包含样例单词 */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {bundle.items.slice(0, 6).map((i, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-zinc-100 rounded text-[11px] font-mono text-zinc-700">
                            {i.word}
                          </span>
                        ))}
                        <span className="text-[11px] text-zinc-400 self-center">...</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleConfirmImport(bundle.items, bundle.title)}
                      className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>一键导入此词包 ({bundle.count} 词)</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal 底部操作栏 */}
        {activeTab === 'text' && (
          <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {parsedItems.length > 0 ? `已就绪: ${parsedItems.length} 词` : '等待输入词库文本...'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-medium transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={loading || parsedItems.length === 0}
                onClick={() => handleConfirmImport(parsedItems, '自定义词库导入')}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>导入中...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>确认导入 ({parsedItems.length} 词)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
