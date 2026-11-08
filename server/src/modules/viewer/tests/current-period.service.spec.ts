// Unit tests validating current period calculations under various clock scenarios.
import { CurrentPeriodService } from '../services/current-period.service';
import type { IClock } from '../services/clock.token';
import type { ProjectSettings, ScheduleEntryDto } from '@slotly/contracts';

class FakeClock implements IClock {
  constructor(private currentTime: Date) {}

  now(): Date {
    return this.currentTime;
  }

  setTime(time: Date): void {
    this.currentTime = time;
  }
}

describe('CurrentPeriodService', () => {
  let fakeClock: FakeClock;
  let service: CurrentPeriodService;

  const sampleSettings: ProjectSettings = {
    days: [1, 2, 3, 4, 5], // Mon-Fri
    periodsPerDay: 4,
    periodDuration: 50, // 50 mins
    startTime: '09:00', // 540 mins
    breaks: [{ name: 'Morning Break', afterPeriod: 2, durationMinutes: 15 }], // 10:40 - 10:55
    perDayOverrides: {},
  };

  // Timeline:
  // Period 1: 09:00 - 09:50
  // Period 2: 09:50 - 10:40
  // Break:    10:40 - 10:55 (15 mins)
  // Period 3: 10:55 - 11:45
  // Period 4: 11:45 - 12:35

  const sampleEntries: ScheduleEntryDto[] = [
    {
      id: 'e1',
      versionId: 'v1',
      sectionId: 'sec1',
      day: 1, // Mon
      startPeriod: 1,
      span: 1,
      type: 'theory',
      subjectId: 'sub_math',
      facultyId: 'fac_1',
      roomId: 'room_101',
      locked: false,
      revision: 1,
    },
    {
      id: 'e2',
      versionId: 'v1',
      sectionId: 'sec1',
      day: 1,
      startPeriod: 2,
      span: 1,
      type: 'theory',
      subjectId: 'sub_physics',
      facultyId: 'fac_2',
      roomId: 'room_102',
      locked: false,
      revision: 1,
    },
    {
      id: 'e3',
      versionId: 'v1',
      sectionId: 'sec1',
      day: 1,
      startPeriod: 3,
      span: 1,
      type: 'lab',
      subjectId: 'sub_lab',
      facultyId: 'fac_3',
      roomId: 'room_lab',
      locked: false,
      revision: 1,
    },
  ];

  beforeEach(() => {
    // Default to Monday (day 1) at 08:30
    fakeClock = new FakeClock(new Date('2026-10-12T08:30:00')); // Oct 12, 2026 is Monday
    service = new CurrentPeriodService(fakeClock);
  });

  it('1. Returns "before_start" when clock is before the first period', () => {
    fakeClock.setTime(new Date('2026-10-12T08:30:00')); // 30 mins before 09:00
    const result = service.computeCurrentPeriod(sampleSettings, sampleEntries);

    expect(result.status).toBe('before_start');
    expect(result.periodNumber).toBe(1);
    expect(result.startsInMinutes).toBe(30);
    expect(result.nextEntry?.subjectId).toBe('sub_math');
  });

  it('2. Returns "in_period" with remaining time when clock is inside Period 1', () => {
    fakeClock.setTime(new Date('2026-10-12T09:20:00')); // 20 mins into Period 1
    const result = service.computeCurrentPeriod(sampleSettings, sampleEntries);

    expect(result.status).toBe('in_period');
    expect(result.periodNumber).toBe(1);
    expect(result.timeRemainingMinutes).toBe(30); // 09:50 - 09:20 = 30
    expect(result.currentEntry?.subjectId).toBe('sub_math');
    expect(result.nextEntry?.subjectId).toBe('sub_physics');
  });

  it('3. Returns "in_break" with break name and remaining minutes when in break', () => {
    fakeClock.setTime(new Date('2026-10-12T10:45:00')); // 5 mins into 15 min break (10:40 - 10:55)
    const result = service.computeCurrentPeriod(sampleSettings, sampleEntries);

    expect(result.status).toBe('in_break');
    expect(result.breakName).toBe('Morning Break');
    expect(result.periodNumber).toBe(2);
    expect(result.startsInMinutes).toBe(10); // 10:55 - 10:45 = 10 mins until Period 3
    expect(result.nextEntry?.subjectId).toBe('sub_lab');
  });

  it('4. Returns "after_end" when clock is after the last period', () => {
    fakeClock.setTime(new Date('2026-10-12T13:00:00')); // After 12:35
    const result = service.computeCurrentPeriod(sampleSettings, sampleEntries);

    expect(result.status).toBe('after_end');
  });

  it('5. Returns "holiday" when today matches a holiday date', () => {
    fakeClock.setTime(new Date('2026-10-12T10:00:00'));
    const result = service.computeCurrentPeriod(sampleSettings, sampleEntries, [
      { date: '2026-10-12', name: 'National Holiday' },
    ]);

    expect(result.status).toBe('holiday');
    expect(result.breakName).toBe('National Holiday');
  });

  it('6. Returns "off_day" on non-working days (e.g. Sunday)', () => {
    fakeClock.setTime(new Date('2026-10-11T10:00:00')); // Oct 11, 2026 is Sunday (day 0)
    const result = service.computeCurrentPeriod(sampleSettings, sampleEntries);

    expect(result.status).toBe('off_day');
  });

  it('7. Respects per-day overrides for Friday half-day', () => {
    const overrideSettings: ProjectSettings = {
      ...sampleSettings,
      perDayOverrides: {
        '5': {
          // Friday
          periods: 2,
          startTime: '08:00',
        },
      },
    };

    // Oct 16, 2026 is Friday (day 5) at 08:30 (inside Period 1: 08:00-09:00)
    fakeClock.setTime(new Date('2026-10-16T08:30:00'));
    const result = service.computeCurrentPeriod(
      overrideSettings,
      sampleEntries,
    );

    expect(result.status).toBe('in_period');
    expect(result.periodNumber).toBe(1);
    expect(result.timeRemainingMinutes).toBe(20);

    // At 10:30 (after Period 2: 09:00-10:00)
    fakeClock.setTime(new Date('2026-10-16T10:30:00'));
    const afterResult = service.computeCurrentPeriod(
      overrideSettings,
      sampleEntries,
    );
    expect(afterResult.status).toBe('after_end');
  });
});
