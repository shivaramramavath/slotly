'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/services/auth.api';
import { toast } from '@/components/ui/toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSubmitted(true);
      toast.info('Request Dispatched', 'Password reset instructions have been sent if an account matches.');
    } catch {
      // toast error handled by apiClient
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Reset your account password">
      {submitted ? (
        <div className="space-y-4">
          <div className="p-4 rounded border border-[#232323] bg-[#111111] text-xs font-mono text-[#FAFAFA] space-y-2">
            <p className="text-[#22C55E]">✓ Request received.</p>
            <p className="text-[#8A8A8A]">
              If an account is associated with <span className="text-[#FAFAFA]">{email}</span>, a secure reset token has been dispatched. Check your inbox and spam folder.
            </p>
          </div>
          <Link href="/reset-password">
            <Button variant="outline" className="w-full font-mono uppercase tracking-wider text-xs">
              I have a reset token →
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">Account Email</label>
            <Input
              type="email"
              placeholder="name@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <Button
            variant="primary"
            className="w-full font-mono uppercase tracking-wider"
            disabled={loading}
          >
            {loading ? 'Sending Request...' : 'Send Reset Link'}
          </Button>
        </form>
      )}

      <div className="mt-4 pt-4 border-t border-[#232323] text-center text-xs text-[#8A8A8A]">
        Remember password?{' '}
        <Link href="/login" className="text-[#FAFAFA] underline hover:text-[#FACC15]">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
