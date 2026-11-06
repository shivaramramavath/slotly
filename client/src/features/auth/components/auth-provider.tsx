'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/auth.api';
import { StepUpDialog } from './step-up-dialog';

interface AuthProviderProps {
  children: React.ReactNode;
}

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

  return (
    <>
      {children}
      <StepUpDialog />
    </>
  );
}
