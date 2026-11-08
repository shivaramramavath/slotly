// Unit tests verifying repository-level immutability enforcement for published and archived versions.
import { MongoScheduleVersionRepository } from '../repositories/mongo-schedule-version.repository';
import { ScheduleEntryRepository } from '../../schedules/repositories/schedule-entry.repository';
import { ConflictException } from '@nestjs/common';
import type { Model } from 'mongoose';
import type { ScheduleVersionDocument } from '../schemas/schedule-version.schema';
import type { ScheduleEntryDocument } from '../../schedules/schemas/schedule-entry.schema';

interface MockDoc {
  _id: string;
  status: string;
  projectId?: string;
  versionNo?: number;
  label?: string;
  slots?: unknown[];
  conflicts?: unknown[];
  stats?: Record<string, unknown>;
  score?: number;
  kind?: string;
  revision?: number;
}

describe('Repository Layer Immutability Enforcement (VERSION_IMMUTABLE)', () => {
  describe('MongoScheduleVersionRepository', () => {
    let repo: MongoScheduleVersionRepository;
    let modelMock: Partial<Model<ScheduleVersionDocument>>;

    beforeEach(() => {
      modelMock = {
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
      };
      repo = new MongoScheduleVersionRepository(
        modelMock as Model<ScheduleVersionDocument>,
      );
    });

    it('should throw VERSION_IMMUTABLE when updating fields of a published version', async () => {
      const publishedDoc: MockDoc = {
        _id: 'v_pub',
        status: 'published',
      };

      modelMock.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(publishedDoc),
        }),
      });

      await expect(
        repo.update('v_pub', { label: 'New Label Attempt' }),
      ).rejects.toThrow(ConflictException);

      try {
        await repo.update('v_pub', { label: 'New Label Attempt' });
      } catch (err: unknown) {
        if (err instanceof ConflictException) {
          const resp = err.getResponse() as { code?: string };
          expect(resp.code).toBe('VERSION_IMMUTABLE');
        }
      }
    });

    it('should allow transitioning status from published to archived', async () => {
      const publishedDoc: MockDoc = {
        _id: 'v_pub',
        status: 'published',
      };

      const archivedDoc: MockDoc = {
        _id: 'v_pub',
        status: 'archived',
        projectId: 'p1',
        versionNo: 1,
        label: 'V1',
        slots: [],
        conflicts: [],
        stats: {},
        score: 100,
        kind: 'auto',
        revision: 1,
      };

      modelMock.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(publishedDoc),
        }),
      });

      modelMock.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(archivedDoc),
      });

      const res = await repo.update('v_pub', { status: 'archived' });
      expect(res).toBeDefined();
      expect(res?.status).toBe('archived');
    });

    it('should throw VERSION_IMMUTABLE when updating an archived version', async () => {
      const archivedDoc: MockDoc = {
        _id: 'v_arch',
        status: 'archived',
      };

      modelMock.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(archivedDoc),
        }),
      });

      await expect(
        repo.update('v_arch', { label: 'Cannot change archived' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw VERSION_IMMUTABLE when deleting a published or archived version', async () => {
      modelMock.findById = jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ _id: 'v_pub', status: 'published' }),
      });

      await expect(repo.delete('v_pub')).rejects.toThrow(ConflictException);
    });
  });

  describe('ScheduleEntryRepository', () => {
    let entryRepo: ScheduleEntryRepository;
    let entryModelMock: Partial<Model<ScheduleEntryDocument>>;
    let versionModelMock: Partial<Model<ScheduleVersionDocument>>;

    beforeEach(() => {
      entryModelMock = {
        insertMany: jest.fn(),
        deleteMany: jest.fn(),
      };
      versionModelMock = {
        findById: jest.fn(),
      };
      entryRepo = new ScheduleEntryRepository(
        entryModelMock as Model<ScheduleEntryDocument>,
        versionModelMock as Model<ScheduleVersionDocument>,
      );
    });

    it('should throw VERSION_IMMUTABLE when creating entries for a published version', async () => {
      versionModelMock.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ status: 'published' }),
        }),
      });

      await expect(
        entryRepo.createMany([{ versionId: 'v_pub', sectionId: 's1' }]),
      ).rejects.toThrow(ConflictException);

      expect(entryModelMock.insertMany).not.toHaveBeenCalled();
    });

    it('should throw VERSION_IMMUTABLE when deleting entries for a published version', async () => {
      versionModelMock.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ status: 'published' }),
        }),
      });

      await expect(entryRepo.deleteByVersion('v_pub')).rejects.toThrow(
        ConflictException,
      );

      expect(entryModelMock.deleteMany).not.toHaveBeenCalled();
    });
  });
});
