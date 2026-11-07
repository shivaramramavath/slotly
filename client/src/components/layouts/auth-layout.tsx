// React component for auth-layout.
import * as React from 'react';
import { Logo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';

/** React component rendering auth layout. */
export function AuthLayout({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0A0A0A] text-[#FAFAFA]">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo />
          {subtitle && <p className="text-xs text-[#8A8A8A]">{subtitle}</p>}
        </div>

        <div className="rounded-lg border border-[#232323] bg-[#111111] p-6 shadow-sm">
          {children}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Badge variant="neutral">Secure TLS</Badge>
          <Badge variant="neutral">Argon2id</Badge>
        </div>
      </div>
    </div>
  );
}
