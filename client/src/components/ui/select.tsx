// React component for select.
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Type alias for select props. */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/** Constant representing select. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-9 w-full appearance-none rounded border border-[#232323] bg-[#111111] px-3 py-1 text-sm text-[#FAFAFA] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FACC15] disabled:cursor-not-allowed disabled:opacity-50 pr-8 cursor-pointer',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-[#8A8A8A]" />
      </div>
    );
  },
);

Select.displayName = 'Select';
