import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          'inline-flex items-center cursor-pointer select-none',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-[#232323] bg-[#181818] transition-colors',
            checked && 'border-[#FACC15] bg-[#FACC15]',
            className,
          )}
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-[#FAFAFA] shadow-sm ring-0 transition-transform',
              checked ? 'translate-x-4 bg-[#000000]' : 'translate-x-0 bg-[#8A8A8A]',
            )}
          />
        </div>
      </label>
    );
  },
);

Switch.displayName = 'Switch';
