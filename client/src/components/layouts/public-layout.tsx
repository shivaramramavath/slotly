import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA]">
      <header className="h-14 border-b border-[#232323] px-6 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-40">
        <Logo />
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[#232323] py-6 px-6 text-center text-xs text-[#8A8A8A]">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <span>&copy; 2026 Slotly Academic Scheduling</span>
          <span className="font-mono">v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
