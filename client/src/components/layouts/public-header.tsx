// Header component for public pages featuring transparent scroll transition and wordmark lockup.
'use client';

import * as React from 'react';
import Link from 'next/link';

/** Props for PublicHeader component. */
export interface PublicHeaderProps {
  className?: string;
}

/** React component rendering public header with wordmark lockup and unaccented action controls. */
export function PublicHeader({ className = '' }: PublicHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollClasses = isScrolled
    ? 'bg-[#0A0A0A]/85 backdrop-blur-md border-b border-[#232323]'
    : 'bg-transparent border-b border-transparent';

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-200 h-[72px] pt-4 sm:pt-6 ${scrollClasses} ${className}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full h-full flex items-center justify-between">
        {/* Left: Wordmark lockup linking to root */}
        <Link
          href="/"
          aria-label="Slotly Home"
          className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA] rounded py-0.5"
        >
          <span className="text-[20px] font-semibold tracking-tight text-[#FAFAFA] select-none">
            sl<span className="text-[#FACC15]">o</span>tly
          </span>
          <span className="h-4 w-[1px] bg-[#232323]" aria-hidden="true" />
          <span className="text-[13px] text-[#8A8A8A] font-medium tracking-wide select-none">
            Beta
          </span>
        </Link>

        {/* Right: Unaccented visitor navigation actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA] rounded px-1 py-1"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-10 px-4 rounded-[12px] border border-[#232323] bg-transparent text-sm font-medium text-[#FAFAFA] hover:bg-[#161616] hover:border-[#383838] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
