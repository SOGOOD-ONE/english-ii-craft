import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

const _safeFilename = typeof __filename !== 'undefined' ? __filename : path.resolve(process.cwd(), 'src/lib/examParser.ts');

export interface ParsedExamResult {
  year: number;
  detected_year: number;
  modules: {
    reading?: any;
    translation?: any;
    writing?: any;
  };
  saved_files: string[];
  summary: {
    has_reading: boolean;
    reading_passages_count: number;
    has_translation: boolean;
    translation_slices_count: number;
    has_writing: boolean;
    writing_chart_type?: string;
  };
  raw_text_length: number;
}

/**
 * 从 PDF Buffer 中提取纯文本
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ verbosity: 0 });
    // PDFParse expects buffer via load/getText
    if (typeof (parser as any).load === 'function') {
      await (parser as any).load(buffer);
      const text = await (parser as any).getText();
      if (text && text.trim().length > 20) {
        return text.trim();
      }
    }
  } catch (e: any) {
    console.warn('PDFParse extraction error, trying fallback:', e.message);
  }

  // 备用文本提取正则扫描
  const rawStr = buffer.toString('binary');
  const textBlocks: string[] = [];
  const textMatches = rawStr.matchAll(/\(([^()]+)\)\s*Tj/g);
  for (const m of textMatches) {
    if (m[1]) textBlocks.push(m[1]);
  }
  if (textBlocks.length > 0) {
    return textBlocks.join(' ');
  }

  return buffer.toString('utf-8');
}

/**
 * 自动识别年份
 */
export function detectExamYear(text: string, fallbackYear = 2027): number {
  const match = text.match(/(20\d{2})\s*(?:年|全国硕士研究生招生考试|英语（二）|英语二)/i) ||
                text.match(/(20\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    if (y >= 2010 && y <= 2040) return y;
  }
  return fallbackYear;
}

/**
 * 检查并保存解析数据至文件，支持英语一与英语二分表隔离存储
 */
export function saveParsedExamData(
  year: number, 
  data: { reading?: any; translation?: any; writing?: any }, 
  rootDir: string
): string[] {
  const saved: string[] = [];
  const contentBase = path.resolve(rootDir, 'src', 'content', 'eng2');

  // 1. 保存 Reading
  if (data.reading && Array.isArray(data.reading.passages) && data.reading.passages.length > 0) {
    const readingDir = path.join(contentBase, 'reading');
    if (!fs.existsSync(readingDir)) fs.mkdirSync(readingDir, { recursive: true });
    const target = path.join(readingDir, `${year}.json`);
    const payload = {
      year,
      title: data.reading.title || `考研英语 ${year} 年 · 阅读理解 Part A (Text 1-4)`,
      intro: data.reading.intro || '共 4 篇文章,每篇 5 道多选题,共 20 题 × 2 分 = 40 分。',
      total_points: 40,
      per_question_points: 2,
      passages: data.reading.passages,
    };
    fs.writeFileSync(target, JSON.stringify(payload, null, 2), 'utf-8');
    saved.push(`eng2/reading/${year}.json`);
  }

  // 2. 保存 Translation
  if (data.translation && (data.translation.source || Array.isArray(data.translation.slices))) {
    const transDir = path.join(contentBase, 'translation');
    if (!fs.existsSync(transDir)) fs.mkdirSync(transDir, { recursive: true });
    const target = path.join(transDir, `${year}.json`);
    const payload = {
      year,
      source: data.translation.source || '',
      refZh: data.translation.refZh || '',
      slices: data.translation.slices || [],
    };
    fs.writeFileSync(target, JSON.stringify(payload, null, 2), 'utf-8');
    saved.push(`eng2/translation/${year}.json`);
  }

  // 3. 保存 Writing
  if (data.writing && (data.writing.prompt || data.writing.partB || data.writing.chartOption || data.writing.pictureInfo)) {
    const writingDir = path.join(contentBase, 'writing');
    if (!fs.existsSync(writingDir)) fs.mkdirSync(writingDir, { recursive: true });
    const target = path.join(writingDir, `${year}.json`);
    const payload = {
      year,
      title: data.writing.title || `${year}年英语写作`,
      prompt: data.writing.prompt || data.writing.partB || '',
      partA: data.writing.partA || '',
      partB: data.writing.partB || data.writing.prompt || '',
      chartType: data.writing.chartType || 'bar',
      chartOption: data.writing.chartOption,
      pictureInfo: data.writing.pictureInfo,
    };
    fs.writeFileSync(target, JSON.stringify(payload, null, 2), 'utf-8');
    saved.push(`eng2/writing/${year}.json`);
  }

  return saved;
}
