// Unit tests validating exporter strategy outputs, golden formats, and factory resolution.
import { PdfExporter } from '../services/exporters/pdf.exporter';
import { ExcelExporter } from '../services/exporters/excel.exporter';
import { ImageExporter } from '../services/exporters/image.exporter';
import { IcsExporter } from '../services/exporters/ics.exporter';
import { ExporterFactory } from '../services/exporter.factory';
import type { ExportData } from '../interfaces/exporter.interface';
import * as XLSX from 'xlsx';

describe('Exporter Strategies & Factory', () => {
  const sampleData: ExportData = {
    title: 'Fall 2026 CS Timetable',
    projectName: 'Computer Science Department',
    entityType: 'section',
    entityName: 'CSE-3A',
    settings: {
      days: [1, 2, 3, 4, 5],
      periodsPerDay: 4,
      periodDuration: 50,
      startTime: '09:00',
      breaks: [{ name: 'Lunch', afterPeriod: 2, durationMinutes: 45 }],
      perDayOverrides: {},
    },
    entries: [
      {
        id: 'e1',
        versionId: 'v1',
        sectionId: 'CSE-3A',
        day: 1, // Mon
        startPeriod: 1,
        span: 1,
        type: 'theory',
        subjectId: 'Data Structures',
        facultyId: 'Prof. Turing',
        roomId: 'Lab 201',
        locked: false,
        revision: 1,
      },
      {
        id: 'e2',
        versionId: 'v1',
        sectionId: 'CSE-3A',
        day: 2, // Tue
        startPeriod: 3,
        span: 1,
        type: 'lab',
        subjectId: 'Operating Systems',
        facultyId: 'Prof. Lovelace',
        roomId: 'Lab 105',
        locked: false,
        revision: 1,
      },
    ],
  };

  describe('PdfExporter', () => {
    it('generates a valid binary PDF document with correct magic header', async () => {
      const exporter = new PdfExporter();
      const buffer = await exporter.export(sampleData);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(500);
      // Valid PDF files start with "%PDF-"
      expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });
  });

  describe('ExcelExporter', () => {
    it('generates a valid Excel spreadsheet readable by SheetJS', async () => {
      const exporter = new ExcelExporter();
      const buffer = await exporter.export(sampleData);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(500);

      const wb = XLSX.read(buffer, { type: 'buffer' });
      expect(wb.SheetNames).toContain('Timetable');

      const sheet = wb.Sheets['Timetable']!;
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      expect(rows.length).toBeGreaterThan(4);
      // Check project name in first row
      expect(rows[0]?.[0]).toBe('Computer Science Department');
    });
  });

  describe('ImageExporter', () => {
    it('generates a valid PNG image with standard PNG signature bytes', async () => {
      const exporter = new ImageExporter();
      const buffer = await exporter.export(sampleData);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      // PNG magic number: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // P
      expect(buffer[2]).toBe(0x4e); // N
      expect(buffer[3]).toBe(0x47); // G
    });
  });

  describe('IcsExporter', () => {
    it('generates RFC 5545 compliant iCalendar text with recurring VEVENT blocks', async () => {
      const exporter = new IcsExporter();
      const buffer = await exporter.export(sampleData);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      const text = buffer.toString('utf-8');

      expect(text).toContain('BEGIN:VCALENDAR');
      expect(text).toContain('VERSION:2.0');
      expect(text).toContain(
        'PRODID:-//Slotly Academic Platform//Timetable//EN',
      );
      expect(text).toContain('BEGIN:VEVENT');
      expect(text).toContain('SUMMARY:Data Structures');
      expect(text).toContain('LOCATION:Lab 201');
      expect(text).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO');
      expect(text).toContain('SUMMARY:Operating Systems');
      expect(text).toContain('RRULE:FREQ=WEEKLY;BYDAY=TU');
      expect(text).toContain('END:VEVENT');
      expect(text).toContain('END:VCALENDAR');
    });
  });

  describe('ExporterFactory', () => {
    it('correctly resolves exporter strategies and throws for invalid format', () => {
      const pdf = new PdfExporter();
      const excel = new ExcelExporter();
      const image = new ImageExporter();
      const ics = new IcsExporter();
      const factory = new ExporterFactory(pdf, excel, image, ics);

      expect(factory.getExporter('pdf')).toBe(pdf);
      expect(factory.getExporter('excel')).toBe(excel);
      expect(factory.getExporter('image')).toBe(image);
      expect(factory.getExporter('ics')).toBe(ics);
      expect(() => factory.getExporter('invalid' as any)).toThrow();
    });
  });
});
