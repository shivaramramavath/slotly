// React component for app-layout.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Plus, Settings, LayoutGrid, LogOut, User as UserIcon } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { authApi } from '@/features/auth/services/auth.api';

/** Interface defining structure for app layout props. */
export interface AppLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

/** React component rendering app layout. */
export function AppLayout({ children, activePath = '/dashboard' }: AppLayoutProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [hasNotifications] = React.useState(true);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA]">
      {/* Top Navbar */}
      <header className="h-14 border-b border-[#232323] px-6 flex items-center justify-between bg-[#0A0A0A] sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <Logo href="/dashboard" />
          <nav className="hidden md:flex items-center gap-1 text-xs">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded transition-colors ${
                activePath === '/dashboard'
                  ? 'bg-[#181818] text-[#FAFAFA] font-medium'
                  : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
              }`}
            >
              Projects
            </Link>
            <Link
              href="/institutions"
              className={`px-3 py-1.5 rounded transition-colors ${
                activePath === '/institutions'
                  ? 'bg-[#181818] text-[#FAFAFA] font-medium'
                  : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
              }`}
            >
              Institution
            </Link>
            <Link
              href="/library"
              className={`px-3 py-1.5 rounded transition-colors ${
                activePath === '/library'
                  ? 'bg-[#181818] text-[#FAFAFA] font-medium'
                  : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
              }`}
            >
              Library
            </Link>
            <Link
              href="/blueprint-templates"
              className={`px-3 py-1.5 rounded transition-colors ${
                activePath === '/blueprint-templates'
                  ? 'bg-[#181818] text-[#FAFAFA] font-medium'
                  : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
              }`}
            >
              Templates
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Create Button (Yellow primary accent) */}
          <Link href="/projects/new">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Project</span>
            </Button>
          </Link>

          {/* Notifications Bell Slot */}
          <button
            type="button"
            className="relative p-2 rounded border border-[#232323] bg-[#111111] text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {hasNotifications && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded border border-[#232323] bg-[#111111] hover:bg-[#181818] transition-colors cursor-pointer"
            >
              <div className="h-6 w-6 rounded bg-[#181818] border border-[#232323] flex items-center justify-center text-xs font-mono font-bold text-[#FACC15]">
                {user?.name ? user.name[0]?.toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-[#FAFAFA]">
                {user?.name || 'Account'}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded border border-[#232323] bg-[#111111] p-1 shadow-lg text-xs z-50">
                <div className="px-3 py-2 border-b border-[#232323] mb-1">
                  <p className="font-semibold text-[#FAFAFA] truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-[#8A8A8A] truncate">{user?.email || '—'}</p>
                </div>
                <Link
                  href="/users/me"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-[#FAFAFA] hover:bg-[#181818]"
                >
                  <UserIcon className="h-3.5 w-3.5 text-[#8A8A8A]" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/users/me/security"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-[#FAFAFA] hover:bg-[#181818]"
                >
                  <Settings className="h-3.5 w-3.5 text-[#8A8A8A]" />
                  <span>Security &amp; Devices</span>
                </Link>
                <Link
                  href="/auth/sessions"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-[#FAFAFA] hover:bg-[#181818]"
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-[#8A8A8A]" />
                  <span>Active Sessions</span>
                </Link>
                <div className="border-t border-[#232323] my-1" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
