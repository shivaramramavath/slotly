// Domain service computing live current period and next period status against project schedule settings.
import { Injectable, Inject } from '@nestjs/common';
import type {
  CurrentPeriodStatus,
  ProjectSettings,
  ScheduleEntryDto,
} from '@slotly/contracts';
import { CLOCK, type IClock } from './clock.token';

export interface HolidayLike {
  date?: string;
  startDate?: string;
  endDate?: string;
  name?: string;
}

function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  return hours * 60 + minutes;
}

/** Injectable domain service computing real-time period position for timetable viewers. */
@Injectable()
export class CurrentPeriodService {
  constructor(
    @Inject(CLOCK)
    private readonly clock: IClock,
  ) {}

  /**
   * Computes current and upcoming period status given project schedule dimensions and published entries.
   */
  computeCurrentPeriod(
    settings: ProjectSettings,
    entries: ScheduleEntryDto[],
    holidays: HolidayLike[] = [],
  ): CurrentPeriodStatus {
    const now = this.clock.now();
    const dayOfWeek = now.getDay();
    const dateStr = now.toISOString().split('T')[0] || '';
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

    // 1. Holiday check
    const matchedHoliday = holidays.find((h) => {
      if (h.date && h.date === dateStr) return true;
      if (
        h.startDate &&
        h.endDate &&
        dateStr >= h.startDate &&
        dateStr <= h.endDate
      )
        return true;
      return false;
    });
    if (matchedHoliday) {
      return {
        status: 'holiday',
        breakName: matchedHoliday.name || 'Holiday',
        currentDay: dayOfWeek,
        currentTime: currentTimeStr,
      };
    }

    // 2. Active working day check
    const activeDays = settings.days || [1, 2, 3, 4, 5];
    if (!activeDays.includes(dayOfWeek)) {
      return {
        status: 'off_day',
        currentDay: dayOfWeek,
        currentTime: currentTimeStr,
      };
    }

    // 3. Resolve day settings (per-day override or global settings)
    const override = settings.perDayOverrides?.[String(dayOfWeek)] as any;
    const periodsPerDay =
      override?.periodsPerDay ??
      override?.periods ??
      settings.periodsPerDay ??
      7;
    const periodDuration =
      override?.periodDuration ?? settings.periodDuration ?? 50;
    const startTimeStr = override?.startTime ?? settings.startTime ?? '09:00';
    const breaks = (override?.breaks ?? settings.breaks ?? []) as any[];

    const entriesToday = entries.filter((e) => e.day === dayOfWeek);
    const findEntry = (p: number): ScheduleEntryDto | null =>
      entriesToday.find((e) => e.startPeriod === p) || null;

    // 4. Build period & break timeline in minutes from midnight
    let cursorMinutes = parseTimeToMinutes(startTimeStr);
    const periodStart: Record<number, number> = {};
    const periodEnd: Record<number, number> = {};
    const breakStart: Record<number, number> = {};
    const breakEnd: Record<number, number> = {};
    const breakInfo: Record<number, { name: string; duration: number }> = {};

    for (let p = 1; p <= periodsPerDay; p++) {
      periodStart[p] = cursorMinutes;
      periodEnd[p] = cursorMinutes + periodDuration;
      cursorMinutes += periodDuration;

      const afterBreak = breaks.find((b: any) => b.afterPeriod === p);
      if (afterBreak) {
        breakStart[p] = cursorMinutes;
        breakEnd[p] = cursorMinutes + afterBreak.durationMinutes;
        breakInfo[p] = {
          name: afterBreak.name,
          duration: afterBreak.durationMinutes,
        };
        cursorMinutes += afterBreak.durationMinutes;
      }
    }

    const firstPeriodStart = periodStart[1] ?? parseTimeToMinutes(startTimeStr);

    // Before first period
    if (currentTotalMinutes < firstPeriodStart) {
      return {
        status: 'before_start',
        periodNumber: 1,
        periodName: 'Period 1',
        startsInMinutes: firstPeriodStart - currentTotalMinutes,
        nextEntry: findEntry(1),
        currentDay: dayOfWeek,
        currentTime: currentTimeStr,
      };
    }

    // Inside period or break
    for (let p = 1; p <= periodsPerDay; p++) {
      const pStart = periodStart[p]!;
      const pEnd = periodEnd[p]!;

      if (currentTotalMinutes >= pStart && currentTotalMinutes < pEnd) {
        return {
          status: 'in_period',
          periodNumber: p,
          periodName: `Period ${p}`,
          timeRemainingMinutes: pEnd - currentTotalMinutes,
          currentEntry: findEntry(p),
          nextEntry: findEntry(p + 1),
          currentDay: dayOfWeek,
          currentTime: currentTimeStr,
        };
      }

      if (breakStart[p] !== undefined && breakEnd[p] !== undefined) {
        const bStart = breakStart[p]!;
        const bEnd = breakEnd[p]!;
        if (currentTotalMinutes >= bStart && currentTotalMinutes < bEnd) {
          return {
            status: 'in_break',
            breakName: breakInfo[p]?.name || 'Break',
            periodNumber: p,
            startsInMinutes: bEnd - currentTotalMinutes,
            nextEntry: findEntry(p + 1),
            currentDay: dayOfWeek,
            currentTime: currentTimeStr,
          };
        }
      }
    }

    // After last period
    return {
      status: 'after_end',
      currentDay: dayOfWeek,
      currentTime: currentTimeStr,
    };
  }
}
