import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  is_staff?: boolean;
  date_joined?: string;
}

export interface ProfileInfo {
  ai_base_url: string;
  ai_model: string;
  mastery_required: number;
  daily_new_limit: number;
  has_custom_key: boolean;
  ai_api_key_masked?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthState {
  tokens: AuthTokens | null;
  user: UserInfo | null;
  profile: ProfileInfo | null;
  // setters
  setAuth: (payload: AuthTokens & { user: UserInfo; profile: ProfileInfo }) => void;
  setTokens: (t: AuthTokens) => void;
  setMe: ({ user, profile }: { user?: UserInfo; profile?: ProfileInfo }) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      user: null,
      profile: null,
      setAuth: (payload) => {
        set({
          tokens: { access: payload.access, refresh: payload.refresh },
          user: payload.user,
          profile: payload.profile,
        });
      },
      setTokens: (t) => set({ tokens: t }),
      setMe: ({ user, profile }) => {
        set((s) => ({
          user: user ?? s.user,
          profile: profile ?? s.profile,
        }));
      },
      logout: () => set({ tokens: null, user: null, profile: null }),
      isAuthenticated: () => !!get().tokens?.access,
    }),
    { name: 'eii-craft-auth' }
  )
);
