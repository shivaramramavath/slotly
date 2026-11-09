// Reusable page container constraining layout to visual specification width and padding.
'use client';

import type { HTMLAttributes, ReactNode } from 'react';

/** Props for PageContainer component. */
export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  fluid?: boolean;
}

/** React component rendering constrained or fluid page container. */
export function PageContainer({
  children,
  fluid = false,
  className = '',
  ...props
}: PageContainerProps) {
  if (fluid) {
    return (
      <div className={`w-full px-4 sm:px-6 ${className}`} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-5xl mx-auto px-4 sm:px-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
