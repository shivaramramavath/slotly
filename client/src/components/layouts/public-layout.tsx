// Layout component wrapping public and visitor-facing marketing pages.
import * as React from 'react';
import { PublicHeader } from './public-header';
import { SiteFooter } from './site-footer';

/** Props for PublicLayout component. */
export interface PublicLayoutProps {
  children: React.ReactNode;
}

/** React component rendering standard public layout with header, main content, and footer. */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA]">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
