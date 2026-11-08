// React component rendering monochrome OAuth sign-in and registration buttons.
'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../services/auth.api';
import { GoogleMonochromeIcon, GitHubIcon } from './oauth-icons';
import { Skeleton } from '@/components/ui/skeleton';
import type { OAuthProviderKey } from '@slotly/contracts';

interface OAuthButtonsProps {
  mode?: 'login' | 'link';
  next?: string;
  dividerText?: string;
  className?: string;
}

interface ProviderMeta {
  key: OAuthProviderKey;
  label: string;
  ariaLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PROVIDERS: ProviderMeta[] = [
  {
    key: 'google',
    label: 'Google',
    ariaLabel: 'Continue with Google',
    icon: GoogleMonochromeIcon,
  },
  {
    key: 'github',
    label: 'GitHub',
    ariaLabel: 'Continue with GitHub',
    icon: GitHubIcon,
  },
];

/** React component rendering available OAuth login/link buttons. */
export function OAuthButtons({
  mode = 'login',
  next,
  dividerText = 'or continue with',
  className = '',
}: OAuthButtonsProps) {
  const [navigatingProvider, setNavigatingProvider] =
    useState<OAuthProviderKey | null>(null);

  const { data: providers, isLoading } = useQuery({
    queryKey: ['oauth-providers'],
    queryFn: () => authApi.getOAuthProviders(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`} aria-busy="true">
        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-[#232323]" />
          <span className="text-[11px] font-mono uppercase text-[#8A8A8A]">
            {dividerText}
          </span>
          <div className="h-px flex-1 bg-[#232323]" />
        </div>
        <Skeleton className="h-10 w-full rounded border border-[#232323] bg-[#111]" />
      </div>
    );
  }

  if (!providers) {
    return null;
  }

  const enabledProviders = PROVIDERS.filter((p) => {
    const list = providers?.providers ?? [];
    const info = list.find((item) => item.key === p.key);
    return Boolean(info?.enabled);
  });

  if (enabledProviders.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-[#232323]" />
        <span className="text-[11px] font-mono uppercase text-[#8A8A8A]">
          {dividerText}
        </span>
        <div className="h-px flex-1 bg-[#232323]" />
      </div>

      <div className="grid gap-2">
        {enabledProviders.map((provider) => {
          const Icon = provider.icon;
          const isNavigating = navigatingProvider === provider.key;
          const startUrl = authApi.getOAuthStartUrl(provider.key, mode, next);

          return (
            <a
              key={provider.key}
              href={startUrl}
              onClick={() => setNavigatingProvider(provider.key)}
              aria-label={provider.ariaLabel}
              className="group flex h-10 w-full items-center justify-center gap-3 rounded border border-[#232323] bg-transparent px-4 text-xs font-mono uppercase tracking-wider text-[#FAFAFA] transition-all hover:border-[#FAFAFA] hover:bg-[#111] focus:outline-none focus:ring-1 focus:ring-[#FACC15] disabled:pointer-events-none disabled:opacity-50"
            >
              <Icon className="h-4 w-4 text-[#FAFAFA] transition-transform group-hover:scale-105" />
              <span>
                {isNavigating
                  ? `Redirecting to ${provider.label}...`
                  : `Continue with ${provider.label}`}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
