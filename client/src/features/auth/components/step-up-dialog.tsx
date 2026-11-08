// React component for step-up-dialog.
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

/** React component rendering step up dialog. */
export function StepUpDialog() {
  const stepUpRequired = useAuthStore((s) => s.stepUpRequired);
  const setStepUpRequired = useAuthStore((s) => s.setStepUpRequired);

  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setStepUpRequired(false);
    setValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    try {
      await authApi.stepUp(
        mode === 'password' ? { password: value } : { code: value },
      );
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
            This action requires recent authentication. Please enter your account
            password or 6-digit authenticator code to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex gap-2 border-b border-[#232323] pb-2">
            <button
              type="button"
              onClick={() => setMode('password')}
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
              onClick={() => setMode('code')}
              className={`text-xs uppercase tracking-wider font-mono px-3 py-1.5 rounded transition-colors ${
                mode === 'code'
                  ? 'bg-[#FACC15] text-black font-semibold'
                  : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
              }`}
            >
              TOTP Code
            </button>
          </div>

          {mode === 'password' ? (
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
          ) : (
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
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose} disabled={loading}>
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
