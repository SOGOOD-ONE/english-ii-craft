// ============================================================
// AI 批改接口(客户端直连大模型 API)
// ============================================================
// 兼容 OpenAI / DeepSeek / Moonshot 等兼容 OpenAI 协议的接口。
// 用户在 /settings 配置 baseURL、apiKey、model。
// ============================================================

import type { AiReviewReport } from '@/types';

export interface AiConfig {
  baseURL: string; // 如 https://api.deepseek.com/v1
  apiKey: string;
  model: string; // 如 deepseek-chat
}

const ESSAY_PROMPT = `你是一位考研英语阅卷专家。请根据考研英语二大作文官方评分维度,对用户作文进行批改。
评分维度(满分15):
- 数据描述完整性 4分
- 原因论证深度 4分
- 词汇语法丰富度 4分
- 拼写准确度 3分
请严格以 JSON 返回,不要任何多余文字,格式:
{"score":数字,"total":15,"dimensions":{"dataDescription":数字,"reasoning":数字,"vocabulary":数字,"grammar":数字},"suggestions":["建议1","建议2"]}`;

export async function reviewEssay(
  essay: string,
  chartContext: string,
  cfg: AiConfig
): Promise<AiReviewReport> {
  const messages = [
    {
      role: 'system',
      content: ESSAY_PROMPT,
    },
    {
      role: 'user',
      content: `图表语境:\n${chartContext}\n\n用户作文:\n${essay}`,
    },
  ];

  const res = await fetch(`${cfg.baseURL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`AI 接口错误: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content) as AiReviewReport;
}

// ---------- settings 持久化(localStorage) ----------
const AI_CFG_KEY = 'eii_ai_config';

export function loadAiConfig(): AiConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AI_CFG_KEY);
  return raw ? (JSON.parse(raw) as AiConfig) : null;
}

export function saveAiConfig(cfg: AiConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AI_CFG_KEY, JSON.stringify(cfg));
}
