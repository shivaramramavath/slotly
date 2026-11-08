// React component for auth-provider.
'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/auth.api';
import { StepUpDialog } from './step-up-dialog';
import { subscribeToAuthEvents } from '../services/cross-tab-sync';

interface AuthProviderProps {
  children: React.ReactNode;
}

/** React component rendering auth provider. */
export function AuthProvider({ children }: AuthProviderProps) {
  const { status, setAuth, clearAuth, setStatus } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (status !== 'idle') return;
      setStatus('loading');

      try {
        const res = await authApi.refresh();
        if (isMounted) {
          if (res.accessToken && res.user) {
            setAuth(res.user, res.accessToken);
          } else {
            clearAuth();
          }
        }
      } catch {
        if (isMounted) {
          clearAuth();
        }
      }
    }

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, [status, setAuth, clearAuth, setStatus]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthEvents((msg) => {
      if (msg.type === 'logout') {
        clearAuth();
      } else if (msg.type === 'login' || msg.type === 'token_refreshed') {
        if (status === 'unauthenticated' || status === 'idle') {
          void authApi.refresh().then((res) => {
            if (res.accessToken && res.user) {
              setAuth(res.user, res.accessToken);
            }
          }).catch(() => {});
        }
      }
    });
    return () => unsubscribe();
  }, [clearAuth, setAuth, status]);

  return (
    <>
      {children}
      <StepUpDialog />
    </>
  );
}
