import { useEffect, PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import api from '@/api';

/** 未登录跳 /login;登录成功后拉一次 /auth/me 同步最新 profile(比如用户在设置改了 Key) */
export default function ProtectedRoute({ children }: PropsWithChildren) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated());
  const tokens = useAuthStore(s => s.tokens);
  const setMe = useAuthStore(s => s.setMe);
  const loc = useLocation();

  useEffect(() => {
    let alive = true;
    if (!isAuthenticated) return;
    (async () => {
      try {
        const { user, profile } = await api.auth.me();
        if (alive) setMe({ user, profile });
      } catch (_) { /* 忽略,401 会被拦截器踢到登录 */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  }
  return <>{children}</>;
}
