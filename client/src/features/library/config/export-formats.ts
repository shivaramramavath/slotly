export type ExportFormat = 'xlsx' | 'csv';

export interface ExportFormatOption {
  format: ExportFormat;
  label: string;
  extension: string;
  mimeType: string;
}

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
