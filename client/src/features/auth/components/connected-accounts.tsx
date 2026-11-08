// React component rendering connected social OAuth accounts card in Security settings.
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/auth.api';
import { GoogleMonochromeIcon, GitHubIcon } from './oauth-icons';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import type { OAuthProviderKey } from '@slotly/contracts';

interface ProviderConfig {
  key: OAuthProviderKey;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PROVIDERS: ProviderConfig[] = [
  { key: 'google', name: 'Google', icon: GoogleMonochromeIcon },
  { key: 'github', name: 'GitHub', icon: GitHubIcon },
];

interface ConnectedAccountsProps {
  hasPassword?: boolean;
}

/** React component displaying connected third-party OAuth accounts with connect and disconnect controls. */
export function ConnectedAccounts({ hasPassword = true }: ConnectedAccountsProps) {
  const queryClient = useQueryClient();
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<OAuthProviderKey | null>(null);

  const { data: connectedAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: () => authApi.getConnectedAccounts(),
  });

  const { data: providers, isLoading: loadingProviders } = useQuery({
    queryKey: ['oauth-providers'],
    queryFn: () => authApi.getOAuthProviders(),
    staleTime: 5 * 60 * 1000,
  });

  const unlinkMutation = useMutation({
    mutationFn: (provider: OAuthProviderKey) => authApi.unlinkOAuth(provider),
    onSuccess: (_, provider) => {
      toast.success(
        'Account Disconnected',
        `Your ${provider} account has been unlinked successfully.`,
      );
      void queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      setDisconnectingProvider(null);
    },
    onError: () => {
      setDisconnectingProvider(null);
    },
  });

  const isLoading = loadingAccounts || loadingProviders;

  if (isLoading) {
    return (
      <Card className="border-[#232323] bg-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase text-[#FAFAFA]">
            Connected Accounts
          </CardTitle>
          <CardDescription className="text-xs text-[#8A8A8A]">
            Manage your connected third-party identities for single sign-on.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-14 w-full rounded border border-[#232323] bg-[#111]" />
          <Skeleton className="h-14 w-full rounded border border-[#232323] bg-[#111]" />
        </CardContent>
      </Card>
    );
  }

  const accounts = connectedAccounts || [];
  const isEnabledOnServer = (key: OAuthProviderKey) =>
    providers?.providers?.some((p) => p.key === key && p.enabled) ?? false;

  // Only display providers that are either currently connected or enabled on the server
  const visibleProviders = PROVIDERS.filter(
    (p) => isEnabledOnServer(p.key) || accounts.some((a) => a.provider === p.key),
  );

  if (visibleProviders.length === 0) {
    return null;
  }

  // A connected account cannot be disconnected if the user has no password and this is their only sign-in method
  const isOnlyLoginMethod =
    !hasPassword && accounts.length <= 1;

  return (
    <>
      <Card className="border-[#232323] bg-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase text-[#FAFAFA]">
            Connected Accounts
          </CardTitle>
          <CardDescription className="text-xs text-[#8A8A8A]">
            Link your Google or GitHub accounts to sign in seamlessly without entering a password.
          </CardDescription>
        </CardHeader>

        <CardContent className="divide-y divide-[#232323]">
          {visibleProviders.map((provider) => {
            const Icon = provider.icon;
            const connected = accounts.find((a) => a.provider === provider.key);
            const isDisconnectDisabled = Boolean(connected && isOnlyLoginMethod);

            return (
              <div
                key={provider.key}
                className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded border border-[#232323] bg-[#111]">
                    <Icon className="h-4 w-4 text-[#FAFAFA]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-[#FAFAFA]">
                        {provider.name}
                      </span>
                      {connected ? (
                        <Badge variant="green" className="text-[10px] py-0 px-1.5 font-mono">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="text-[10px] py-0 px-1.5 font-mono">
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    {connected ? (
                      <p className="text-[11px] text-[#8A8A8A] font-mono mt-0.5">
                        {connected.email}{' '}
                        <span className="text-[#555]">
                          • Linked{' '}
                          {new Date(connected.linkedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#8A8A8A] font-mono mt-0.5">
                        Enable instant sign-in with your {provider.name} profile
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {connected ? (
                    <div className="flex items-center gap-2">
                      {isDisconnectDisabled ? (
                        <div title="Cannot disconnect your only sign-in method. Set a password first.">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-xs font-mono uppercase text-[#555] border-[#232323] cursor-not-allowed"
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDisconnectingProvider(provider.key)}
                          disabled={unlinkMutation.isPending}
                          className="text-xs font-mono uppercase"
                        >
                          Disconnect
                        </Button>
                      )}
                    </div>
                  ) : (
                    <a
                      href={authApi.getOAuthStartUrl(
                        provider.key,
                        'link',
                        '/users/me/security',
                      )}
                      className="inline-flex h-8 items-center justify-center rounded border border-[#232323] bg-transparent px-3 text-xs font-mono uppercase tracking-wider text-[#FAFAFA] transition-colors hover:border-[#FAFAFA] hover:bg-[#111] focus:outline-none focus:ring-1 focus:ring-[#FACC15]"
                    >
                      Connect
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(disconnectingProvider)}
        onOpenChange={(open) => !open && setDisconnectingProvider(null)}
        title={`Disconnect ${disconnectingProvider === 'google' ? 'Google' : 'GitHub'} Account`}
        description={`Are you sure you want to unlink your ${disconnectingProvider} account? You will no longer be able to log in with this method.`}
        confirmLabel="Disconnect Account"
        variant="danger"
        onConfirm={() => {
          if (disconnectingProvider) {
            unlinkMutation.mutate(disconnectingProvider);
          }
        }}
      />
    </>
  );
}
