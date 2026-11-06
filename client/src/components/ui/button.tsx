import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FACC15] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      primary: 'bg-[#FACC15] text-[#000000] hover:bg-[#EAB308] active:bg-[#CA8A04]',
      outline:
        'border border-[#232323] bg-transparent text-[#FAFAFA] hover:bg-[#181818] active:bg-[#232323]',
      danger:
        'border border-[#EF4444] bg-transparent text-[#EF4444] hover:bg-[#EF4444]/10 active:bg-[#EF4444]/20',
      ghost: 'bg-transparent text-[#FAFAFA] hover:bg-[#181818] active:bg-[#232323]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-6 text-base',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
