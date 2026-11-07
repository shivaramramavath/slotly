// Dropdown menu button for exporting resource library entities to Excel or CSV.
'use client';

import { Download, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { EXPORT_FORMATS } from '../config/export-formats';
import { useLibraryExport } from '../hooks/use-library-export';
import type { ImportEntity } from '@slotly/contracts';

/** Props for the ExportMenu dropdown component. */
export interface ExportMenuProps {
  entity: ImportEntity;
  count?: number | undefined;
  totalCount?: number | undefined;
  departmentId?: string | undefined;
  archived?: boolean | undefined;
  className?: string | undefined;
}

/**
 * Dropdown trigger rendering options to export the active entity in XLSX or CSV formats.
 */
export function ExportMenu({
  entity,
  count,
  totalCount,
  departmentId,
  archived,
  className,
}: ExportMenuProps) {
  const effectiveCount = totalCount ?? count ?? 0;
  const { exportAs, isExporting, canExport, disabledReason } = useLibraryExport({
    entity,
    count: effectiveCount,
    departmentId,
    archived,
  });

  const triggerButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={!canExport || isExporting}
      aria-busy={isExporting}
      className={`font-mono text-xs gap-1.5 ${className || ''}`}
    >
      {isExporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span>Export</span>
      <ChevronDown className="w-3 h-3 opacity-60" />
    </Button>
  );

  if (!canExport && disabledReason) {
    return (
      <Tooltip content={disabledReason}>
        <div className="inline-block cursor-not-allowed">
          {triggerButton}
        </div>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>
          EXPORT {entity.toUpperCase()}
        </DropdownMenuLabel>
        {EXPORT_FORMATS.map((fmt) => (
          <DropdownMenuItem
            key={fmt.format}
            onClick={() => exportAs(fmt.format)}
            disabled={isExporting}
            className="flex items-center justify-between"
          >
            <span>{fmt.label}</span>
            <span className="font-mono text-[10px] text-[#8A8A8A]">.{fmt.extension}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
