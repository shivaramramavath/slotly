// React component for page.
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/services/auth.api';
import { toast } from '@/components/ui/toast';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;

    setLoading(true);
    try {
      await authApi.verifyEmail({ email: email.trim(), code: code.trim() });
      toast.success('Email Verified', 'Your email has been verified. You can now log in.');
      router.push('/login');
    } catch {
      // toast error handled by apiClient
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;

    setResending(true);
    try {
      await authApi.resendEmail({ email: email.trim() });
      toast.info('OTP Sent', 'A fresh verification code has been dispatched to your email.');
      setCooldown(60);
    } catch {
      // toast error handled by apiClient
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout subtitle="Verify your email with the 6-digit OTP code">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialEmail && (
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">Email address</label>
            <Input
              type="email"
              placeholder="name@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        <div className="space-y-1.5 text-center">
          <label className="text-xs font-mono uppercase text-[#8A8A8A]">
            Enter 6-digit OTP for {email || 'your account'}
          </label>
          <Input
            placeholder="000000"
            className="text-center font-mono text-xl tracking-widest"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            required
            autoFocus
          />
          {process.env.NODE_ENV !== 'production' && (
            <p className="text-[11px] font-mono text-[#8A8A8A] mt-1">
              Dev hint: check server logs or use code <code className="text-[#FACC15]">123456</code>
            </p>
          )}
        </div>

        <Button
          variant="primary"
          className="w-full font-mono uppercase tracking-wider"
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </Button>
      </form>

      <div className="mt-4 pt-4 border-t border-[#232323] text-center text-xs text-[#8A8A8A]">
        Didn&apos;t receive code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || !email}
          className={`font-mono transition-colors ${
            cooldown > 0 || !email
              ? 'text-[#8A8A8A] cursor-not-allowed'
              : 'text-[#3B82F6] hover:underline cursor-pointer'
          }`}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend OTP'}
        </button>
      </div>
    </AuthLayout>
  );
}

/** React component rendering verify email page. */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[#8A8A8A]">Loading verification...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
