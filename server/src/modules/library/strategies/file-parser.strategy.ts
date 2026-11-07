import * as XLSX from 'xlsx';

export interface IFileParser {
  supports(format: string): boolean;
  parse(buffer: Buffer): Promise<Record<string, unknown>[]>;
  export(data: Record<string, unknown>[]): Buffer;
}

export class CsvFileParserStrategy implements IFileParser {
  supports(format: string): boolean {
    const f = format.toLowerCase().trim();
    return f === 'csv' || f.includes('text/csv');
  }

  parse(buffer: Buffer): Promise<Record<string, unknown>[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return Promise.resolve([]);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return Promise.resolve([]);
    return Promise.resolve(
      XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
      }),
    );
  }

  export(data: Record<string, unknown>[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return Buffer.from(csvContent, 'utf-8');
  }
}

export class ExcelFileParserStrategy implements IFileParser {
  supports(format: string): boolean {
    const f = format.toLowerCase().trim();
    return (
      f === 'xlsx' ||
      f === 'xls' ||
      f.includes('spreadsheet') ||
      f.includes('excel')
    );
  }

  parse(buffer: Buffer): Promise<Record<string, unknown>[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return Promise.resolve([]);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return Promise.resolve([]);
    return Promise.resolve(
      XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
      }),
    );
  }

  export(data: Record<string, unknown>[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const out: unknown = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
    return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBufferLike);
  }
}
