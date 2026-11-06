import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-[#232323] bg-[#111111]/30 p-8 text-center',
        className,
      )}
    >
      {icon && <div className="mb-3 text-[#8A8A8A]">{icon}</div>}
      <h4 className="text-sm font-semibold text-[#FAFAFA]">{title}</h4>
      {description && <p className="mt-1 max-w-sm text-xs text-[#8A8A8A] leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
