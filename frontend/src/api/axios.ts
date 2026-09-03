import axios, { InternalAxiosRequestConfig } from 'axios';
import { getDeviceId } from '@/store/device';

const http = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) || '/',
  timeout: 45000,
  withCredentials: false,
});

function attachDeviceHeader(config: InternalAxiosRequestConfig) {
  const id = getDeviceId();
  if (id && !config.headers.get('X-Device-Id')) {
    config.headers.set('X-Device-Id', id);
  }
  return config;
}

http.interceptors.request.use(attachDeviceHeader);

export default http;