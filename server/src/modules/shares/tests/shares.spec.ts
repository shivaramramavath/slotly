// Unit tests validating timetable share generation, hashing, resolution, and revocation.
import * as crypto from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SharesService } from '../services/shares.service';
import type { ShareRepository } from '../repositories/share.repository';
import type { ViewerService } from '../../viewer/services/viewer.service';
import type { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import type { CacheService } from '../../../common/cache/cache.interface';
import type { ConfigService } from '@nestjs/config';
import type { AuditService } from '../../../common/audit/audit.service';

describe('SharesService', () => {
  let service: SharesService;
  let mockShareRepo: Partial<jest.Mocked<ShareRepository>>;
  let mockViewerService: Partial<jest.Mocked<ViewerService>>;
  let mockProjectRepo: Partial<jest.Mocked<CachedProjectRepository>>;
  let mockCache: Partial<jest.Mocked<CacheService>>;
  let mockConfigService: Partial<jest.Mocked<ConfigService>>;
  let mockAuditService: Partial<jest.Mocked<AuditService>>;

  beforeEach(() => {
    mockShareRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTokenHash: jest.fn(),
      findByProject: jest.fn(),
      revoke: jest.fn(),
    };

    mockViewerService = {
      getTimetable: jest.fn(),
    };

    mockProjectRepo = {
      findById: jest.fn(),
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      remember: jest.fn((_key, _ttl, loader) => loader()) as any,
      invalidateTag: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    service = new SharesService(
      mockShareRepo as any,
      mockViewerService as any,
      mockProjectRepo as any,
      mockCache as any,
      mockConfigService as any,
      mockAuditService as any,
    );
  });

  it('should generate a cryptographically secure token, hash it for storage, and return the share URL', async () => {
    mockProjectRepo.findById!.mockResolvedValue({
      id: 'proj_1',
      institutionId: 'inst_1',
      name: 'Spring 2026',
    } as any);

    mockShareRepo.create!.mockImplementation(
      async (data) =>
        ({
          _id: 'share_123',
          ...data,
          createdAt: new Date(),
        }) as any,
    );

    const result = await service.createShare('proj_1', 'inst_1', 'user_1', {
      scope: 'all',
      label: 'Public All Classes',
    });

    expect(result.id).toBe('share_123');
    expect(result.shareUrl).toContain('/public/shares/sh_');
    expect(mockShareRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_1',
        institutionId: 'inst_1',
        userId: 'user_1',
        tokenHash: expect.any(String),
        scope: 'all',
        label: 'Public All Classes',
        isActive: true,
      }),
    );
    expect(mockAuditService.log).toHaveBeenCalledWith(
      'TIMETABLE_SHARE_CREATED',
      'user_1',
      expect.anything(),
      expect.anything(),
    );
  });

  it('should resolve an active unexpired share token to the published timetable view', async () => {
    const rawToken = 'sh_test_token_123';
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    mockShareRepo.findByTokenHash!.mockResolvedValue({
      id: 'share_1',
      projectId: 'proj_1',
      institutionId: 'inst_1',
      tokenHash,
      scope: 'section',
      targetId: 'sec_A',
      isActive: true,
      expiresAt: null,
    } as any);

    mockProjectRepo.findById!.mockResolvedValue({
      id: 'proj_1',
      institutionId: 'Apex University',
      name: 'Spring 2026',
    } as any);

    mockViewerService.getTimetable!.mockResolvedValue({
      projectId: 'proj_1',
      versionId: 'ver_pub',
      publishedAt: '2026-11-08T00:00:00.000Z',
      entityType: 'section',
      entityId: 'sec_A',
      entityName: 'Section A',
      days: [],
      periods: [],
      slots: [],
    } as any);

    const result = await service.resolvePublicShare(rawToken);

    expect(result.institutionName).toBe('Apex University');
    expect(result.projectName).toBe('Spring 2026');
    expect(result.scope).toBe('section');
    expect(result.targetId).toBe('sec_A');
    expect(result.timetable.versionId).toBe('ver_pub');
  });

  it('should throw SHARE_REVOKED with NOT_FOUND when share is inactive or does not exist', async () => {
    mockShareRepo.findByTokenHash!.mockResolvedValue(null);

    await expect(service.resolvePublicShare('invalid_token')).rejects.toThrow(
      HttpException,
    );

    try {
      await service.resolvePublicShare('invalid_token');
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(err.getResponse()).toEqual(
        expect.objectContaining({ error: 'SHARE_REVOKED' }),
      );
    }
  });

  it('should throw SHARE_EXPIRED with GONE when share has expired', async () => {
    const rawToken = 'sh_expired';
    const pastDate = new Date(Date.now() - 100000);

    mockShareRepo.findByTokenHash!.mockResolvedValue({
      id: 'share_1',
      projectId: 'proj_1',
      isActive: true,
      expiresAt: pastDate,
    } as any);

    try {
      await service.resolvePublicShare(rawToken);
      fail('Expected error to be thrown');
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.GONE);
      expect(err.getResponse()).toEqual(
        expect.objectContaining({ error: 'SHARE_EXPIRED' }),
      );
    }
  });

  it('should revoke share, evict Redis cache, and log audit event', async () => {
    mockShareRepo.findById!.mockResolvedValue({
      id: 'share_1',
      projectId: 'proj_1',
      tokenHash: 'hash_123',
    } as any);

    await service.revokeShare('proj_1', 'share_1', 'user_1');

    expect(mockShareRepo.revoke).toHaveBeenCalledWith('share_1');
    expect(mockCache.del).toHaveBeenCalledWith('slotly:public:share:hash_123');
    expect(mockAuditService.log).toHaveBeenCalledWith(
      'TIMETABLE_SHARE_REVOKED',
      'user_1',
      expect.anything(),
      expect.anything(),
    );
  });
});
