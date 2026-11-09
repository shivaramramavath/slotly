// Primary application header component implementing sys0 transparent lockup, scroll styling, and plain-text navigation.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, Menu, X } from 'lucide-react';
import { AppNav } from './app-nav';
import { UserMenu } from './user-menu';

/** Props for AppHeader component. */
export interface AppHeaderProps {
  compact?: boolean;
  className?: string;
  hasUnreadNotifications?: boolean;
}

/** React component rendering responsive app header with wordmark lockup, plain nav, and user avatar. */
export function AppHeader({
  compact = false,
  className = '',
  hasUnreadNotifications = true,
}: AppHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerClasses = compact
    ? 'w-full px-4 sm:px-6'
    : 'max-w-5xl mx-auto px-4 sm:px-6 w-full';

  const headerHeightClass = compact ? 'h-14' : 'h-[72px] pt-4 sm:pt-6';

  const scrollClasses = isScrolled
    ? 'bg-[#0A0A0A]/85 backdrop-blur-md border-b border-[#232323]'
    : 'bg-transparent border-b border-transparent';

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-200 ${headerHeightClass} ${scrollClasses} ${className}`}
    >
      <div className={`h-full flex items-center justify-between ${containerClasses}`}>
        {/* Left: Wordmark lockup */}
        <div className="flex items-center gap-6">
          <Link
            href="/home"
            aria-label="Slotly Home"
            className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA] rounded py-0.5"
          >
            <span className="text-[20px] font-semibold tracking-tight text-[#FAFAFA] select-none">
              sl<span className="text-[#FACC15]">o</span>tly
            </span>
            <span className="h-4 w-[1px] bg-[#232323]" aria-hidden="true" />
            <span className="text-[13px] text-[#8A8A8A] font-mono">Beta</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:block ml-4">
            <AppNav />
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* Plain Notification Bell */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative p-1 text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA] rounded-md"
          >
            <Bell className="h-4 w-4" />
            {hasUnreadNotifications && (
              <span
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#FACC15]"
                aria-hidden="true"
              />
            )}
          </button>

          {/* User Avatar Dropdown */}
          <UserMenu />

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-1 text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA] rounded-md"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#232323] bg-[#0A0A0A]/95 backdrop-blur-lg px-6 py-6 animate-in slide-in-from-top-2 duration-150">
          <AppNav
            orientation="vertical"
            onLinkClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
