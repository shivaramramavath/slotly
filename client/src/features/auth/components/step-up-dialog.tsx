// React component for step-up verification supporting password, TOTP, and email code methods.
'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/auth.api';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

/** React component rendering step up dialog with password, TOTP, and email OTP options. */
export function StepUpDialog() {
  const stepUpRequired = useAuthStore((s) => s.stepUpRequired);
  const setStepUpRequired = useAuthStore((s) => s.setStepUpRequired);
  const user = useAuthStore((s) => s.user);

  const [mode, setMode] = useState<'password' | 'totp' | 'email_otp'>('password');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleClose = () => {
    setStepUpRequired(false);
    setValue('');
  };

  const handleSendEmailOtp = async () => {
    if (!user?.email) return;
    setSendingEmail(true);
    try {
      await authApi.resendEmail({
        email: user.email,
      });
      toast.success(
        'Code Sent',
        `A verification code was sent to ${user.email}.`,
      );
    } catch {
      // toast error handled by apiClient
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    try {
      if (mode === 'password') {
        await authApi.stepUp({ method: 'password', password: value });
      } else if (mode === 'totp') {
        await authApi.stepUp({ method: 'totp', code: value });
      } else {
        await authApi.stepUp({ method: 'email_otp', code: value });
      }

      toast.success('Identity confirmed', 'Step-up authentication successful.');
      setStepUpRequired(false);
      setValue('');
    } catch {
      toast.error('Authentication failed', 'Invalid password or verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={stepUpRequired} onOpenChange={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Confirm Your Identity</DialogTitle>
          <DialogDescription>
            This action requires recent authentication. Please verify your credentials
            to proceed with sensitive security changes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex gap-2 border-b border-[#232323] pb-2">
            <button
              type="button"
              onClick={() => {
                setMode('password');
                setValue('');
              }}
              className={`text-xs uppercase tracking-wider font-mono px-3 py-1.5 rounded transition-colors ${
                mode === 'password'
                  ? 'bg-[#FACC15] text-black font-semibold'
                  : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('totp');
                setValue('');
              }}
              className={`text-xs uppercase tracking-wider font-mono px-3 py-1.5 rounded transition-colors ${
                mode === 'totp'
                  ? 'bg-[#FACC15] text-black font-semibold'
                  : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
              }`}
            >
              Authenticator App
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('email_otp');
                setValue('');
              }}
              className={`text-xs uppercase tracking-wider font-mono px-3 py-1.5 rounded transition-colors ${
                mode === 'email_otp'
                  ? 'bg-[#FACC15] text-black font-semibold'
                  : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
              }`}
            >
              Email Code
            </button>
          </div>

          {mode === 'password' && (
            <div>
              <label className="block text-xs font-mono text-[#8A8A8A] mb-1.5 uppercase">
                Account Password
              </label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                required
              />
            </div>
          )}

          {mode === 'totp' && (
            <div>
              <label className="block text-xs font-mono text-[#8A8A8A] mb-1.5 uppercase">
                6-Digit Authenticator Code
              </label>
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={value}
                onChange={(e) => setValue(e.target.value.trim())}
                autoFocus
                required
              />
            </div>
          )}

          {mode === 'email_otp' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-[#8A8A8A] uppercase">
                  Email Verification Code
                </label>
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={sendingEmail}
                  className="text-xs font-mono text-[#3B82F6] hover:underline disabled:opacity-50"
                >
                  {sendingEmail ? 'Sending...' : 'Send code to email'}
                </button>
              </div>
              <Input
                type="text"
                placeholder="6-digit email code"
                maxLength={6}
                value={value}
                onChange={(e) => setValue(e.target.value.trim())}
                autoFocus
                required
              />
              <p className="text-[11px] font-mono text-[#8A8A8A]">
                Sent to {user?.email || 'your registered email address'}.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
