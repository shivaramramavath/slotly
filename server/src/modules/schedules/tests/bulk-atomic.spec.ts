// Unit tests verifying BulkSlotsOperation atomicity and rollback behavior.
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BulkSlotsOperation } from '../operations/bulk-slots.operation';
import type { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import type { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import type { ScheduleEntry } from '../schemas/schedule-entry.schema';

describe('BulkSlotsOperation Atomicity', () => {
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

  beforeEach(() => {
    entryRepoMock = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === 'slot_1') return Promise.resolve({ ...slot1 });
        if (id === 'slot_2') return Promise.resolve({ ...slot2 });
        return Promise.resolve(null);
      }),
      update: jest
        .fn()
        .mockImplementation((id: string, update: Partial<ScheduleEntry>) =>
          Promise.resolve({
            ...slot1,
            ...update,
            _id: id,
          }),
        ),
    };

    occupancyRepoMock = {
      deleteByEntryId: jest.fn().mockResolvedValue(1),
      createMany: jest.fn().mockResolvedValue([]),
    };
  });

  it('should atomically assign faculty to all matching slots in batch', async () => {
    const op = new BulkSlotsOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );

    const res = await op.apply(
      {
        slotIds: ['slot_1', 'slot_2'],
        action: 'assign_faculty',
        facultyId: 'fac_2',
      },
      { versionId: 'ver_1', userId: 'usr_1' },
    );

    expect(res.affectedEntries.length).toBe(2);
    expect(res.affectedEntries[0]?.facultyId).toBe('fac_2');
    expect(res.affectedEntries[1]?.facultyId).toBe('fac_2');
    expect(entryRepoMock.update).toHaveBeenCalledTimes(2);
  });

  it('should abort and throw NotFoundException without modifying any slot if any slotId does not exist', async () => {
    const op = new BulkSlotsOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );

    await expect(
      op.apply(
        {
          slotIds: ['slot_1', 'slot_missing'],
          action: 'assign_faculty',
          facultyId: 'fac_2',
        },
        { versionId: 'ver_1', userId: 'usr_1' },
      ),
    ).rejects.toThrow(NotFoundException);

    expect(entryRepoMock.update).not.toHaveBeenCalled();
    expect(occupancyRepoMock.createMany).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException if required parameter for action is omitted', async () => {
    const op = new BulkSlotsOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );

    await expect(
      op.apply(
        {
          slotIds: ['slot_1'],
          action: 'assign_room',
          // roomId omitted
        },
        { versionId: 'ver_1', userId: 'usr_1' },
      ),
    ).rejects.toThrow(BadRequestException);

    expect(entryRepoMock.update).not.toHaveBeenCalled();
  });

  it('should revert bulk modifications back to their previous states', async () => {
    const op = new BulkSlotsOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );

    const res = await op.revert(
      {
        states: [
          { slotId: 'slot_1', facultyId: 'fac_1', roomId: 'room_1' },
          { slotId: 'slot_2', facultyId: 'fac_1', roomId: 'room_1' },
        ],
      },
      { versionId: 'ver_1', userId: 'usr_1' },
    );

    expect(res.affectedEntries.length).toBe(2);
    expect(entryRepoMock.update).toHaveBeenCalledWith(
      'slot_1',
      expect.objectContaining({ facultyId: 'fac_1' }),
      undefined,
    );
    expect(entryRepoMock.update).toHaveBeenCalledWith(
      'slot_2',
      expect.objectContaining({ facultyId: 'fac_1' }),
      undefined,
    );
  });
});
