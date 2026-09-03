import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Pencil,
  Highlighter,
  Minus,
  Square,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Plus,
  History,
  Check,
  ChevronDown,
  X,
  Palette,
} from 'lucide-react';
import { AnnotationTool, AnnotationStroke, StrokePoint, PassageNoteRecord } from '@/types/notes';
import {
  getAllPassageNotes,
  savePassageNote,
  deletePassageNote,
  createDefaultNoteRecord,
} from '@/lib/notesStorage';

export interface ReadingNotesCanvasHandle {
  hasStrokes: () => boolean;
  saveCurrentNotes: () => void;
}

interface ReadingNotesCanvasProps {
  year: number;
  passageId: string;
  passageTitle?: string;
  isDrawingMode: boolean;
  setIsDrawingMode: (active: boolean) => void;
  children: React.ReactNode;
}

const PEN_COLORS = [
  { label: '墨黑', value: '#18181b' },
  { label: '赤红', value: '#dc2626' },
  { label: '靛蓝', value: '#2563eb' },
  { label: '翡翠', value: '#059669' },
  { label: '紫晶', value: '#7c3aed' },
  { label: '琥珀', value: '#d97706' },
];

const HIGHLIGHTER_COLORS = [
  { label: '明黄', value: '#facc15' },
  { label: '青柠', value: '#a3e635' },
  { label: '天蓝', value: '#38bdf8' },
  { label: '樱粉', value: '#f472b6' },
  { label: '亮橙', value: '#fb923c' },
];

const PEN_SIZES = [
  { label: '细', value: 1.5 },
  { label: '中', value: 3 },
  { label: '粗', value: 5 },
];

const HIGHLIGHTER_SIZES = [
  { label: '中', value: 14 },
  { label: '粗', value: 22 },
];

