// Unit tests verifying all 10 move and placement validators in the chain-of-responsibility.
import { VersionEditableValidator } from '../validators/version-editable.validator';
import { LockValidator } from '../validators/lock.validator';
import { BreakValidator } from '../validators/break.validator';
import { LabBlockValidator } from '../validators/lab-block.validator';
import { TargetFreeValidator } from '../validators/target-free.validator';
import { FacultyFreeValidator } from '../validators/faculty-free.validator';
import { RoomFreeValidator } from '../validators/room-free.validator';
import { FacultyAvailabilityValidator } from '../validators/faculty-availability.validator';
import { RoomAvailabilityValidator } from '../validators/room-availability.validator';
import { WorkloadValidator } from '../validators/workload.validator';
import { MoveValidatorChain } from '../validators/move-validator-chain';
import type { MoveValidationContext } from '../validators/move-validator.interface';
import type { ScheduleEntry } from '../schemas/schedule-entry.schema';
import type { EngineInput } from '@slotly/engine';

describe('Move Validators', () => {
  const baseEntry: ScheduleEntry = {
    _id: 'slot_1',
    versionId: 'ver_1',
    sectionId: 'sec_1',
    day: 1,
    startPeriod: 1,
    span: 1,
    type: 'theory',
    facultyId: 'fac_1',
    roomId: 'room_1',
    subjectId: 'sub_1',
    locked: false,
    revision: 1,
  };

  const defaultEngineInput: EngineInput = {
    settings: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      periodsPerDay: 7,
      periodDuration: 50,
      breaks: [{ period: 4, name: 'Lunch' }],
    },
    calendar: { holidays: [] },
    sections: [{ id: 'sec_1', name: 'Section A', strength: 60 }],
    batches: [],
    faculty: [
      {
        id: 'fac_1',
        name: 'Dr. Smith',
        code: 'DS',
        maxHoursPerDay: 4,
        availability: [
          [true, true, true, true, true, true, true],
          [true, true, true, true, true, true, true],
          [true, true, false, true, true, true, true], // day 2, period 3 is false
        ],
      },
    ],
    rooms: [
      {
        id: 'room_1',
        name: 'Hall 101',
        type: 'lecture',
        capacity: 100,
        availability: [
          [true, true, true, true, true, true, true],
          [true, true, true, true, true, true, true],
          [true, true, true, true, true, true, true],
          [true, false, true, true, true, true, true], // day 3, period 2 is false
        ],
      },
    ],
    subjects: [],
    electiveGroups: [],
    lockedSlots: [],
  };

  const createContext = (
    overrides: Partial<MoveValidationContext> = {},
  ): MoveValidationContext => ({
    entry: baseEntry,
    target: { day: 1, startPeriod: 2 },
    existingEntries: [baseEntry],
    versionStatus: 'draft',
    engineInput: defaultEngineInput,
    ...overrides,
  });

  describe('VersionEditableValidator', () => {
    const validator = new VersionEditableValidator();

    it('should reject moves on published schedules', async () => {
      const res = await validator.validate(
        createContext({ versionStatus: 'published' }),
      );
      expect(res).not.toBeNull();
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('VERSION_IMMUTABLE');
    });

    it('should reject moves on archived schedules', async () => {
      const res = await validator.validate(
        createContext({ versionStatus: 'archived' }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('VERSION_IMMUTABLE');
    });

    it('should pass on draft or ready schedules', async () => {
      const resDraft = await validator.validate(
        createContext({ versionStatus: 'draft' }),
      );
      expect(resDraft?.valid).toBe(true);

      const resReady = await validator.validate(
        createContext({ versionStatus: 'ready' }),
      );
      expect(resReady?.valid).toBe(true);
    });
  });

  describe('LockValidator', () => {
    const validator = new LockValidator();

    it('should reject move if the slot is locked', async () => {
      const res = await validator.validate(
        createContext({ entry: { ...baseEntry, locked: true } }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('SLOT_LOCKED');
    });

    it('should pass if the slot is unlocked', async () => {
      const res = await validator.validate(
        createContext({ entry: { ...baseEntry, locked: false } }),
      );
      expect(res?.valid).toBe(true);
    });
  });

  describe('BreakValidator', () => {
    const validator = new BreakValidator();

    it('should reject placement overlapping institutional break', async () => {
      const res = await validator.validate(
        createContext({ target: { day: 1, startPeriod: 4 } }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('BREAK_NOT_OVERWRITABLE');
    });

    it('should pass for instructional period', async () => {
      const res = await validator.validate(
        createContext({ target: { day: 1, startPeriod: 2 } }),
      );
      expect(res?.valid).toBe(true);
    });
  });

  describe('LabBlockValidator', () => {
    const validator = new LabBlockValidator();

    it('should reject multi-period lab spanning beyond day end', async () => {
      const labEntry: ScheduleEntry = { ...baseEntry, type: 'lab', span: 3 };
      const res = await validator.validate(
        createContext({ entry: labEntry, target: { day: 1, startPeriod: 6 } }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('SLOT_EXCEEDS_PERIODS_PER_DAY');
    });

    it('should reject single-period span for laboratory type', async () => {
      const labEntry: ScheduleEntry = { ...baseEntry, type: 'lab', span: 1 };
      const res = await validator.validate(
        createContext({ entry: labEntry, target: { day: 1, startPeriod: 2 } }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('LAB_CONSECUTIVE_BLOCK_REQUIRED');
    });

    it('should pass when continuous lab fits entirely', async () => {
      const labEntry: ScheduleEntry = { ...baseEntry, type: 'lab', span: 2 };
      const res = await validator.validate(
        createContext({ entry: labEntry, target: { day: 1, startPeriod: 1 } }),
      );
      expect(res?.valid).toBe(true);
    });
  });

  describe('TargetFreeValidator', () => {
    const validator = new TargetFreeValidator();

    it('should reject target when section already has class scheduled', async () => {
      const existing: ScheduleEntry = {
        _id: 'slot_other',
        versionId: 'ver_1',
        sectionId: 'sec_1',
        day: 1,
        startPeriod: 2,
        span: 1,
        type: 'theory',
        locked: false,
        revision: 1,
      };

      const res = await validator.validate(
        createContext({
          existingEntries: [baseEntry, existing],
          target: { day: 1, startPeriod: 2 },
        }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('SECTION_DOUBLE_BOOKED');
      expect(res?.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('FacultyFreeValidator', () => {
    const validator = new FacultyFreeValidator();

    it('should reject when faculty is teaching another section at same time', async () => {
      const existing: ScheduleEntry = {
        _id: 'slot_2',
        versionId: 'ver_1',
        sectionId: 'sec_2',
        facultyId: 'fac_1',
        day: 1,
        startPeriod: 2,
        span: 1,
        type: 'theory',
        locked: false,
        revision: 1,
      };

      const res = await validator.validate(
        createContext({
          existingEntries: [baseEntry, existing],
          target: { day: 1, startPeriod: 2, facultyId: 'fac_1' },
        }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('FACULTY_DOUBLE_BOOKED');
    });
  });

  describe('RoomFreeValidator', () => {
    const validator = new RoomFreeValidator();

    it('should reject when room is occupied by another section at same time', async () => {
      const existing: ScheduleEntry = {
        _id: 'slot_3',
        versionId: 'ver_1',
        sectionId: 'sec_3',
        roomId: 'room_1',
        day: 1,
        startPeriod: 2,
        span: 1,
        type: 'theory',
        locked: false,
        revision: 1,
      };

      const res = await validator.validate(
        createContext({
          existingEntries: [baseEntry, existing],
          target: { day: 1, startPeriod: 2, roomId: 'room_1' },
        }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('ROOM_DOUBLE_BOOKED');
    });
  });

  describe('FacultyAvailabilityValidator', () => {
    const validator = new FacultyAvailabilityValidator();

    it('should reject when target falls on faculty unavailability slot', async () => {
      const res = await validator.validate(
        createContext({
          target: { day: 2, startPeriod: 3, facultyId: 'fac_1' },
        }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('FACULTY_UNAVAILABLE');
    });
  });

  describe('RoomAvailabilityValidator', () => {
    const validator = new RoomAvailabilityValidator();

    it('should reject when target falls on room maintenance / unavailability', async () => {
      const res = await validator.validate(
        createContext({
          target: { day: 3, startPeriod: 2, roomId: 'room_1' },
        }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('ROOM_UNAVAILABLE');
    });
  });

  describe('WorkloadValidator', () => {
    const validator = new WorkloadValidator();

    it('should reject when moving adds to a faculty exceeding daily workload limit', async () => {
      const entriesSameDay: ScheduleEntry[] = [
        baseEntry,
        { ...baseEntry, _id: 's2', day: 4, startPeriod: 1 },
        { ...baseEntry, _id: 's3', day: 4, startPeriod: 2 },
        { ...baseEntry, _id: 's4', day: 4, startPeriod: 3 },
        { ...baseEntry, _id: 's5', day: 4, startPeriod: 5 },
      ];

      const res = await validator.validate(
        createContext({
          entry: baseEntry,
          existingEntries: entriesSameDay,
          target: { day: 4, startPeriod: 6, facultyId: 'fac_1' },
        }),
      );
      expect(res?.valid).toBe(false);
      expect(res?.code).toBe('FACULTY_MAX_HOURS_PER_DAY_EXCEEDED');
    });
  });

  describe('MoveValidatorChain', () => {
    const chain = new MoveValidatorChain();

    it('should validate completely clean move and return valid: true', async () => {
      const res = await chain.validateMove(
        createContext({
          target: {
            day: 1,
            startPeriod: 5,
            roomId: 'room_1',
            facultyId: 'fac_1',
          },
        }),
      );
      expect(res.valid).toBe(true);
      expect(res.suggestions).toEqual([]);
    });

    it('should fail fast at the earliest violating handler', async () => {
      const res = await chain.validateMove(
        createContext({
          versionStatus: 'published',
          entry: { ...baseEntry, locked: true },
        }),
      );
      expect(res.valid).toBe(false);
      expect(res.code).toBe('VERSION_IMMUTABLE');
    });
  });
});
