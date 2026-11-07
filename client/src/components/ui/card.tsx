// React component for card.
import * as React from 'react';
import { cn } from '@/lib/utils';

/** React component rendering card. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[#232323] bg-[#111111] text-[#FAFAFA] shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

/** React component rendering card header. */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

/** React component rendering card title. */
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight text-[#FAFAFA]', className)}
      {...props}
    />
  );
}

/** React component rendering card description. */
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-[#8A8A8A]', className)} {...props} />;
}

/** React component rendering card content. */
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

/** React component rendering card footer. */
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0 border-t border-[#232323] mt-4', className)} {...props} />;
}
