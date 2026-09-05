import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as echarts from 'echarts';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, 
  BarChart3, Languages, BookOpen, Trash2, Eye, RefreshCw, Sparkles
} from 'lucide-react';
import api, { type ExamParsedResponse } from '@/api';

function ChartPreview({ option }: { option: any }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInst = useRef<echarts.EChartsType | null>(null);

  useEffect(() => {
    if (!chartRef.current || !option) return;
    let chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) {
      chart = echarts.init(chartRef.current);
    }
    chartInst.current = chart;
    chart.setOption(option, true);
    chart.resize();

    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(chartRef.current);
    return () => {
      ro.disconnect();
      chart?.dispose();
    };
  }, [option]);

  return <div ref={chartRef} className="w-full h-[240px]" />;
}

export default function ExamImporter() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<'pdf' | 'text' | 'github'>('github');
  const targetSubject = 'eng2';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [githubUrl, setGithubUrl] = useState('https://github.com/Fantasia1999/kaoyanzhenti/tree/main/%E5%85%AC%E5%85%B1%E8%AF%BE/%E8%8B%B1%E8%AF%AD%E7%9C%9F%E9%A2%98/%E8%8B%B1%E8%AF%AD%E4%BA%8C');
  const [customYear, setCustomYear] = useState<number>(2025);
  const [autoSave, setAutoSave] = useState(true);

  const [parsedResult, setParsedResult] = useState<ExamParsedResponse | null>(null);
  const [previewTab, setPreviewTab] = useState<'summary' | 'writing' | 'translation' | 'reading'>('summary');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // 获取全部年份题库覆盖情况
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['exam-overview', targetSubject],
    queryFn: () => api.exam.overview(targetSubject),
  });

  // 上传与解析 Mutation
  const parseMut = useMutation({
    mutationFn: async () => {
      setStatusMsg(null);
      if (inputMode === 'github') {
        if (!githubUrl.trim()) throw new Error('请填写有效的 GitHub 资源地址');
        return await api.exam.importGithub({
          url: githubUrl,
          subject: targetSubject,
          year: customYear,
        });
      } else if (inputMode === 'pdf') {
        if (!selectedFile) throw new Error('请先选择或拖拽 PDF 真题文件');
        const fd = new FormData();
        fd.append('file', selectedFile);
        if (customYear) fd.append('year', String(customYear));
        fd.append('auto_save', autoSave ? 'true' : 'false');
        fd.append('subject', targetSubject);
        return await api.exam.uploadAndParse(fd);
      } else {
        if (!rawText.trim() || rawText.trim().length < 30) {
          throw new Error('请输入待解析的真题文本（至少30字）');
        }
        return await api.exam.parseText({
          text: rawText,
          year: customYear,
          auto_save: autoSave,
          subject: targetSubject,
        });
      }
    },
    onSuccess: (data) => {
      setParsedResult(data);
      setStatusMsg({ type: 'ok', text: data.message || `✅ ${data.year} 年真题解析成功！` });
      qc.invalidateQueries({ queryKey: ['exam-years'] });
      qc.invalidateQueries({ queryKey: ['exam-overview'] });
      refetchOverview();
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'err', text: err?.response?.data?.detail || err?.message || '解析遇到错误，请重试' });
    },
  });

  // 删除某年份
  const deleteMut = useMutation({
    mutationFn: (year: number) => api.exam.deleteYear(year),
    onSuccess: (data) => {
      setStatusMsg({ type: 'ok', text: `已成功删除 ${data.year} 年真题数据` });
      qc.invalidateQueries({ queryKey: ['exam-years'] });
      refetchOverview();
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'err', text: err?.response?.data?.detail || err?.message || '删除失败' });
    },
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      // 尝试从文件名猜年份 (例如: 2027英语二.pdf)
      const m = file.name.match(/(20\d{2})/);
      if (m) {
        setCustomYear(parseInt(m[1], 10));
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部标题与说明 */}
      <div className="bg-white p-4 rounded border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-500" />
              AI 真题一键识别与自动录入接口
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              自动化扩充
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
            支持一键上传未来年度（如 2027 年、2028 年）考研英语二官方 PDF 或真题文本。大模型智能结构化识别<b>阅读理解四篇与20道考题、段落英译汉参考译文及切片考点、图表作文与 ECharts 图表数据</b>，自动录入题库。
          </p>
        </div>
        <button
          onClick={() => refetchOverview()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs whitespace-nowrap self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          刷新题库状态
        </button>
      </div>

      {/* 录入工作区 */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* 左侧：输入与上传配置 */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3.5 rounded border border-zinc-200 space-y-3">
            {/* 科目与来源选择 */}
            <div className="space-y-2 border-b border-zinc-100 pb-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-zinc-800">目标考研科目：</span>
                <span className="text-xs bg-zinc-900 font-semibold text-white px-2 py-0.5 rounded shadow-xs">
                  考研英语
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-zinc-800">导入来源模式：</span>
                <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded text-[11px]">
                  <button
                    type="button"
                    onClick={() => setInputMode('github')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${inputMode === 'github' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                  >
                    GitHub 链接
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('pdf')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${inputMode === 'pdf' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                  >
                    PDF 文件
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${inputMode === 'text' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
                  >
                    粘贴文本
                  </button>
                </div>
              </div>
            </div>

            {inputMode === 'github' ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-700 block">
                  GitHub 资源库/试卷路径 (已内置 Fantasia1999/kaoyanzhenti 真题库)：
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/Fantasia1999/kaoyanzhenti/..."
                  className="w-full text-xs font-mono p-2 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 bg-zinc-50/50"
                />
                <p className="text-[10px] text-zinc-500">
                  可直接输入 Fantasia1999/kaoyanzhenti 的英语一或英语二真题 Markdown / PDF 链接，后台将自动解析全套题目并注入对应题库。
                </p>
              </div>
            ) : inputMode === 'pdf' ? (
              <div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition ${
                    selectedFile ? 'border-orange-400 bg-orange-50/30' : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const f = e.target.files[0];
                        setSelectedFile(f);
                        const m = f.name.match(/(20\d{2})/);
                        if (m) setCustomYear(parseInt(m[1], 10));
                      }
                    }}
                  />
                  <Upload className="w-6 h-6 mx-auto text-zinc-400 mb-1.5" />
                  {selectedFile ? (
                    <div>
                      <div className="text-xs font-semibold text-zinc-800">{selectedFile.name}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · 点击可重新选择
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-medium text-zinc-700">点击上传或将 PDF 拖拽到此处</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">支持全国统考英语二完整试卷或单科 PDF</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[11px] text-zinc-600 block mb-1">粘贴真题原文/OCR提取文本：</label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="在此粘贴考研英语二真题全文（包含 Section II 阅读、Section III 翻译或 Section IV 图表大作文Directions）..."
                  rows={7}
                  className="w-full text-xs font-mono p-2 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900 bg-zinc-50/50 resize-y"
                />
              </div>
            )}

            {/* 目标年份与自动保存开关 */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
              <div>
                <label className="text-[11px] font-medium text-zinc-700 block mb-1">目标录入年份</label>
                <input
                  type="number"
                  min={2010}
                  max={2035}
                  value={customYear}
                  onChange={(e) => setCustomYear(parseInt(e.target.value, 10) || 2027)}
                  className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded focus:outline-none focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-700 block mb-1">识别后处理</label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-700 h-[29px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                  />
                  <span>识别后自动存入题库</span>
                </label>
              </div>
            </div>

            {/* 提交解析按钮 */}
            <button
              disabled={parseMut.isPending || (inputMode === 'pdf' && !selectedFile) || (inputMode === 'text' && !rawText.trim())}
              onClick={() => parseMut.mutate()}
              className="w-full py-2 px-3 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              {parseMut.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI 正在全卷深度解析中（耗时约 5-15 秒）...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>开始智能识别并收录 {customYear} 年真题</span>
                </>
              )}
            </button>

            {statusMsg && (
              <div
                className={`p-2.5 rounded text-xs flex items-start gap-1.5 ${
                  statusMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {statusMsg.type === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <span className="leading-snug">{statusMsg.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：识别结果多维预览与比对 */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white p-3.5 rounded border border-zinc-200 min-h-[380px] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-3">
              <span className="font-semibold text-xs text-zinc-800 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-zinc-500" />
                2. 识别结果实时预览
              </span>
              {parsedResult && (
                <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded text-[11px]">
                  <button
                    onClick={() => setPreviewTab('summary')}
                    className={`px-2 py-0.5 rounded ${previewTab === 'summary' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-500'}`}
                  >
                    总览
                  </button>
                  {parsedResult.data.writing && (
                    <button
                      onClick={() => setPreviewTab('writing')}
                      className={`px-2 py-0.5 rounded ${previewTab === 'writing' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-500'}`}
                    >
                      图表写作
                    </button>
                  )}
                  {parsedResult.data.translation && (
                    <button
                      onClick={() => setPreviewTab('translation')}
                      className={`px-2 py-0.5 rounded ${previewTab === 'translation' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-500'}`}
                    >
                      段落翻译
                    </button>
                  )}
                  {parsedResult.data.reading && (
                    <button
                      onClick={() => setPreviewTab('reading')}
                      className={`px-2 py-0.5 rounded ${previewTab === 'reading' ? 'bg-white font-semibold text-zinc-900 shadow-xs' : 'text-zinc-500'}`}
                    >
                      阅读理解
                    </button>
                  )}
                </div>
              )}
            </div>

            {!parsedResult ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-12">
                <FileText className="w-10 h-10 stroke-1 mb-2 text-zinc-300" />
                <div className="text-xs">暂无解析数据</div>
                <div className="text-[11px] text-zinc-400 mt-1">在左侧上传 PDF 或粘贴真题后，此处将呈现多模块结构化内容</div>
              </div>
            ) : (
              <div className="flex-1 space-y-3">
                {/* 概览标签 */}
                {previewTab === 'summary' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1.5">
                      <div className="font-semibold text-zinc-800 text-sm">
                        {parsedResult.year} 年考研英语二解析摘要
                      </div>
                      <div className="text-zinc-600 text-[11px]">
                        文件生成路径：{parsedResult.saved_files.join(', ') || '尚未写入磁盘（未勾选自动保存）'}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className={`p-2.5 rounded border text-center ${parsedResult.summary.has_writing ? 'bg-orange-50/50 border-orange-200 text-orange-950' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
                        <BarChart3 className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                        <div className="font-semibold text-xs">图表写作</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {parsedResult.summary.has_writing ? `识别成功 (${parsedResult.summary.writing_chart_type})` : '未包含'}
                        </div>
                      </div>

                      <div className={`p-2.5 rounded border text-center ${parsedResult.summary.has_translation ? 'bg-blue-50/50 border-blue-200 text-blue-950' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
                        <Languages className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                        <div className="font-semibold text-xs">段落翻译</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {parsedResult.summary.has_translation ? `${parsedResult.summary.translation_slices_count} 个考点切片` : '未包含'}
                        </div>
                      </div>

                      <div className={`p-2.5 rounded border text-center ${parsedResult.summary.has_reading ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
                        <BookOpen className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                        <div className="font-semibold text-xs">阅读理解</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {parsedResult.summary.has_reading ? `${parsedResult.summary.reading_passages_count} 篇文章` : '未包含'}
                        </div>
                      </div>
                    </div>

                    {parsedResult.saved_files.length > 0 && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px]">
                        💡 <b>已实时生效：</b>你现在可以直接切换到顶部的「图表写作」、「段落翻译」或「阅读理解」标签，在年份选择框中直接切换至 <b>{parsedResult.year} 年</b> 进行模考练习！
                      </div>
                    )}
                  </div>
                )}

                {/* 写作预览 */}
                {previewTab === 'writing' && parsedResult.data.writing && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-800">
                      {parsedResult.data.writing.title || `${parsedResult.year}年英语二写作`}
                    </div>
                    {parsedResult.data.writing.chartOption && (
                      <div className="border border-zinc-200 rounded p-2 bg-zinc-50/50">
                        <ChartPreview option={parsedResult.data.writing.chartOption} />
                      </div>
                    )}
                    <div className="text-xs bg-zinc-50 p-2 rounded border border-zinc-200">
                      <div className="font-semibold text-zinc-700 mb-1">Part B 图表作文要求：</div>
                      <pre className="text-[11px] text-zinc-600 whitespace-pre-wrap font-sans">
                        {parsedResult.data.writing.partB || parsedResult.data.writing.prompt}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 翻译预览 */}
                {previewTab === 'translation' && parsedResult.data.translation && (
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded">
                      <div className="font-semibold text-zinc-700 mb-1">英文原文：</div>
                      <div className="text-zinc-800 leading-relaxed">{parsedResult.data.translation.source}</div>
                    </div>
                    <div className="p-2.5 bg-blue-50/40 border border-blue-200 rounded">
                      <div className="font-semibold text-blue-900 mb-1">权威参考译文：</div>
                      <div className="text-blue-950 leading-relaxed">{parsedResult.data.translation.refZh}</div>
                    </div>
                    {Array.isArray(parsedResult.data.translation.slices) && (
                      <div>
                        <div className="font-semibold text-zinc-700 mb-1.5">
                          切片解析 ({parsedResult.data.translation.slices.length} 句)：
                        </div>
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                          {parsedResult.data.translation.slices.map((s: any, idx: number) => (
                            <div key={idx} className="p-2 border border-zinc-200 rounded bg-white text-[11px]">
                              <div className="font-medium text-zinc-900">{s.text}</div>
                              <div className="text-zinc-600 mt-0.5">{s.refZh}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 阅读预览 */}
                {previewTab === 'reading' && parsedResult.data.reading && (
                  <div className="space-y-3 text-xs">
                    <div className="font-semibold text-zinc-800">
                      {parsedResult.data.reading.title}
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {parsedResult.data.reading.passages?.map((p: any, idx: number) => (
                        <div key={idx} className="p-2.5 border border-zinc-200 rounded bg-zinc-50/50">
                          <div className="font-semibold text-zinc-900 mb-1">
                            {p.title} ({p.theme || '综合'}) · {p.paragraphs?.length || 0} 段
                          </div>
                          <div className="text-[11px] text-zinc-600 line-clamp-2 mb-1.5">
                            {p.paragraphs?.[0]}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            已录入 {p.questions?.length || 0} 道题（包含标准选项与答案解析）
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 题库覆盖全览与管理表格 */}
      <div className="bg-white p-3.5 rounded border border-zinc-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-zinc-800">当前题库收录年份覆盖表 (2010 ~ 未来年份)</span>
          <span className="text-[11px] text-zinc-500">已收录 {overview?.total_years || 0} 年真题</span>
        </div>

        {loadingOverview ? (
          <div className="text-zinc-400 text-xs py-4 text-center">加载题库状态中...</div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200">
                <tr>
                  <th className="py-2 px-3 font-semibold">年份</th>
                  <th className="py-2 px-3 font-semibold">图表写作 (Part A+B)</th>
                  <th className="py-2 px-3 font-semibold">段落翻译 (Slices)</th>
                  <th className="py-2 px-3 font-semibold">阅读理解 (Text 1-4)</th>
                  <th className="py-2 px-3 font-semibold">完整度</th>
                  <th className="py-2 px-3 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {(Array.isArray(overview?.years) ? overview.years : []).map((item) => (
                  <tr key={item.year} className="hover:bg-zinc-50/50">
                    <td className="py-2 px-3 font-mono font-bold text-zinc-900">{item.year}</td>
                    <td className="py-2 px-3">
                      {item.writing.exists ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          已就绪 ({item.writing.chartType})
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">未录入</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {item.translation.exists ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          {item.translation.slices} 切片
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">未录入</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {item.reading.exists ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          {item.reading.count} 篇
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">未录入</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {item.complete ? (
                        <span className="text-emerald-600 font-semibold text-[11px]">全套就绪</span>
                      ) : (
                        <span className="text-amber-600 text-[11px]">部分就绪</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {item.year > 2026 && (
                        <button
                          disabled={deleteMut.isPending}
                          onClick={() => {
                            deleteMut.mutate(item.year);
                          }}
                          className="text-red-500 hover:text-red-700 text-[11px] p-1 rounded hover:bg-red-50 inline-flex items-center gap-0.5"
                          title="删除此年份数据"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
