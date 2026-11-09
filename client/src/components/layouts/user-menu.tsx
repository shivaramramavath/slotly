// User profile avatar dropdown menu component matching sys0 visual header standards.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, LayoutGrid, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { authApi } from '@/features/auth/services/auth.api';

/** React component rendering 32px circular avatar with user dropdown actions. */
export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const initial = user?.name ? user.name[0]?.toUpperCase() : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User account menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="h-8 w-8 rounded-full bg-[#181818] border border-[#232323] hover:border-[#383838] flex items-center justify-center text-xs font-mono font-medium text-[#FAFAFA] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
      >
        {initial}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-[#232323] bg-[#111111] p-1.5 shadow-xl text-xs z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-2 border-b border-[#232323] mb-1">
            <p className="font-medium text-[#FAFAFA] truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-[#8A8A8A] font-mono truncate">{user?.email || '—'}</p>
            {user?.role && (
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#181818] text-[#8A8A8A] uppercase">
                {user.role}
              </span>
            )}
          </div>

          <Link
            href="/users/me"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#181818] transition-colors"
          >
            <UserIcon className="h-3.5 w-3.5 text-[#8A8A8A]" />
            <span>Profile</span>
          </Link>

          <Link
            href="/users/me/security"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#181818] transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-[#8A8A8A]" />
            <span>Security &amp; Devices</span>
          </Link>

          <Link
            href="/auth/sessions"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#181818] transition-colors"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-[#8A8A8A]" />
            <span>Active Sessions</span>
          </Link>

          <div className="border-t border-[#232323] my-1" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
