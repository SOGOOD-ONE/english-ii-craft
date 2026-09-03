import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';

const http = axios.create({
  // 开发阶段走 vite 代理 /api → localhost:8000
  // 生产: 配置 VITE_API_BASE_URL 环境变量,如 https://craft.example.com
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) || '/',
  timeout: 45000,
  withCredentials: false,
});

function attachAuthHeader(config: InternalAxiosRequestConfig) {
  const s = useAuthStore.getState();
  if (s.tokens?.access && !config.headers.get('Authorization')) {
    config.headers.set('Authorization', `Bearer ${s.tokens.access}`);
  }
  return config;
}

http.interceptors.request.use(attachAuthHeader);

// 401 自动用 refresh 续 access,再重试一次原请求(最多重试 1 次)
let refreshingPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      const tokens = useAuthStore.getState().tokens;
      if (!tokens?.refresh) {
        useAuthStore.getState().logout();
        throw new AxiosError('No refresh token', '401');
      }
      try {
        const resp = await axios.post('/api/v1/auth/token/refresh', { refresh: tokens.refresh }, {
          baseURL: http.defaults.baseURL,
        });
        const next: { access: string; refresh?: string } = resp.data;
        useAuthStore.getState().setTokens({
          access: next.access,
          refresh: next.refresh || tokens.refresh,
        });
        return next.access;
      } catch (err) {
        useAuthStore.getState().logout();
        throw err;
      } finally {
        refreshingPromise = null;
      }
    })();
  }
  return refreshingPromise;
}

http.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const status = err.response?.status;
    const req = err.config as InternalAxiosRequestConfig & { __retried?: boolean };
    if (status === 401 && !req.__retried) {
      try {
        const access = await refreshAccessToken();
        req.headers.set('Authorization', `Bearer ${access}`);
        req.__retried = true;
        return http.request(req);
      } catch {
        // 自动 logout + 抛
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export default http;
