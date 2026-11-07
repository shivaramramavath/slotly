import {
  CsvFileParserStrategy,
  ExcelFileParserStrategy,
} from '../strategies/file-parser.strategy';
import { LibraryImportService } from '../services/library-import.service';

describe('FileParser Strategies & LibraryImportService', () => {
  let csvParser: CsvFileParserStrategy;
  let excelParser: ExcelFileParserStrategy;
  let importService: LibraryImportService;

  beforeEach(() => {
    csvParser = new CsvFileParserStrategy();
    excelParser = new ExcelFileParserStrategy();
    importService = new LibraryImportService();
  });

  it('CsvFileParserStrategy should parse CSV buffer and export to CSV buffer', async () => {
    const csvData = 'Code,Name,Capacity\nL101,Lab 101,40\nL102,Lab 102,50';
    const buffer = Buffer.from(csvData, 'utf-8');

    const rows = await csvParser.parse(buffer);
    expect(rows).toHaveLength(2);
    expect(rows[0]!['Code']).toBe('L101');
    expect(Number(rows[0]!['Capacity'])).toBe(40);

    const exportedBuffer = csvParser.export(rows);
    expect(exportedBuffer).toBeInstanceOf(Buffer);
    const exportedText = exportedBuffer.toString('utf-8');
    expect(exportedText).toContain('L101');
  });

  it('ExcelFileParserStrategy should parse and export Excel buffer', async () => {
    const sampleData = [
      { Code: 'CS101', Name: 'Intro to CS', Type: 'theory' },
      { Code: 'CS102', Name: 'Data Structures', Type: 'theory' },
    ];
    const excelBuffer = excelParser.export(sampleData);
    expect(excelBuffer).toBeInstanceOf(Buffer);

    const parsedRows = await excelParser.parse(excelBuffer);
    expect(parsedRows).toHaveLength(2);
    expect(parsedRows[0]!['Code']).toBe('CS101');
  });

  it('LibraryImportService should validate rows and generate validation report with errors', () => {
    const rawRows = [
      {
        code: 'FAC1',
        name: 'John Doe',
        email: 'john@slotly.edu',
        departmentId: 'dept-1',
      },
      {
        code: '',
        name: 'No Code Faculty',
        email: 'invalid-email',
        departmentId: '',
      },
    ];

    const report = importService.validateRows('faculty', rawRows);
    expect(report.totalRows).toBe(2);
    expect(report.validRows).toBe(1);
    expect(report.invalidRows).toBe(1);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors.some((e) => e.field === 'code')).toBe(true);
    expect(report.errors.some((e) => e.field === 'email')).toBe(true);
  });
});
