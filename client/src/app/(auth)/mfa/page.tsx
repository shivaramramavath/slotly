// React component for page.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/services/auth.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { toast } from '@/components/ui/toast';

/** React component rendering mfa challenge page. */
export default function MfaChallengePage() {
  const router = useRouter();
  const mfaToken = useAuthStore((s) => s.mfaToken);
  const mfaEmail = useAuthStore((s) => s.mfaEmail);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [useRecovery, setUseRecovery] = useState(false);
  const [email, setEmail] = useState(mfaEmail || '');
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (useRecovery) {
        if (!email.trim() || !recoveryCode.trim()) return;
        const res = await authApi.recoveryMfa({
          email: email.trim(),
          recoveryCode: recoveryCode.trim(),
        });
        if (res.user && res.accessToken) {
          setAuth(res.user, res.accessToken);
          toast.warning(
            'Recovery Code Consumed',
            'Logged in via emergency recovery code. Please regenerate backup codes.',
          );
          router.push('/dashboard');
        }
      } else {
        if (!code.trim()) return;
        const res = await authApi.verifyMfa({
          code: code.trim(),
          mfaToken: mfaToken || undefined,
        });
        if (res.accessToken && res.user) {
          setAuth(res.user, res.accessToken);
          toast.success('MFA Verified', 'Authentication successful.');
          router.push('/dashboard');
        } else {
          toast.success('MFA Verified', res.message || 'MFA confirmed.');
          router.push('/login');
        }
      }
    } catch {
      // toast error handled by apiClient
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitle={
        useRecovery
          ? 'Enter your email and one of your 10-character emergency recovery codes'
          : 'Enter the 6-digit code from your authenticator app'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {useRecovery && (
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">Account Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@institution.edu"
              required
            />
          </div>
        )}

        {useRecovery ? (
          <div className="space-y-1.5 text-center">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              10-Character Recovery Code
            </label>
            <Input
              placeholder="A1B2C3D4E5"
              className="text-center font-mono text-lg tracking-widest uppercase"
              maxLength={10}
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value.toUpperCase().trim())}
              required
              autoFocus
            />
          </div>
        ) : (
          <div className="space-y-1.5 text-center">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              6-Digit Authenticator Code
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
          </div>
        )}

        <Button
          variant="primary"
          className="w-full font-mono uppercase tracking-wider"
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </Button>
      </form>

      <div className="mt-4 pt-4 border-t border-[#232323] text-center text-xs text-[#8A8A8A]">
        {useRecovery ? (
          <button
            type="button"
            onClick={() => setUseRecovery(false)}
            className="text-[#3B82F6] hover:underline cursor-pointer font-mono"
          >
            ← Use Authenticator Code
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setUseRecovery(true)}
            className="text-[#8A8A8A] hover:text-[#FAFAFA] underline cursor-pointer font-mono"
          >
            Lost access to authenticator? Use Recovery Code
          </button>
        )}
      </div>
    </AuthLayout>
  );
}
