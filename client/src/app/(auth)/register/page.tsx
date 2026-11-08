// React component for register page supporting credentials and OAuth sign-up.
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

function RegisterForm() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 12) {
      toast.error('Invalid Password', 'Password must be at least 12 characters.');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        name,
        email,
        password,
        institutionName: institutionName.trim() || undefined,
      });

      toast.success(
        'Account Registered',
        'Verification code has been sent to your email.',
      );
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      // toast error handled by apiClient
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
            Full Name
          </label>
          <Input
            placeholder="Prof. Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
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
          <label className="text-xs font-mono uppercase text-[#8A8A8A]">
            Password
          </label>
          <Input
            type="password"
            placeholder="At least 12 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={12}
          />
          <p className="text-[11px] font-mono text-[#8A8A8A]">
            Must be at least 12 characters and not a common dictionary word.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase text-[#8A8A8A]">
            Institution Name{' '}
            <span className="text-[#8A8A8A] font-normal lowercase">
              (optional)
            </span>
          </label>
          <Input
            placeholder="e.g. Stanford University"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          className="w-full font-mono uppercase tracking-wider"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Create Account'}
        </Button>
      </form>

      <OAuthButtons mode="login" />

      <div className="mt-4 pt-4 border-t border-[#232323] text-center text-xs text-[#8A8A8A]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-[#FAFAFA] underline hover:text-[#FACC15]"
        >
          Sign In
        </Link>
      </div>
    </>
  );
}

/** React component rendering register page. */
export default function RegisterPage() {
  return (
    <AuthLayout subtitle="Create your designer or institution account">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
