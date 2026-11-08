// React component for dialog.
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Interface defining structure for dialog props. */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/** React component rendering dialog. */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Modal Box */}
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-[#232323] bg-[#111111] p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
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

/** React component rendering dialog header. */
export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />;
}

/** React component rendering dialog title. */
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-lg font-semibold tracking-tight text-[#FAFAFA]', className)} {...props} />
  );
}

/** React component rendering dialog description. */
export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-[#8A8A8A]', className)} {...props} />;
}

/** React component rendering dialog footer. */
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end space-x-2 pt-4 border-t border-[#232323] mt-6', className)}
      {...props}
    />
  );
}
