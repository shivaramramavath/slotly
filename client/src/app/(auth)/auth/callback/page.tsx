// React component for OAuth callback landing page handling token exchange verification and routing.
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/features/auth/services/auth.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthLayout } from '@/components/layouts/auth-layout';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setMfaPending = useAuthStore((s) => s.setMfaPending);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleExchange() {
      const errorParam = searchParams.get('error');
      if (errorParam) {
        router.replace(`/login?error=${encodeURIComponent(errorParam)}`);
        return;
      }

      const nextParam = searchParams.get('next');
      // Sanitize next parameter: must be relative in-app path starting with a single '/'
      let destination = '/dashboard';
      if (
        nextParam &&
        nextParam.startsWith('/') &&
        !nextParam.startsWith('//') &&
        !nextParam.includes('\\')
      ) {
        destination = nextParam;
      }

      try {
        const res = await authApi.refresh();

        if (!isMounted) return;

        if (res.mfaRequired) {
          setMfaPending(res.mfaToken, res.user?.email);
          router.replace('/mfa');
          return;
        }

        if (res.user && res.accessToken) {
          setAuth(res.user, res.accessToken);

          if (res.user.status === 'pending_onboarding') {
            router.replace('/onboarding');
            return;
          }

          router.replace(destination);
        } else {
          router.replace('/login?error=oauth_state_invalid');
        }
      } catch {
        if (isMounted) {
          setErrorStatus('Failed to finalize authentication.');
          router.replace('/login?error=oauth_state_invalid');
        }
      }
    }

    void handleExchange();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, setAuth, setMfaPending]);

  return (
    <div
      className="space-y-6 text-center"
      role="status"
      aria-live="polite"
      aria-label="Signing you in"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#232323] bg-[#111]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FAFAFA] border-t-transparent" />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-mono uppercase tracking-wider text-[#FAFAFA]">
          Signing you in...
        </h2>
        <p className="text-xs text-[#8A8A8A]">
          Verifying your credentials and establishing a secure session.
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-3/4 mx-auto bg-[#1a1a1a]" />
        <Skeleton className="h-4 w-1/2 mx-auto bg-[#1a1a1a]" />
      </div>

      {errorStatus && (
        <p className="text-xs font-mono text-[#EF4444]">{errorStatus}</p>
      )}
    </div>
  );
}

/** React component rendering OAuth callback page. */
export default function OAuthCallbackPage() {
  return (
    <AuthLayout subtitle="Authenticating with provider">
      <Suspense
        fallback={
          <div className="space-y-4 py-8 text-center font-mono text-xs uppercase text-[#8A8A8A]">
            Initializing authentication...
          </div>
        }
      >
        <CallbackHandler />
      </Suspense>
    </AuthLayout>
  );
}