const ReadingNotesCanvas = forwardRef<ReadingNotesCanvasHandle, ReadingNotesCanvasProps>(
  function ReadingNotesCanvas(
    {
      year,
      passageId,
      passageTitle,
      isDrawingMode,
      setIsDrawingMode,
      children,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contentContainerRef = useRef<HTMLDivElement | null>(null);

    // Tools state
    const [tool, setTool] = useState<AnnotationTool>('pen');
    const [penColor, setPenColor] = useState<string>('#dc2626'); // default red for review/marking
    const [highlighterColor, setHighlighterColor] = useState<string>('#facc15'); // default yellow
    const [penSize, setPenSize] = useState<number>(2);
    const [highlighterSize, setHighlighterSize] = useState<number>(16);

    // Strokes & History state
    const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
    const [redoStack, setRedoStack] = useState<AnnotationStroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<AnnotationStroke | null>(null);
    const [isNotesVisible, setIsNotesVisible] = useState<boolean>(true);

    // Versioning state
    const [noteList, setNoteList] = useState<PassageNoteRecord[]>([]);
    const [currentNoteId, setCurrentNoteId] = useState<string>('');
    const [currentNoteTitle, setCurrentNoteTitle] = useState<string>('');
    const [showVersionDropdown, setShowVersionDropdown] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

    // Drawing tracking
    const isPointerDown = useRef<boolean>(false);
    const currentPoints = useRef<StrokePoint[]>([]);

    // Expose handle methods to parent
    useImperativeHandle(
      ref,
      () => ({
        hasStrokes: () => strokes.length > 0,
        saveCurrentNotes: () => {
          if (!currentNoteId) return;
          const record: PassageNoteRecord = {
            id: currentNoteId,
            year,
            passageId,
            title: currentNoteTitle || '做题批注',
            strokes,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          savePassageNote(record);
          setNoteList(getAllPassageNotes(year, passageId));
          setSaveStatus('saved');
        },
      }),
      [strokes, currentNoteId, currentNoteTitle, year, passageId]
    );

  // 1. Synchronize Load when Year / Passage changes
  const passageKey = `${year}-${passageId}`;
  const [prevPassageKey, setPrevPassageKey] = useState(passageKey);
  if (passageKey !== prevPassageKey) {
    setPrevPassageKey(passageKey);
    const list = getAllPassageNotes(year, passageId);
    if (list.length > 0) {
      const latest = list[0];
      setNoteList(list);
      setCurrentNoteId(latest.id);
      setCurrentNoteTitle(latest.title);
      setStrokes(latest.strokes || []);
      setRedoStack([]);
    } else {
      const newNote = createDefaultNoteRecord(year, passageId, passageTitle, []);
      savePassageNote(newNote);
      setNoteList([newNote]);
      setCurrentNoteId(newNote.id);
      setCurrentNoteTitle(newNote.title);
      setStrokes([]);
      setRedoStack([]);
    }
  }

  // 2. Auto-save debounced whenever strokes change
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!currentNoteId) return;
    
    const timer = setTimeout(() => {
      const record: PassageNoteRecord = {
        id: currentNoteId,
        year,
        passageId,
        title: currentNoteTitle || '做题批注',
        strokes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      savePassageNote(record);
      setNoteList(getAllPassageNotes(year, passageId));
      setSaveStatus('saved');
    }, 400);

    return () => clearTimeout(timer);
  }, [strokes, currentNoteId, currentNoteTitle, year, passageId]);

  // 3. Render Canvas on Strokes / Resize
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = contentContainerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.scrollWidth || container.clientWidth || 600;
    const height = Math.max(container.scrollHeight || container.clientHeight || 400, 300);

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!isNotesVisible) {
      ctx.restore();
      return;
    }

    const allToDraw = currentStroke ? [...strokes, currentStroke] : strokes;

    for (const stroke of allToDraw) {
      if (!stroke.points || stroke.points.length === 0) continue;

      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = stroke.opacity || 0.35;
      } else {
        ctx.globalAlpha = 1.0;
      }

      if (stroke.tool === 'rect') {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const rw = end.x - start.x;
        const rh = end.y - start.y;
        ctx.beginPath();
        ctx.strokeRect(start.x, start.y, rw, rh);
      } else if (stroke.tool === 'underline') {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else {
        // Freehand pen or highlighter
        ctx.beginPath();
        if (stroke.points.length === 1) {
          const pt = stroke.points[0];
          ctx.arc(pt.x, pt.y, stroke.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = stroke.color;
          ctx.fill();
        } else {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            const p1 = stroke.points[i - 1];
            const p2 = stroke.points[i];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          }
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }, [strokes, currentStroke, isNotesVisible]);

  // Keep canvas sized and re-rendered on layout / DOM mutations
  useEffect(() => {
    renderCanvas();
    const container = contentContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      renderCanvas();
    });
    ro.observe(container);

    return () => ro.disconnect();
  }, [renderCanvas]);

  // Helper: get canvas-relative pointer coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Eraser algorithm: delete strokes that intersect near pointer
  const handleEraseAt = (point: StrokePoint) => {
    const ERASE_RADIUS = 14;
    setStrokes((prev) => {
      return prev.filter((stroke) => {
        return !stroke.points.some((p) => {
          const dx = p.x - point.x;
          const dy = p.y - point.y;
          return dx * dx + dy * dy <= ERASE_RADIUS * ERASE_RADIUS;
        });
      });
    });
  };

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !isNotesVisible) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pt = getCanvasCoords(e);
    isPointerDown.current = true;
    currentPoints.current = [pt];

    if (tool === 'eraser') {
      handleEraseAt(pt);
      return;
    }

    const activeColor = tool === 'highlighter' ? highlighterColor : penColor;
    const activeSize = tool === 'highlighter' ? highlighterSize : penSize;
    const activeOpacity = tool === 'highlighter' ? 0.35 : 1.0;

    const newStroke: AnnotationStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tool,
      color: activeColor,
      size: activeSize,
      opacity: activeOpacity,
      points: [pt],
      timestamp: Date.now(),
    };

    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDown.current || !isDrawingMode || !isNotesVisible) return;
    const pt = getCanvasCoords(e);

    if (tool === 'eraser') {
      handleEraseAt(pt);
      return;
    }

    currentPoints.current.push(pt);
    setCurrentStroke((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...currentPoints.current],
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (tool === 'eraser') {
      return;
    }

    if (currentStroke && currentStroke.points.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
      setRedoStack([]); // clear redo stack on new action
      setCurrentStroke(null);
    }
  };

  // Undo / Redo / Clear actions
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setStrokes((prev) => [...prev, next]);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    if (window.confirm('确定要清空本篇阅读的所有画板批注吗？')) {
      setStrokes([]);
      setRedoStack([]);
    }
  };

  // Versioning actions
  const handleSwitchNote = (note: PassageNoteRecord) => {
    setCurrentNoteId(note.id);
    setCurrentNoteTitle(note.title);
    setStrokes(note.strokes || []);
    setRedoStack([]);
    setShowVersionDropdown(false);
  };

  const handleCreateNewNote = () => {
    const count = noteList.length + 1;
    const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newNote = createDefaultNoteRecord(year, passageId, passageTitle, []);
    newNote.title = `第${count}次练习笔记 (${dateStr})`;
    savePassageNote(newNote);

    const updatedList = getAllPassageNotes(year, passageId);
    setNoteList(updatedList);
    setCurrentNoteId(newNote.id);
    setCurrentNoteTitle(newNote.title);
    setStrokes([]);
    setRedoStack([]);
    setShowVersionDropdown(false);
    setIsDrawingMode(true);
  };

  const handleDeleteCurrentNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (noteList.length <= 1) {
      // If only one, just clear strokes
      setStrokes([]);
      setRedoStack([]);
      return;
    }
    if (window.confirm('确定要删除这份笔记记录吗？')) {
      deletePassageNote(year, passageId, noteId);
      const remaining = getAllPassageNotes(year, passageId);
      setNoteList(remaining);
      if (currentNoteId === noteId && remaining.length > 0) {
        handleSwitchNote(remaining[0]);
      }
    }
  };

  // Export as PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${year}_${passageId}_reading_notes.png`;
    a.click();
  };

  return (
    <div className="flex flex-col">
      {/* 1. Interactive Note Floating Toolbar (relative z-30 ensures buttons are never blocked) */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 p-2 mb-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs shadow-xs select-none">
        {/* Left: Mode Toggle & Versions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Drawing Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition text-xs cursor-pointer ${
              isDrawingMode
                ? 'bg-amber-600 text-white shadow-xs hover:bg-amber-700'
                : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{isDrawingMode ? '退出画板模式' : '开启笔记画板'}</span>
          </button>

          {/* Visibility Toggle */}
          <button
            type="button"
            title={isNotesVisible ? '隐藏所有笔记' : '显示笔记'}
            onClick={() => setIsNotesVisible(!isNotesVisible)}
            className={`p-1 rounded border transition cursor-pointer ${
              isNotesVisible
                ? 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                : 'bg-zinc-200 text-zinc-500 border-zinc-300'
            }`}
          >
            {isNotesVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Note Version Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVersionDropdown(!showVersionDropdown)}
              className="flex items-center gap-1 px-2 py-1 bg-white border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-100 font-medium text-[11px] cursor-pointer"
            >
              <History className="w-3 h-3 text-zinc-500" />
              <span className="max-w-[120px] truncate">{currentNoteTitle || '做题批注'}</span>
              <span className="text-[10px] text-zinc-400">({strokes.length} 笔)</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showVersionDropdown && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-zinc-200 p-1.5 z-40 text-xs">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-100 px-1">
                  <span className="font-semibold text-zinc-700 text-[11px]">历史笔记版本</span>
                  <button
                    type="button"
                    onClick={handleCreateNewNote}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium px-1.5 py-0.5 rounded bg-indigo-50 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    新建纯净笔记
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {noteList.map((note) => {
                    const isCurrent = note.id === currentNoteId;
                    return (
                      <div
                        key={note.id}
                        onClick={() => handleSwitchNote(note)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                          isCurrent ? 'bg-zinc-100 font-medium text-zinc-900' : 'hover:bg-zinc-50 text-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isCurrent && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                          <span className="truncate text-[11px]">{note.title}</span>
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            {note.strokes?.length || 0} 笔
                          </span>
                        </div>
                        {noteList.length > 1 && (
                          <button
                            type="button"
                            title="删除该版本"
                            onClick={(e) => handleDeleteCurrentNote(note.id, e)}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Auto-saved indicator */}
          <span className="text-[10px] text-zinc-400 ml-1">
            {saveStatus === 'saving' ? '正在保存...' : '已自动云/端保存'}
          </span>
        </div>

        {/* Right: Brush, Highlighter, Color, Eraser, Undo/Redo Tools */}
        {isDrawingMode && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Tool Selection */}
            <div className="flex items-center bg-white border border-zinc-200 rounded p-0.5">
              <button
                type="button"
                title="钢笔 / 勾画批注"
                onClick={() => setTool('pen')}
                className={`p-1 rounded transition cursor-pointer ${
                  tool === 'pen' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="荧光高亮笔 / 划核心句"
                onClick={() => setTool('highlighter')}
                className={`p-1 rounded transition cursor-pointer ${
                  tool === 'highlighter' ? 'bg-amber-500 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="下划线 / 直线"
                onClick={() => setTool('underline')}
                className={`p-1 rounded transition cursor-pointer ${
                  tool === 'underline' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="重点矩形框"
                onClick={() => setTool('rect')}
                className={`p-1 rounded transition cursor-pointer ${
                  tool === 'rect' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="橡皮擦"
                onClick={() => setTool('eraser')}
                className={`p-1 rounded transition cursor-pointer ${
                  tool === 'eraser' ? 'bg-rose-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Colors palette */}
            {tool !== 'eraser' && (
              <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded px-1.5 py-0.5">
                {(tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS).map((c) => {
                  const isSelected = (tool === 'highlighter' ? highlighterColor : penColor) === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => {
                        if (tool === 'highlighter') setHighlighterColor(c.value);
                        else setPenColor(c.value);
                      }}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                        isSelected ? 'scale-125 ring-2 ring-zinc-400 ring-offset-1' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  );
                })}
              </div>
            )}

            {/* Brush Size */}
            {tool !== 'eraser' && (
              <div className="flex items-center gap-0.5 bg-white border border-zinc-200 rounded p-0.5 text-[10px]">
                {(tool === 'highlighter' ? HIGHLIGHTER_SIZES : PEN_SIZES).map((s) => {
                  const isSelected = (tool === 'highlighter' ? highlighterSize : penSize) === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        if (tool === 'highlighter') setHighlighterSize(s.value);
                        else setPenSize(s.value);
                      }}
                      className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                        isSelected ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Undo / Redo / Clear / Export */}
            <div className="flex items-center gap-0.5 border-l border-zinc-300 pl-1.5">
              <button
                type="button"
                title="撤销 (Undo)"
                disabled={strokes.length === 0}
                onClick={handleUndo}
                className="p-1 rounded text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="重做 (Redo)"
                disabled={redoStack.length === 0}
                onClick={handleRedo}
                className="p-1 rounded text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="清空当前篇所有笔记"
                disabled={strokes.length === 0}
                onClick={handleClear}
                className="p-1 rounded text-zinc-600 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="导出批注图片 (PNG)"
                disabled={strokes.length === 0}
                onClick={handleExportPNG}
                className="p-1 rounded text-zinc-600 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Passage Body Container with Canvas Overlay */}
      <div ref={contentContainerRef} className="relative min-h-[360px]">
        {/* Canvas Layer */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`absolute inset-0 z-10 w-full h-full transition-opacity duration-150 ${
            isDrawingMode ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
          } ${isNotesVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ touchAction: 'none' }}
        />

        {/* Text Content */}
        <div className="relative z-0">
          {children}
        </div>
      </div>
    </div>
  );
});

export default ReadingNotesCanvas;
