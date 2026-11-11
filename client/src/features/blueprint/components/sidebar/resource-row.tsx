// Row item component rendering assigned resources with undoable removal state.
'use client';

import * as React from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Props for ResourceRow component. */
export interface ResourceRowProps {
  id: string;
  name: string;
  meta?: string | undefined;
  resourceType: 'faculty' | 'room' | 'subject';
  onRemove: (id: string) => void;
  className?: string | undefined;
}

/** React component rendering 44px resource row with 5-second inline undo. */
export function ResourceRow({
  id,
  name,
  meta,
  resourceType,
  onRemove,
  className,
}: ResourceRowProps) {
  const [isRemoved, setIsRemoved] = React.useState(false);
  const undoTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const handleRemoveClick = () => {
    setIsRemoved(true);
    undoTimerRef.current = setTimeout(() => {
      onRemove(id);
    }, 5000);
  };

  const handleUndoClick = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setIsRemoved(false);
  };

  if (isRemoved) {
    return (
      <div
        className={cn(
          'h-11 px-3 rounded-[10px] bg-[#141414] border border-[#232323] flex items-center justify-between text-xs transition-all animate-fade-in',
          className,
        )}
      >
        <span className="text-[#8A8A8A] font-mono text-[11px] truncate">
          Removed <span className="text-[#FAFAFA] font-medium">{name}</span>
        </span>
        <button
          type="button"
          onClick={handleUndoClick}
          className="h-7 px-2 rounded-[6px] text-xs font-mono text-[#FAFAFA] hover:text-[#FAFAFA] bg-[#1F1F1F] hover:bg-[#282828] border border-[#383838] flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
        >
          <RotateCcw className="h-3 w-3 text-[#8A8A8A]" />
          <span>Undo</span>
        </button>
      </div>
    );
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'h-11 px-3 rounded-[10px] bg-[#111111] border border-[#232323] hover:border-[#383838] flex items-center justify-between gap-2.5 transition-colors group',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-6 w-6 rounded-full bg-[#181818] border border-[#232323] text-[10px] font-mono font-medium text-[#FAFAFA] flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#FAFAFA] truncate">{name}</p>
          {meta && <p className="font-mono text-[10px] text-[#8A8A8A] truncate">{meta}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={handleRemoveClick}
        aria-label={`Remove ${name} from ${resourceType}`}
        title={`Remove ${name}`}
        className="h-8 w-8 rounded-[8px] text-[#8A8A8A] hover:text-[#EF4444] hover:bg-[#1E1111] border border-transparent hover:border-[#EF4444]/20 flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
