// React component for single-step onboarding page for users registered via social OAuth.
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/auth/services/auth.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { toast } from '@/components/ui/toast';

/** React component rendering single-step social onboarding page. */
export default function OnboardingPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [acceptTos, setAcceptTos] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTos) {
      toast.error(
        'Terms Required',
        'Please accept the Terms of Service to continue.',
      );
      return;
    }

    if (mode === 'create' && !institutionName.trim()) {
      toast.error(
        'Institution Name Required',
        'Please provide a name for your institution.',
      );
      return;
    }

    if (mode === 'join' && !joinCode.trim()) {
      toast.error(
        'Join Code Required',
        'Please provide an institution join code.',
      );
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.onboardOAuth({
        institutionName:
          mode === 'create' ? institutionName.trim() : undefined,
        institutionCode:
          mode === 'create' && institutionCode.trim()
            ? institutionCode.trim()
            : undefined,
        joinCode: mode === 'join' ? joinCode.trim() : undefined,
      });

      if (res.user && (res.accessToken || accessToken)) {
        setAuth(res.user, res.accessToken || accessToken || '');
        toast.success(
          'Onboarding Complete',
          `Welcome to Slotly, ${res.user.name}`,
        );
        router.push('/dashboard');
      }
    } catch {
      // apiClient maps the error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Complete your institution profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded border border-[#232323] p-1 bg-[#0A0A0A]">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
              mode === 'create'
                ? 'bg-[#1a1a1a] text-[#FAFAFA] border border-[#333]'
                : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
            }`}
          >
            Create Institution
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
              mode === 'join'
                ? 'bg-[#1a1a1a] text-[#FAFAFA] border border-[#333]'
                : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
            }`}
          >
            Join Institution
          </button>
        </div>

        {mode === 'create' ? (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Institution Name
              </label>
              <Input
                placeholder="e.g. Stanford University"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-[#8A8A8A]">
                Short Code{' '}
                <span className="text-[#8A8A8A] font-normal lowercase">
                  (optional, up to 10 chars)
                </span>
              </label>
              <Input
                placeholder="e.g. STANFORD"
                value={institutionCode}
                onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-[#8A8A8A]">
              Institution Join Code
            </label>
            <Input
              placeholder="e.g. INST-88214"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              required
            />
            <p className="text-[11px] font-mono text-[#8A8A8A]">
              Ask your institution administrator for their join code.
            </p>
          </div>
        )}

        <div className="pt-2">
          <label className="flex items-start gap-2.5 text-xs text-[#8A8A8A] cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTos}
              onChange={(e) => setAcceptTos(e.target.checked)}
              className="mt-0.5 rounded border-[#232323] bg-[#111] text-[#FACC15] focus:ring-0"
              required
            />
            <span>
              I accept the{' '}
              <span className="text-[#FAFAFA] underline">Terms of Service</span>{' '}
              and Privacy Policy for academic scheduling.
            </span>
          </label>
        </div>

        <Button
          variant="primary"
          className="w-full font-mono uppercase tracking-wider"
          disabled={loading}
        >
          {loading ? 'Finalizing Profile...' : 'Complete Setup'}
        </Button>
      </form>
    </AuthLayout>
  );
}
