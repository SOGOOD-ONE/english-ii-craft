import http from './axios';

export interface DeviceConfig {
  device_id: string;
  ai_base_url?: string;
  ai_api_key?: string;
  ai_model?: string;
  mastery_required?: number;
  daily_new_limit?: number;
}

export interface ExamParsedResponse {
  success: boolean;
  year: number;
  detected_year: number;
  saved_files: string[];
  summary: {
    has_reading: boolean;
    reading_passages_count: number;
    has_translation: boolean;
    translation_slices_count: number;
    has_writing: boolean;
    writing_chart_type?: string;
  };
  data: {
    reading?: any;
    translation?: any;
    writing?: any;
  };
  raw_text_length: number;
  message: string;
}

export interface ExamOverviewResponse {
  total_years: number;
  years: Array<{
    year: number;
    reading: { exists: boolean; count: number };
    translation: { exists: boolean; slices: number };
    writing: { exists: boolean; chartType: string };
    complete: boolean;
  }>;
}

export const api = {
  device: {
    register: () => http.post<DeviceConfig>('/api/v1/device/register', {}).then(r => r.data),
    getMe: () => http.get<DeviceConfig>('/api/v1/device/me').then(r => r.data),
    patchMe: (partial: Partial<DeviceConfig>) =>
      http.patch<DeviceConfig>('/api/v1/device/me', partial).then(r => r.data),
  },
  exam: {
    years: (module: 'writing' | 'translation' | 'reading' | 'cloze' | 'newtype_b' = 'writing', subject = 'eng2') =>
      http.get<Array<{ year: number; module: string; title: string; has_ref_zh: boolean; has_chart: boolean; note: string }>>('/api/v1/exam/years', { params: { module, subject } }).then(r => r.data),
    content: <T = any>(module: 'writing' | 'translation' | 'reading', year: number, subject = 'eng2') =>
      http.get<T>(`/api/v1/exam/content/${module}/${year}`, { params: { subject } }).then(r => r.data),
    translate: (paragraphs: string[], meta?: { year?: number; passageId?: string; subject?: string }) =>
      http.post<{ translations: string[]; error: string }>('/api/v1/exam/translate', { paragraphs, ...meta }).then(r => r.data),
    uploadAndParse: (formData: FormData) =>
      http.post<ExamParsedResponse>('/api/v1/exam/upload-and-parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    parseText: (p: { text: string; year?: number; auto_save?: boolean; subject?: string }) =>
      http.post<ExamParsedResponse>('/api/v1/exam/upload-and-parse', p).then(r => r.data),
    importGithub: (p: { url: string; subject?: string; year?: number }) =>
      http.post<ExamParsedResponse>('/api/v1/exam/import-github', p).then(r => r.data),
    saveYear: (p: { year: number; reading?: any; translation?: any; writing?: any; subject?: string }) =>
      http.post<{ success: boolean; year: number; saved_files: string[]; message: string }>('/api/v1/exam/save-year', p).then(r => r.data),
    overview: (subject = 'eng2') =>
      http.get<ExamOverviewResponse>('/api/v1/exam/all-years-overview', { params: { subject } }).then(r => r.data),
    deleteYear: (year: number) =>
      http.delete<{ success: boolean; year: number; deleted: string[] }>(`/api/v1/exam/year/${year}`).then(r => r.data),
  },
  vocab: {
    lookupWord: (word: string, context = '') =>
      http.post<{ id: number; lemma: string; phonetic: string; senses: any[]; collocations: string[]; from_cache: boolean }>(
        '/api/v1/vocab/words/lookup', { word, context }
      ).then(r => r.data),
    cardsList: (params: { due?: 0 | 1; mastered?: 0 | 1; status?: 'new' | 'due' | 'mastered' | 'all'; page_size?: number } = {}) =>
      http.get<{ count: number; results: any[] }>('/api/v1/vocab/cards/', { params }).then(r => r.data),
    cardsCreate: (p: any) => http.post<any>('/api/v1/vocab/cards/', p).then(r => r.data),
    cardsDelete: (id: number) => http.delete(`/api/v1/vocab/cards/${id}/`).then(r => r.data),
    cardsClearAll: () => http.delete<{ success: boolean; message: string; deleted_count: number }>('/api/v1/vocab/cards/clear-all/').then(r => r.data),
    cardsDeleteBySource: (source_path: string) =>
      http.delete<{ success: boolean; message: string; deleted_count: number }>('/api/v1/vocab/cards/by-source/', { params: { source_path } }).then(r => r.data),
    cardsReview: (id: number, rating: 'Again' | 'Hard' | 'Good' | 'Easy') =>
      http.post<any>(`/api/v1/vocab/cards/${id}/review/`, { rating }).then(r => r.data),
    importBatch: (items: Array<{ word: string; phonetic?: string; definition?: string; pos?: string; context_sentence?: string }>, source_path = '自定义导入词库') =>
      http.post<{ success: boolean; imported_count: number; skipped_count: number; total_processed: number; message: string }>(
        '/api/v1/vocab/cards/import-batch', { items, source_path }
      ).then(r => r.data),
  },
  writing: {
    aiConfig: () => http.get<{ available: boolean; effective_base: string; effective_model: string; using_user_key: boolean }>('/api/v1/writing/ai-config/').then(r => r.data),
    reviewCreate: (p: { year: number; essay: string; chart_info?: string }) =>
      http.post<any>('/api/v1/writing/reviews/', p).then(r => r.data),
    reviewsList: (params?: { year?: number; page?: number }) =>
      http.get<{ count: number; results: any[] }>('/api/v1/writing/reviews/', { params }).then(r => r.data),
  },
  translation: {
    attemptCreate: (p: { year: number; slice_id: string; source_text?: string; user_translation: string }) =>
      http.post<any>('/api/v1/translation/attempts', p).then(r => r.data),
    attemptsList: (params?: { year?: number; slice_id?: string }) =>
      http.get<{ count: number; results: any[] }>('/api/v1/translation/attempts', { params }).then(r => r.data),
  },
};

export default api;
