'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/services/auth.api';
import { toast } from '@/components/ui/toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !newPassword) return;

    if (newPassword.length < 12) {
      toast.error('Invalid Password', 'Password must be at least 12 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token: token.trim(),
        newPassword,
      });
      toast.success('Password Updated', 'Your password has been reset. Please sign in.');
      router.push('/login');
    } catch {
      // toast error handled by apiClient
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Set your new account password">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialToken && (
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">Reset Token</label>
            <Input
              placeholder="Paste one-time reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase text-[#8A8A8A]">New Password (min 12 chars)</label>
          <Input
            type="password"
            placeholder="At least 12 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={12}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase text-[#8A8A8A]">Confirm New Password</label>
          <Input
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={12}
          />
        </div>

        <Button
          variant="primary"
          className="w-full font-mono uppercase tracking-wider"
          disabled={loading}
        >
          {loading ? 'Updating Password...' : 'Update Password'}
        </Button>
      </form>

      <div className="mt-4 pt-4 border-t border-[#232323] text-center text-xs text-[#8A8A8A]">
        Remember password?{' '}
        <Link href="/login" className="text-[#FAFAFA] underline hover:text-[#FACC15]">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[#8A8A8A]">Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
