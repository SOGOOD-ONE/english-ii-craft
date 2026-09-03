import http from './axios';

export interface DeviceConfig {
  device_id: string;
  ai_base_url?: string;
  ai_api_key?: string;
  ai_model?: string;
  mastery_required?: number;
  daily_new_limit?: number;
}

export const api = {
  device: {
    register: () => http.post<DeviceConfig>('/api/v1/device/register', {}).then(r => r.data),
    getMe: () => http.get<DeviceConfig>('/api/v1/device/me').then(r => r.data),
    patchMe: (partial: Partial<DeviceConfig>) =>
      http.patch<DeviceConfig>('/api/v1/device/me', partial).then(r => r.data),
  },
  exam: {
    years: (module: 'writing' | 'translation' | 'reading' | 'cloze' | 'newtype_b' = 'writing') =>
      http.get<Array<{ year: number; module: string; title: string; has_ref_zh: boolean; has_chart: boolean; note: string }>>('/api/v1/exam/years', { params: { module } }).then(r => r.data),
    content: <T = any>(module: 'writing' | 'translation' | 'reading', year: number) =>
      http.get<T>(`/api/v1/exam/content/${module}/${year}`).then(r => r.data),
    translate: (paragraphs: string[]) =>
      http.post<{ translations: string[]; error: string }>('/api/v1/exam/translate', { paragraphs }).then(r => r.data),
  },
  vocab: {
    lookupWord: (word: string, context = '') =>
      http.post<{ id: number; lemma: string; phonetic: string; senses: any[]; collocations: string[]; from_cache: boolean }>(
        '/api/v1/vocab/words/lookup', { word, context }
      ).then(r => r.data),
    cardsList: (params: { due?: 0 | 1; mastered?: 0 | 1 } = {}) =>
      http.get<any[]>('/api/v1/vocab/cards/', { params }).then(r => r.data),
    cardsCreate: (p: any) => http.post<any>('/api/v1/vocab/cards/', p).then(r => r.data),
    cardsDelete: (id: number) => http.delete(`/api/v1/vocab/cards/${id}/`).then(r => r.data),
    cardsReview: (id: number, rating: 'Again' | 'Hard' | 'Good' | 'Easy') =>
      http.post<any>(`/api/v1/vocab/cards/${id}/review/`, { rating }).then(r => r.data),
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
