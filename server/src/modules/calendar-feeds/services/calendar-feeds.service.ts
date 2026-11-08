// Domain service managing tokenized calendar feeds and live RFC 5545 feed generation.
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type { CreateCalendarFeedDto, CalendarFeedDto } from '@slotly/contracts';
import { CalendarFeedRepository } from '../repositories/calendar-feed.repository';
import { ViewerService } from '../../viewer/services/viewer.service';
import { IcsExporter } from '../../exports/services/exporters/ics.exporter';
import { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/** Service managing calendar feed generation, tokens, revocation, and streaming. */
@Injectable()
export class CalendarFeedsService {
  private readonly logger = new Logger(CalendarFeedsService.name);

  constructor(
    private readonly feedRepo: CalendarFeedRepository,
    private readonly viewerService: ViewerService,
    private readonly icsExporter: IcsExporter,
    private readonly projectRepo: CachedProjectRepository,
  ) {}

  /** Generates a fresh random tokenized calendar feed. */
  async createFeed(
    projectId: string,
    userId: string,
    dto: CreateCalendarFeedDto,
  ): Promise<CalendarFeedDto> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project "${projectId}" not found`);
    }

    const rawToken = `feed_${crypto.randomBytes(24).toString('hex')}`;
    const tokenHash = hashToken(rawToken);

    const created = await this.feedRepo.create({
      projectId,
      institutionId: project.institutionId,
      userId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      tokenHash,
      label: dto.label || null,
      isActive: true,
    });

    const feedId =
      (
        created as unknown as { _id?: { toString(): string } }
      )._id?.toString() ||
      created.id ||
      '';

    return {
      id: feedId,
      projectId,
      entityType: created.entityType,
      entityId: created.entityId,
      feedUrl: `/public/calendar/${rawToken}.ics`,
      label: created.label || undefined,
      isActive: created.isActive,
      createdAt: created.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  /** Lists active calendar feeds for a project. */
  async listFeeds(projectId: string): Promise<CalendarFeedDto[]> {
    const feeds = await this.feedRepo.findByProject(projectId);
    return feeds.map((f) => ({
      id:
        (f as unknown as { _id?: { toString(): string } })._id?.toString() ||
        f.id ||
        '',
      projectId: f.projectId,
      entityType: f.entityType,
      entityId: f.entityId,
      feedUrl: `[Token Hidden]`,
      label: f.label || undefined,
      isActive: f.isActive,
      createdAt: f.createdAt?.toISOString() || new Date().toISOString(),
      lastAccessedAt: f.lastAccessedAt?.toISOString() || undefined,
    }));
  }

  /** Revokes an active calendar feed. */
  async revokeFeed(
    feedId: string,
    userId: string,
    userRole: string,
  ): Promise<{ success: boolean }> {
    const feed = await this.feedRepo.findById(feedId);
    if (!feed) {
      throw new NotFoundException(`Calendar feed "${feedId}" not found`);
    }

    if (
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN' &&
      feed.userId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to revoke this feed',
      );
    }

    await this.feedRepo.revoke(feedId);
    this.logger.log(`Calendar feed "${feedId}" revoked by user "${userId}"`);
    return { success: true };
  }

  /** Renders raw iCalendar RFC 5545 buffer for the given public feed token. */
  async renderFeed(rawToken: string): Promise<Buffer> {
    const tokenHash = hashToken(rawToken);
    const feed = await this.feedRepo.findByTokenHash(tokenHash);

    if (!feed || !feed.isActive) {
      throw new NotFoundException({
        message:
          'This calendar feed subscription has been revoked or does not exist.',
        code: 'FEED_REVOKED',
      });
    }

    const feedId =
      (feed as unknown as { _id?: { toString(): string } })._id?.toString() ||
      feed.id ||
      '';
    await this.feedRepo.touchAccess(feedId);

    const timetable = await this.viewerService.getTimetable(feed.projectId, {
      type: feed.entityType,
      targetId: feed.entityId,
    });

    return this.icsExporter.export({
      title: `${timetable.entityName} Calendar`,
      projectName: timetable.versionLabel || 'Academic Timetable',
      entityType: feed.entityType,
      entityName: timetable.entityName,
      settings: timetable.settings,
      entries: timetable.entries,
    });
  }
}
