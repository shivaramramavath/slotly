// React component rendering project pin toggle button with accessible aria states.
'use client';

import * as React from 'react';
import { Pin } from 'lucide-react';

/** Props for PinButton component. */
export interface PinButtonProps {
  pinned?: boolean | undefined;
  projectName: string;
  onToggle: ((e: React.MouseEvent) => void) | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

/** React component rendering 32px pin toggle button matching sys0 monochrome guidelines. */
export function PinButton({
  pinned = false,
  projectName,
  onToggle,
  disabled = false,
  className = '',
}: PinButtonProps) {
  return (
    <button
      type="button"
      aria-label={pinned ? `Unpin ${projectName}` : `Pin ${projectName} to top`}
      aria-pressed={pinned}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle?.(e);
      }}
      className={`h-8 w-8 rounded-lg border border-transparent hover:border-[#232323] hover:bg-[#181818] flex items-center justify-center transition-all cursor-pointer relative z-20 ${
        pinned
          ? 'text-[#FAFAFA]/70 opacity-100'
          : 'text-[#8A8A8A] hover:text-[#FAFAFA] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 focus-visible:opacity-100'
      } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA] ${className}`}
    >
      <Pin
        className={`h-4 w-4 ${pinned ? 'fill-current' : ''}`}
        aria-hidden="true"
      />
    </button>
  );
}
