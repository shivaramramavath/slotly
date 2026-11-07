// Domain service orchestrating library-import.service business logic.
import { Injectable } from '@nestjs/common';
import type {
  ImportEntity,
  ImportValidationReport,
  ImportRowError,
} from '@slotly/contracts';
import {
  CsvFileParserStrategy,
  ExcelFileParserStrategy,
  IFileParser,
} from '../strategies/file-parser.strategy';

function strVal(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toString();
  return '';
}

/** Injectable service providing library import service logic. */
@Injectable()
export class LibraryImportService {
  private readonly parsers: IFileParser[] = [
    new CsvFileParserStrategy(),
    new ExcelFileParserStrategy(),
  ];

  getParser(formatOrFilename: string): IFileParser {
    const ext = formatOrFilename.split('.').pop() ?? formatOrFilename;
    const parser = this.parsers.find((p) => p.supports(ext));
    if (!parser) {
      // Default to CSV
      return this.parsers[0]!;
    }
    return parser;
  }

  async parseBuffer(
    buffer: Buffer,
    formatOrFilename: string,
  ): Promise<Record<string, unknown>[]> {
    const parser = this.getParser(formatOrFilename);
    return parser.parse(buffer);
  }

  validateRows(
    entity: ImportEntity,
    rows: Record<string, unknown>[],
  ): ImportValidationReport {
    const errors: ImportRowError[] = [];
    const validRows: Record<string, unknown>[] = [];

    rows.forEach((rawRow, idx) => {
      const rowNum = idx + 1;
      const normalizedRow: Record<string, unknown> = {};

      // Normalize keys to lowercase trim
      for (const [k, v] of Object.entries(rawRow)) {
        normalizedRow[k.toLowerCase().trim()] =
          typeof v === 'string' ? v.trim() : v;
      }

      const rowErrors = this.validateEntityRow(entity, normalizedRow, rowNum);
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRows.push(normalizedRow);
      }
    });

    return {
      entity,
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: rows.length - validRows.length,
      errors,
      preview: rows.slice(0, 10),
    };
  }

  private validateEntityRow(
    entity: ImportEntity,
    row: Record<string, unknown>,
    rowNum: number,
  ): ImportRowError[] {
    const errors: ImportRowError[] = [];

    if (entity === 'faculty') {
      if (!row['name']) {
        errors.push({
          row: rowNum,
          field: 'name',
          message: 'Name is required',
        });
      }
      if (!row['code']) {
        errors.push({
          row: rowNum,
          field: 'code',
          message: 'Code is required',
        });
      }
      const emailStr = strVal(row['email']);
      if (!emailStr || !emailStr.includes('@')) {
        errors.push({
          row: rowNum,
          field: 'email',
          message: 'Valid email is required',
          rawValue: row['email'],
        });
      }
      if (!row['departmentid'] && !row['department']) {
        errors.push({
          row: rowNum,
          field: 'departmentId',
          message: 'Department ID is required',
        });
      }
    } else if (entity === 'subjects') {
      if (!row['code']) {
        errors.push({
          row: rowNum,
          field: 'code',
          message: 'Subject code is required',
        });
      }
      if (!row['name']) {
        errors.push({
          row: rowNum,
          field: 'name',
          message: 'Subject name is required',
        });
      }
      if (!row['departmentid'] && !row['department']) {
        errors.push({
          row: rowNum,
          field: 'departmentId',
          message: 'Department ID is required',
        });
      }
      const type = (strVal(row['type']) || 'theory').toLowerCase();
      if (!['theory', 'lab', 'tutorial', 'seminar'].includes(type)) {
        errors.push({
          row: rowNum,
          field: 'type',
          message: "Type must be one of 'theory', 'lab', 'tutorial', 'seminar'",
          rawValue: row['type'],
        });
      }
    } else if (entity === 'rooms') {
      if (!row['name']) {
        errors.push({
          row: rowNum,
          field: 'name',
          message: 'Room name is required',
        });
      }
      if (!row['code']) {
        errors.push({
          row: rowNum,
          field: 'code',
          message: 'Room code is required',
        });
      }
      if (!row['building']) {
        errors.push({
          row: rowNum,
          field: 'building',
          message: 'Building is required',
        });
      }
      const capacity = Number(row['capacity']);
      if (!capacity || isNaN(capacity) || capacity < 1) {
        errors.push({
          row: rowNum,
          field: 'capacity',
          message: 'Capacity must be a positive integer',
          rawValue: row['capacity'],
        });
      }
      const type = (strVal(row['type']) || 'lecture').toLowerCase();
      if (!['lecture', 'lab', 'seminar'].includes(type)) {
        errors.push({
          row: rowNum,
          field: 'type',
          message: "Type must be one of 'lecture', 'lab', 'seminar'",
          rawValue: row['type'],
        });
      }
    }

    return errors;
  }
}
