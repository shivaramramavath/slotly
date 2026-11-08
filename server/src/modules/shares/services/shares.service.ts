// Domain service managing timetable public share links and unauthenticated view resolution.
import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import type {
  CreateShareDto,
  ShareDto,
  PublicShareViewDto,
} from '@slotly/contracts';
import { ShareRepository } from '../repositories/share.repository';
import { ViewerService } from '../../viewer/services/viewer.service';
import { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { AuditService } from '../../../common/audit/audit.service';

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/** Service managing generation, revocation, and public resolution of timetable shares. */
@Injectable()
export class SharesService {
  constructor(
    private readonly shareRepo: ShareRepository,
    private readonly viewerService: ViewerService,
    private readonly projectRepo: CachedProjectRepository,
    @Inject(CACHE_SERVICE) private readonly cache: CacheService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  /** Creates a new share link with a cryptographically secure random token. */
  async createShare(
    projectId: string,
    institutionId: string,
    userId: string,
    dto: CreateShareDto,
  ): Promise<ShareDto> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project "${projectId}" not found`);
    }

    const rawToken = `sh_${crypto.randomBytes(24).toString('hex')}`;
    const tokenHash = hashToken(rawToken);

    const share = await this.shareRepo.create({
      projectId,
      institutionId,
      userId,
      tokenHash,
      scope: dto.scope,
      targetId: dto.targetId || null,
      label: dto.label || null,
      isActive: true,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    const shareId =
      (share as unknown as { _id?: { toString(): string } })._id?.toString() ||
      share.id ||
      '';

    await this.auditService.log(
      'TIMETABLE_SHARE_CREATED',
      userId,
      { type: 'share', id: shareId },
      { projectId, scope: dto.scope, targetId: dto.targetId },
    );

    const appUrl =
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('CLIENT_URL') ||
      'http://localhost:3000';
    const shareUrl = `${appUrl}/public/shares/${rawToken}`;

    return {
      id: shareId,
      projectId,
      shareUrl,
      scope: share.scope,
      targetId: share.targetId ?? undefined,
      label: share.label ?? undefined,
      isActive: share.isActive,
      expiresAt: share.expiresAt?.toISOString(),
      createdAt: share.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  /** Lists all share links for a given project. */
  async listShares(projectId: string): Promise<ShareDto[]> {
    const shares = await this.shareRepo.findByProject(projectId);
    const appUrl =
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('CLIENT_URL') ||
      'http://localhost:3000';

    return shares.map((s) => ({
      id:
        (s as unknown as { _id?: { toString(): string } })._id?.toString() ||
        s.id ||
        '',
      projectId: s.projectId,
      shareUrl: `${appUrl}/public/shares/REDACTED`,
      scope: s.scope,
      targetId: s.targetId ?? undefined,
      label: s.label ?? undefined,
      isActive: s.isActive,
      expiresAt: s.expiresAt?.toISOString(),
      createdAt: s.createdAt?.toISOString() || new Date().toISOString(),
    }));
  }

  /** Revokes a share link so it can no longer be accessed. */
  async revokeShare(
    projectId: string,
    shareId: string,
    userId: string,
  ): Promise<void> {
    const share = await this.shareRepo.findById(shareId);
    if (!share) {
      throw new NotFoundException(`Share link "${shareId}" not found`);
    }
    if (share.projectId !== projectId) {
      throw new ForbiddenException(
        'Share link does not belong to this project',
      );
    }

    await this.shareRepo.revoke(shareId);

    // Evict Redis cached public share payload
    const cacheKey = `slotly:public:share:${share.tokenHash}`;
    await this.cache.del(cacheKey);

    await this.auditService.log(
      'TIMETABLE_SHARE_REVOKED',
      userId,
      { type: 'share', id: shareId },
      { projectId },
    );
  }

  /** Resolves and returns the public read-only timetable view for a given unauthenticated token. */
  async resolvePublicShare(rawToken: string): Promise<PublicShareViewDto> {
    const tokenHash = hashToken(rawToken);
    const cacheKey = `slotly:public:share:${tokenHash}`;

    return this.cache.remember<PublicShareViewDto>(cacheKey, 300, async () => {
      const share = await this.shareRepo.findByTokenHash(tokenHash);
      if (!share || !share.isActive) {
        throw new HttpException(
          {
            message: 'This timetable share link has expired or been revoked',
            error: 'SHARE_REVOKED',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        throw new HttpException(
          {
            message: 'This timetable share link has expired',
            error: 'SHARE_EXPIRED',
          },
          HttpStatus.GONE,
        );
      }

      const project = await this.projectRepo.findById(share.projectId);
      if (!project) {
        throw new NotFoundException(
          'Project associated with share link not found',
        );
      }

      const entityType = share.scope === 'all' ? 'section' : share.scope;
      const timetable = await this.viewerService.getTimetable(share.projectId, {
        type: entityType,
        targetId: share.targetId || undefined,
      });

      return {
        institutionName: project.institutionId || 'Institution',
        projectName: project.name,
        scope: share.scope,
        targetId: share.targetId ?? undefined,
        timetable,
      };
    });
  }
}
