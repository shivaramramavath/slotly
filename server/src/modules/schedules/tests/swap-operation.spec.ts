// Unit tests verifying SwapSlotsOperation command and round-trip revert.
import { NotFoundException } from '@nestjs/common';
import { SwapSlotsOperation } from '../operations/swap-slots.operation';
import type { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import type { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import type { ScheduleEntry } from '../schemas/schedule-entry.schema';

describe('SwapSlotsOperation', () => {
  let entryRepoMock: Partial<ScheduleEntryRepository>;
  let occupancyRepoMock: Partial<ScheduleOccupancyRepository>;

  const slotA: ScheduleEntry = {
    _id: 'slot_A',
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

  const slotB: ScheduleEntry = {
    _id: 'slot_B',
    versionId: 'ver_1',
    sectionId: 'sec_2',
    day: 2,
    startPeriod: 3,
    span: 1,
    type: 'theory',
    facultyId: 'fac_2',
    roomId: 'room_2',
    locked: false,
    revision: 1,
  };

  beforeEach(() => {
    entryRepoMock = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === 'slot_A') return Promise.resolve({ ...slotA });
        if (id === 'slot_B') return Promise.resolve({ ...slotB });
        return Promise.resolve(null);
      }),
      update: jest
        .fn()
        .mockImplementation((id: string, update: Partial<ScheduleEntry>) => {
          const base = id === 'slot_A' ? slotA : slotB;
          return Promise.resolve({ ...base, ...update });
        }),
    };

    occupancyRepoMock = {
      deleteByEntryId: jest.fn().mockResolvedValue(1),
      createMany: jest.fn().mockResolvedValue([]),
    };
  });

  it('should swap day and period between slot A and slot B', async () => {
    const op = new SwapSlotsOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );

    const res = await op.apply(
      { slotIdA: 'slot_A', slotIdB: 'slot_B' },
      { versionId: 'ver_1', userId: 'usr_1' },
    );

    expect(res.affectedEntries.length).toBe(2);
    expect(res.affectedEntries[0]?.day).toBe(2);
    expect(res.affectedEntries[0]?.startPeriod).toBe(3);
    expect(res.affectedEntries[1]?.day).toBe(1);
    expect(res.affectedEntries[1]?.startPeriod).toBe(1);

    expect(occupancyRepoMock.deleteByEntryId).toHaveBeenCalledWith(
      'slot_A',
      undefined,
    );
    expect(occupancyRepoMock.deleteByEntryId).toHaveBeenCalledWith(
      'slot_B',
      undefined,
    );
    expect(occupancyRepoMock.createMany).toHaveBeenCalled();
  });

  it('should throw NotFoundException if either slot does not exist', async () => {
    const op = new SwapSlotsOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );

    await expect(
      op.apply(
        { slotIdA: 'slot_A', slotIdB: 'missing_slot' },
        { versionId: 'ver_1', userId: 'usr_1' },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should revert swap back to original slot positions', async () => {
    const op = new SwapSlotsOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );

    const res = await op.revert(
      { slotIdA: 'slot_B', slotIdB: 'slot_A' },
      { versionId: 'ver_1', userId: 'usr_1' },
    );

    expect(res.affectedEntries.length).toBe(2);
    expect(entryRepoMock.update).toHaveBeenCalledWith(
      'slot_B',
      expect.objectContaining({ day: 1, startPeriod: 1 }),
      undefined,
    );
    expect(entryRepoMock.update).toHaveBeenCalledWith(
      'slot_A',
      expect.objectContaining({ day: 2, startPeriod: 3 }),
      undefined,
    );
  });
});
