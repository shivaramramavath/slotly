// Zustand store managing application state for auth.store.
import { create } from 'zustand';
import type { UserDto } from '@slotly/contracts';
import { setAccessToken } from '@/lib/api-client';
import { executeLogoutCleanup } from '../services/logout-registry';

/** Type alias for auth status. */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  status: AuthStatus;
  isMfaRequired: boolean;
  mfaToken: string | null;
  mfaEmail: string | null;
  stepUpRequired: boolean;

  setAuth: (user: UserDto, token: string) => void;
  setUser: (user: UserDto) => void;
  clearAuth: () => void;
  setStatus: (status: AuthStatus) => void;
  setMfaPending: (token?: string, email?: string) => void;
  clearMfaPending: () => void;
  setStepUpRequired: (required: boolean) => void;
}

/** Zustand store managing use auth store state. */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  isMfaRequired: false,
  mfaToken: null,
  mfaEmail: null,
  stepUpRequired: false,

  setAuth: (user, token) => {
    setAccessToken(token);
    if (typeof document !== 'undefined') {
      let sid = '';
      try {
        const payload = token ? JSON.parse(atob(token.split('.')[1] || '')) : {};
        if (typeof payload?.sid === 'string' && payload.sid.startsWith('ses_')) {
          sid = payload.sid;
        }
      } catch {
        // ignore malformed token payload
      }
      document.cookie = `slotly_session=${sid || '1'}; path=/; max-age=604800; SameSite=Lax`;
    }
    set({
      user,
      accessToken: token,
      status: 'authenticated',
      isMfaRequired: false,
      mfaToken: null,
      mfaEmail: null,
    });
  },

  setUser: (user) => {
    const token = get().accessToken;
    if (typeof document !== 'undefined' && user) {
      let sid = '';
      try {
        const payload = token ? JSON.parse(atob(token.split('.')[1] || '')) : {};
        if (typeof payload?.sid === 'string' && payload.sid.startsWith('ses_')) {
          sid = payload.sid;
        }
      } catch {
        // ignore malformed token payload
      }
      document.cookie = `slotly_session=${sid || '1'}; path=/; max-age=604800; SameSite=Lax`;
    }
    set({ user });
  },

  clearAuth: () => {
    setAccessToken(null);
    if (typeof document !== 'undefined') {
      document.cookie = 'slotly_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    void executeLogoutCleanup();
    set({
      user: null,
      accessToken: null,
      status: 'unauthenticated',
      isMfaRequired: false,
      mfaToken: null,
      mfaEmail: null,
      stepUpRequired: false,
    });
  },

  setStatus: (status) => set({ status }),

  setMfaPending: (token, email) => {
    set({
      isMfaRequired: true,
      mfaToken: token || null,
      mfaEmail: email || null,
      status: 'unauthenticated',
    });
  },

  clearMfaPending: () => {
    set({
      isMfaRequired: false,
      mfaToken: null,
      mfaEmail: null,
    });
  },

  setStepUpRequired: (required) => set({ stepUpRequired: required }),
}));
