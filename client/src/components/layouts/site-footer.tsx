// Footer component for application and public pages constrained to page container width.
'use client';
import { PageContainer } from './page-container';

/** Props for SiteFooter component. */
export interface SiteFooterProps {
  className?: string;
}

/** React component rendering quiet minimal footer with copyright and release version. */
export function SiteFooter({ className = '' }: SiteFooterProps) {
  return (
    <footer className={`mt-16 sm:mt-24 ${className}`}>
      <PageContainer>
        <div className="border-t border-[#232323] py-6 flex items-center justify-between text-xs text-[#8A8A8A]">
          <span className="text-[13px] text-[#8A8A8A]">
            &copy; 2026 Slotly Academic Scheduling
          </span>
          <span className="font-mono text-xs text-[#8A8A8A]">v0.1.0</span>
        </div>
      </PageContainer>
    </footer>
  );
}
