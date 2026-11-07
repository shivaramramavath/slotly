// Export format configurations and MIME type definitions for library data.

/** Supported file formats for entity data export. */
export type ExportFormat = 'xlsx' | 'csv';

/** Configuration option for an export format item. */
export interface ExportFormatOption {
  format: ExportFormat;
  label: string;
  extension: string;
  mimeType: string;
}

/** Available export formats for spreadsheet and tabular data. */
export const EXPORT_FORMATS: ExportFormatOption[] = [
  {
    format: 'xlsx',
    label: 'Excel (.xlsx)',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  {
    format: 'csv',
    label: 'CSV (.csv)',
    extension: 'csv',
    mimeType: 'text/csv',
  },
];
