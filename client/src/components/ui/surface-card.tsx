// Reusable surface card container implementing 20px radius, 24px padding, and focus-within ring.
'use client';

import type { HTMLAttributes, ReactNode } from 'react';

/** Props for SurfaceCard component. */
export interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'static' | 'link';
  flush?: boolean;
  children: ReactNode;
}

/** React component rendering 20px radius surface card matching sys0 visual guidelines. */
export function SurfaceCard({
  variant = 'static',
  flush = false,
  children,
  className = '',
  ...props
}: SurfaceCardProps) {
  const baseClasses = flush
    ? 'group relative rounded-[20px] border border-[#232323] bg-[#111111] overflow-hidden transition-all duration-150'
    : 'group relative rounded-[20px] border border-[#232323] bg-[#111111] p-6 min-h-[270px] flex flex-col justify-between transition-all duration-150';

  const interactiveClasses =
    variant === 'link'
      ? 'hover:border-[#383838] hover:bg-[#161616] focus-within:ring-2 focus-within:ring-[#FAFAFA] focus-within:ring-offset-2 focus-within:ring-offset-[#0A0A0A]'
      : '';

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
