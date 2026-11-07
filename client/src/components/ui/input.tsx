// React component for input.
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Type alias for input props. */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Constant representing input. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded border border-[#232323] bg-[#111111] px-3 py-1 text-sm text-[#FAFAFA] placeholder:text-[#8A8A8A] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FACC15] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
