// Exporter strategy rendering structured multi-cell Excel workbooks via SheetJS.
import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import type { ExportFormat } from '@slotly/contracts';
import type {
  IExporter,
  ExportData,
} from '../../interfaces/exporter.interface';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** Strategy implementation generating Excel spreadsheets for timetables. */
@Injectable()
export class ExcelExporter implements IExporter {
  readonly format: ExportFormat = 'excel';
  readonly mimeType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  readonly fileExtension = 'xlsx';

  async export(data: ExportData): Promise<Buffer> {
    const wb = XLSX.utils.book_new();

    const activeDays =
      typeof data.day === 'number'
        ? [data.day]
        : data.settings.days || [1, 2, 3, 4, 5];
    const periodsCount = data.settings.periodsPerDay || 7;

    // Build rows
    const rows: string[][] = [
      [data.projectName],
      [`${data.entityType.toUpperCase()}: ${data.entityName}`, '', data.title],
      [], // Blank separator
    ];

    // Header row: Day, Period 1, Period 2, ...
    const headerRow = ['Day'];
    for (let p = 1; p <= periodsCount; p++) {
      headerRow.push(`Period ${p}`);
    }
    rows.push(headerRow);

    // Data rows
    for (const d of activeDays) {
      const dayName = DAY_NAMES[d] || `Day ${d}`;
      const row = [dayName];

      for (let p = 1; p <= periodsCount; p++) {
        const entry = data.entries.find(
          (e) => e.day === d && e.startPeriod === p,
        );

        if (entry) {
          const parts = [
            entry.subjectId || entry.type,
            entry.facultyId ? `Fac: ${entry.facultyId}` : '',
            entry.roomId ? `Room: ${entry.roomId}` : '',
          ].filter(Boolean);
          row.push(parts.join(' | '));
        } else {
          row.push('-');
        }
      }
      rows.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    const colWidths = [{ wch: 15 }];
    for (let p = 1; p <= periodsCount; p++) {
      colWidths.push({ wch: 25 });
    }
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    const result = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.isBuffer(result) ? result : Buffer.from(result);
  }
}
