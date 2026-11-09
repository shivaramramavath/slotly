// React component for auth-provider.
'use client';

import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/auth.api';
import { StepUpDialog } from './step-up-dialog';
import { subscribeToAuthEvents } from '../services/cross-tab-sync';

interface AuthProviderProps {
  children: React.ReactNode;
}

/** React component rendering auth provider. */
export function AuthProvider({ children }: AuthProviderProps) {
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    async function initAuth() {
      const currentStatus = useAuthStore.getState().status;
      if (currentStatus !== 'idle') return;

      useAuthStore.getState().setStatus('loading');

      try {
        const res = await authApi.refresh();
        if (res?.accessToken && res?.user) {
          useAuthStore.getState().setAuth(res.user, res.accessToken);
        } else {
          useAuthStore.getState().clearAuth();
        }
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }

    void initAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthEvents((msg) => {
      if (msg.type === 'logout') {
        useAuthStore.getState().clearAuth();
      } else if (msg.type === 'login' || msg.type === 'token_refreshed') {
        const currentStatus = useAuthStore.getState().status;
        if (currentStatus === 'unauthenticated' || currentStatus === 'idle') {
          void authApi.refresh().then((res) => {
            if (res?.accessToken && res?.user) {
              useAuthStore.getState().setAuth(res.user, res.accessToken);
            }
          }).catch(() => {});
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {children}
      <StepUpDialog />
    </>
  );
}
