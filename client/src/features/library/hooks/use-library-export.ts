'use client';

import * as React from 'react';
import { toast } from '@/components/ui/toast';
import { libraryApi } from '../services/library.api';
import { buildExportFilename } from '../utils/export-filename';
import type { ExportFormat } from '../config/export-formats';
import type { ImportEntity } from '@slotly/contracts';

export interface UseLibraryExportOptions {
  entity: ImportEntity;
  departmentId?: string | undefined;
  archived?: boolean | undefined;
  count?: number | undefined;
}

export function useLibraryExport({
  entity,
  departmentId,
  archived,
  count = 0,
}: UseLibraryExportOptions) {
  const [isExporting, setIsExporting] = React.useState(false);

  const canExport = count > 0;

  const exportAs = React.useCallback(
    async (format: ExportFormat) => {
      if (!canExport || isExporting) return;

      setIsExporting(true);
      const filename = buildExportFilename(entity, format);

      try {
        const url = libraryApi.getExportUrl(entity, format);
        const urlObj = new URL(url);
        if (departmentId) urlObj.searchParams.set('departmentId', departmentId);
        if (archived !== undefined) urlObj.searchParams.set('archived', String(archived));

        const res = await fetch(urlObj.toString(), {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Export failed with HTTP ${res.status}`);
        }

        const blob = await res.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);

        toast.success('Export Successful', `Downloaded ${filename}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Export failed';
        toast.error('Export Error', `${message}. Would you like to retry?`, {
          label: 'Retry',
          onClick: () => {
            void exportAs(format);
          },
        });
      } finally {
        setIsExporting(false);
      }
    },
    [canExport, isExporting, entity, departmentId, archived],
  );

  return {
    exportAs,
    isExporting,
    canExport,
    disabledReason: !canExport ? 'Nothing to export' : undefined,
  };
}
