// React component for login page supporting credentials and OAuth sign-in.
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/services/auth.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { toast } from '@/components/ui/toast';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { getOAuthErrorMessage } from '@/features/auth/utils/oauth-errors';

function OAuthErrorBanner() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const errorMessage = getOAuthErrorMessage(errorParam);

  useEffect(() => {
    if (errorParam) {
      // Clean query parameter from URL without triggering a reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [errorParam]);

  if (!errorMessage) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-4 rounded border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs font-mono text-[#EF4444]"
    >
      {errorMessage}
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setMfaPending = useAuthStore((s) => s.setMfaPending);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.mfaRequired) {
        setMfaPending(res.mfaToken, email);
        toast.info(
          'Two-Factor Required',
          'Please enter your authenticator code.',
        );
        router.push('/mfa');
        return;
      }

      if (res.user && res.accessToken) {
        setAuth(res.user, res.accessToken);
        toast.success('Signed in', `Welcome back, ${res.user.name}`);
        router.push('/dashboard');
      }
    } catch {
      // toast error is already mapped by apiClient
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <OAuthErrorBanner />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase text-[#8A8A8A]">
            Email address
          </label>
          <Input
            type="email"
            placeholder="name@institution.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#3B82F6] hover:underline font-mono"
            >
              Forgot?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <Button
          variant="primary"
          className="w-full font-mono uppercase tracking-wider"
          disabled={loading}
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </Button>
      </form>

      <OAuthButtons mode="login" />

      <div className="mt-4 pt-4 border-t border-[#232323] text-center text-xs text-[#8A8A8A]">
        Need an account?{' '}
        <Link
          href="/register"
          className="text-[#FAFAFA] underline hover:text-[#FACC15]"
        >
          Register
        </Link>
      </div>
    </>
  );
}

/** React component rendering login page. */
export default function LoginPage() {
  return (
    <AuthLayout subtitle="Sign in to your institution account">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
