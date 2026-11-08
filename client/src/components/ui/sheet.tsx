// React component for sheet.
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Interface defining structure for sheet props. */
export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'right' | 'left';
  children: React.ReactNode;
}

/** React component rendering sheet. */
export function Sheet({ open, onOpenChange, side = 'right', children }: SheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 z-50 w-full max-w-md border-[#232323] bg-[#111111] p-6 shadow-xl transition-transform duration-300',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded p-1 text-[#8A8A8A] hover:bg-[#181818] hover:text-[#FAFAFA]"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
}

/** React component rendering sheet header. */
export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />;
}

/** React component rendering sheet title. */
export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold tracking-tight text-[#FAFAFA]', className)} {...props} />
  );
}

/** React component rendering sheet description. */
export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-[#8A8A8A]', className)} {...props} />;
}
