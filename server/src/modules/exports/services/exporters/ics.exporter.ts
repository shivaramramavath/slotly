// Exporter strategy rendering RFC 5545 compliant iCalendar .ics event streams.
import { Injectable } from '@nestjs/common';
import type { ExportFormat } from '@slotly/contracts';
import type {
  IExporter,
  ExportData,
} from '../../interfaces/exporter.interface';

const DAY_CODES: Record<number, string> = {
  0: 'SU',
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA',
};

function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
}

function formatMinutesToTime(totalMins: number): {
  hours: string;
  mins: string;
} {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return {
    hours: String(h).padStart(2, '0'),
    mins: String(m).padStart(2, '0'),
  };
}

/** Strategy implementation generating standard RFC 5545 iCalendar (.ics) files. */
@Injectable()
export class IcsExporter implements IExporter {
  readonly format: ExportFormat = 'ics';
  readonly mimeType = 'text/calendar; charset=utf-8';
  readonly fileExtension = 'ics';

  async export(data: ExportData): Promise<Buffer> {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Slotly Academic Platform//Timetable//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${data.projectName} - ${data.entityName}`,
      'X-WR-TIMEZONE:UTC',
    ];

    const startTimeStr = data.settings.startTime || '09:00';
    const periodDuration = data.settings.periodDuration || 50;
    const breaks = data.settings.breaks || [];

    // Base Monday anchor date for recurring events: 2026-08-03
    const baseAnchorMondays: Record<number, string> = {
      0: '20260809', // Sunday
      1: '20260803', // Monday
      2: '20260804', // Tuesday
      3: '20260805', // Wednesday
      4: '20260806', // Thursday
      5: '20260807', // Friday
      6: '20260808', // Saturday
    };

    // Precalculate period start & end offsets in minutes
    const periodOffsets: Record<number, { start: number; end: number }> = {};
    let cursor = parseTimeToMinutes(startTimeStr);
    const periodsCount = data.settings.periodsPerDay || 7;

    for (let p = 1; p <= periodsCount; p++) {
      periodOffsets[p] = { start: cursor, end: cursor + periodDuration };
      cursor += periodDuration;
      const b = (breaks as any[]).find((item: any) => item.afterPeriod === p);
      if (b) {
        cursor += b.durationMinutes;
      }
    }

    const nowStamp =
      new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    for (const entry of data.entries) {
      const dayCode = DAY_CODES[entry.day] || 'MO';
      const anchorDate = baseAnchorMondays[entry.day] || '20260803';
      const offset = periodOffsets[entry.startPeriod] || {
        start: 540,
        end: 590,
      };

      const startFormatted = formatMinutesToTime(offset.start);
      const endFormatted = formatMinutesToTime(
        offset.end + (entry.span > 1 ? (entry.span - 1) * periodDuration : 0),
      );

      const dtStart = `${anchorDate}T${startFormatted.hours}${startFormatted.mins}00`;
      const dtEnd = `${anchorDate}T${endFormatted.hours}${endFormatted.mins}00`;
      const uid = `slotly-${entry.id || entry.startPeriod}-${entry.day}@slotly.io`;

      const summary = entry.subjectId || `${entry.type.toUpperCase()} Class`;
      const location = entry.roomId || 'Classroom';
      const description = `Faculty: ${entry.facultyId || 'TBD'} | Section: ${entry.sectionId || 'All'} | Type: ${entry.type}`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
        `SUMMARY:${summary}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${description}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      );
    }

    lines.push('END:VCALENDAR');
    const icsContent = lines.join('\r\n') + '\r\n';
    return Buffer.from(icsContent, 'utf-8');
  }
}
