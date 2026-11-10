// Reusable empty state card for institution views matching sys0 visual guidelines.
'use client';

import * as React from 'react';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/** Props for InstitutionEmptyState component. */
export interface InstitutionEmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  className?: string | undefined;
}

/** React component rendering monochrome centered empty state card with neutral outline button. */
export function InstitutionEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: InstitutionEmptyStateProps) {
  return (
    <SurfaceCard
      variant="static"
      className={`min-h-[280px] flex flex-col items-center justify-center text-center p-8 border border-[#232323] bg-[#111111] rounded-[20px] ${className}`}
    >
      <div className="w-12 h-12 rounded-full border border-[#232323] bg-[#161616] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#FAFAFA]" />
      </div>
      <h3 className="text-lg font-semibold text-[#FAFAFA] mb-2">{title}</h3>
      <p className="text-sm font-sans text-[#8A8A8A] max-w-md mx-auto mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="h-9 px-4 rounded-[12px] border-[#232323] text-[#FAFAFA] hover:bg-[#161616]"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {actionLabel}
        </Button>
      )}
    </SurfaceCard>
  );
}
