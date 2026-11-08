// Unit tests verifying MergeSlotOperation and SplitSlotOperation commands and their inverse reverts.
import { MergeSlotOperation } from '../operations/merge-slot.operation';
import { SplitSlotOperation } from '../operations/split-slot.operation';
import type { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import type { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import type { ScheduleEntry } from '../schemas/schedule-entry.schema';

describe('Merge & Split Operations', () => {
  let entryRepoMock: Partial<ScheduleEntryRepository>;
  let occupancyRepoMock: Partial<ScheduleOccupancyRepository>;

  const slot1: ScheduleEntry = {
    _id: 'slot_1',
    versionId: 'ver_1',
    sectionId: 'sec_1',
    day: 1,
    startPeriod: 1,
    span: 1,
    type: 'theory',
    facultyId: 'fac_1',
    roomId: 'room_1',
    locked: false,
    revision: 1,
  };

  const slot2: ScheduleEntry = {
    _id: 'slot_2',
    versionId: 'ver_1',
    sectionId: 'sec_1',
    day: 1,
    startPeriod: 2,
    span: 1,
    type: 'theory',
    facultyId: 'fac_1',
    roomId: 'room_1',
    locked: false,
    revision: 1,
  };

  const multiSlot: ScheduleEntry = {
    _id: 'slot_multi',
    versionId: 'ver_1',
    sectionId: 'sec_1',
    day: 1,
    startPeriod: 1,
    span: 2,
    type: 'lab',
    facultyId: 'fac_1',
    roomId: 'lab_1',
    locked: false,
    revision: 1,
  };

  beforeEach(() => {
    entryRepoMock = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === 'slot_1') return Promise.resolve({ ...slot1 });
        if (id === 'slot_2') return Promise.resolve({ ...slot2 });
        if (id === 'slot_multi') return Promise.resolve({ ...multiSlot });
        return Promise.resolve(null);
      }),
      findByFilter: jest.fn().mockResolvedValue([{ ...slot1 }, { ...slot2 }]),
      update: jest
        .fn()
        .mockImplementation((id: string, update: Partial<ScheduleEntry>) =>
          Promise.resolve({
            ...slot1,
            ...update,
            _id: id,
          }),
        ),
      delete: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockImplementation((data: Partial<ScheduleEntry>) =>
        Promise.resolve({
          _id: 'new_split_slot',
          ...data,
        } as ScheduleEntry),
      ),
    };

    occupancyRepoMock = {
      deleteByEntryId: jest.fn().mockResolvedValue(1),
      createMany: jest.fn().mockResolvedValue([]),
    };
  });

  describe('MergeSlotOperation', () => {
    it('should merge two adjacent slots into a single span=2 slot', async () => {
      const op = new MergeSlotOperation(
        entryRepoMock as ScheduleEntryRepository,
        occupancyRepoMock as ScheduleOccupancyRepository,
      );

      const res = await op.apply(
        { slotId: 'slot_1', span: 2 },
        { versionId: 'ver_1', userId: 'usr_1' },
      );

      expect(res.affectedEntries.length).toBe(1);
      expect(res.affectedEntries[0]?.span).toBe(2);
      expect(entryRepoMock.delete).toHaveBeenCalledWith('slot_2', undefined);
      expect(res.inverse).toBeDefined();
    });

    it('should revert merge by restoring split entries', async () => {
      const op = new MergeSlotOperation(
        entryRepoMock as ScheduleEntryRepository,
        occupancyRepoMock as ScheduleOccupancyRepository,
      );

      const res = await op.revert(
        {
          slotId: 'slot_1',
          originalSpan: 1,
          absorbedSlots: [{ ...slot2 }],
        },
        { versionId: 'ver_1', userId: 'usr_1' },
      );

      expect(entryRepoMock.update).toHaveBeenCalledWith(
        'slot_1',
        expect.objectContaining({ span: 1 }),
        undefined,
      );
      expect(res.affectedEntries.length).toBe(1);
    });
  });

  describe('SplitSlotOperation', () => {
    it('should split a span=2 slot into two span=1 entries', async () => {
      const op = new SplitSlotOperation(
        entryRepoMock as ScheduleEntryRepository,
        occupancyRepoMock as ScheduleOccupancyRepository,
      );

      const res = await op.apply(
        { slotId: 'slot_multi' },
        { versionId: 'ver_1', userId: 'usr_1' },
      );

      expect(res.affectedEntries.length).toBe(2);
      expect(res.affectedEntries[0]?.span).toBe(1);
      expect(res.affectedEntries[1]?.span).toBe(1);
      expect(entryRepoMock.create).toHaveBeenCalled();
    });

    it('should revert split by restoring merged multi-period entry', async () => {
      const op = new SplitSlotOperation(
        entryRepoMock as ScheduleEntryRepository,
        occupancyRepoMock as ScheduleOccupancyRepository,
      );

      const res = await op.revert(
        {
          primarySlotId: 'slot_multi',
          originalSpan: 2,
          createdSlotIds: ['new_split_slot'],
        },
        { versionId: 'ver_1', userId: 'usr_1' },
      );

      expect(entryRepoMock.delete).toHaveBeenCalledWith(
        'new_split_slot',
        undefined,
      );
      expect(entryRepoMock.update).toHaveBeenCalledWith(
        'slot_multi',
        expect.objectContaining({ span: 2 }),
        undefined,
      );
      expect(res.affectedEntries.length).toBe(1);
    });
  });
});
