'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { authApi } from '@/features/auth/services/auth.api';
import { toast } from '@/components/ui/toast';
import { Shield, KeyRound, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      clearAuth();
      toast.info('Signed out', 'You have been logged out.');
      router.push('/login');
    } catch {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <AppLayout activePath="/users/me">
      <div className="space-y-6 max-w-3xl pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">User Profile</h1>
            <p className="text-xs font-mono text-[#8A8A8A]">
              Account credentials, assigned roles, and institution membership.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-[#232323] bg-[#181818] flex items-center justify-center font-mono font-bold text-sm text-[#FACC15]">
                {user?.name ? user.name[0]?.toUpperCase() : 'U'}
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{user?.name || 'Anonymous User'}</CardTitle>
                <CardDescription className="font-mono text-xs">{user?.email || '—'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#232323]">
              <div>
                <span className="block text-xs uppercase font-mono text-[#8A8A8A] mb-1">
                  System Role
                </span>
                <Badge variant={user?.role === 'ADMIN' ? 'yellow' : 'neutral'}>
                  {user?.role || 'GUEST'}
                </Badge>
              </div>
              <div>
                <span className="block text-xs uppercase font-mono text-[#8A8A8A] mb-1">
                  Account Status
                </span>
                <Badge variant="green">Active</Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-[#232323] flex gap-3">
              <Link href="/users/me/security">
                <Button variant="outline" size="sm">
                  <Shield className="h-3.5 w-3.5 mr-1.5 text-[#FACC15]" />
                  Security Settings &amp; 2FA
                </Button>
              </Link>
              <Link href="/auth/sessions">
                <Button variant="outline" size="sm">
                  <KeyRound className="h-3.5 w-3.5 mr-1.5 text-[#8A8A8A]" />
                  Active Sessions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
