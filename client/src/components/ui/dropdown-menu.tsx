'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | null>(null);

export interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (action: React.SetStateAction<boolean>) => {
      const next = typeof action === 'function' ? action(open) : action;
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, open, onOpenChange],
  );

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, asChild, className, onClick, ...props }, ref) => {
    const ctx = React.useContext(DropdownMenuContext);
    if (!ctx) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        ctx.setOpen((prev) => !prev);
      }
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        ref,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          const childOnClick = (children as React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }>).props.onClick;
          childOnClick?.(e);
          handleClick(e);
        },
        'aria-haspopup': 'menu',
        'aria-expanded': ctx.open,
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="menu"
        aria-expanded={ctx.open}
        onClick={handleClick}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  },
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = 'end', children, ...props }, ref) => {
    const ctx = React.useContext(DropdownMenuContext);
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

    // Close on click outside or escape key
    React.useEffect(() => {
      if (!ctx?.open) return;

      const handlePointerDown = (event: MouseEvent) => {
        const rootNode = contentRef.current?.parentElement;
        if (rootNode && !rootNode.contains(event.target as Node)) {
          ctx.setOpen(false);
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          ctx.setOpen(false);
        }
      };

      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [ctx?.open, ctx]);

    if (!ctx?.open) return null;

    return (
      <div
        ref={contentRef}
        role="menu"
        className={cn(
          'absolute z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-[#232323] bg-[#111111] p-1 text-[#FAFAFA] shadow-lg animate-in fade-in-0 zoom-in-95',
          align === 'end' ? 'right-0' : 'left-0',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

export const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, inset, onClick, disabled, children, ...props }, ref) => {
    const ctx = React.useContext(DropdownMenuContext);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(e);
      ctx?.setOpen(false);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded px-2.5 py-1.5 text-xs font-sans outline-none transition-colors hover:bg-[#181818] hover:text-[#FAFAFA] focus:bg-[#181818] focus:text-[#FAFAFA] disabled:pointer-events-none disabled:opacity-50 text-left',
          inset && 'pl-8',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        'px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8A8A8A]',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('-mx-1 my-1 h-px bg-[#232323]', className)} {...props} />;
}
