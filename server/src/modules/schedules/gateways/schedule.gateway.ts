// WebSocket gateway managing real-time collaboration events for timetable schedules.
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject, Logger, Optional } from '@nestjs/common';
import { Server, Socket, type DefaultEventsMap } from 'socket.io';
import { createHash } from 'crypto';
import {
  type PresenceUser,
  type UserRole,
  ScheduleSocketEvents,
} from '@slotly/contracts';
import { SESSIONS_SERVICE } from '../../auth/services/sessions.service';
import type { SessionsService } from '../../auth/services/sessions.service';
import { jwtConfig, DEFAULT_CONFIG, type JwtConfig } from '../../../config';

/** Interface defining structure for socket user data. */
export interface SocketUserData {
  id: string;
  role: UserRole;
  sessionId: string;
  name: string;
}

/** Interface defining structure for socket data. */
export interface SocketData {
  user?: SocketUserData | undefined;
  versionId?: string | undefined;
}

/** Type alias for authenticated socket instance. */
export type AuthenticatedScheduleSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

/** WebSocket gateway managing real-time schedule updates, locks, moves, and presence. */
@WebSocketGateway({
  namespace: '/schedule',
  cors: {
    origin: DEFAULT_CONFIG.app.clientUrl,
    credentials: true,
  },
})
export class ScheduleGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ScheduleGateway.name);

  // In-memory presence map: versionId -> Map<socketId, PresenceUser>
  private readonly presence = new Map<string, Map<string, PresenceUser>>();

  constructor(
    @Inject(SESSIONS_SERVICE)
    private readonly sessionsService: SessionsService,
    @Optional()
    @Inject(jwtConfig.KEY)
    private readonly jwtConf?: JwtConfig,
  ) {}

  afterInit() {
    this.logger.log('Schedule WebSocket Gateway initialized on /schedule');
  }

  async handleConnection(client: AuthenticatedScheduleSocket) {
    try {
      const rawToken =
        (client.handshake.auth?.['token'] as string | undefined) ||
        (typeof client.handshake.headers['authorization'] === 'string'
          ? client.handshake.headers['authorization']
          : undefined) ||
        (client.handshake.query?.['token'] as string | undefined);

      if (!rawToken) {
        this.logger.warn(
          `Unauthorized schedule socket connection: ${client.id}`,
        );
        client.disconnect(true);
        return;
      }

      const token = rawToken.startsWith('Bearer ')
        ? rawToken.substring(7).trim()
        : rawToken.trim();

      const parts = token.split('.');
      if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
        client.disconnect(true);
        return;
      }

      const [header, payload, signature] = parts;
      const secret =
        this.jwtConf?.access.secret || DEFAULT_CONFIG.jwt.access.secret;
      const expectedSig = createHash('sha256')
        .update(`${header}.${payload}.${secret}`)
        .digest('base64url');

      if (signature !== expectedSig) {
        this.logger.warn(
          `Invalid schedule socket token signature: ${client.id}`,
        );
        client.disconnect(true);
        return;
      }

      const decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as {
        sub?: string;
        role?: UserRole;
        sid?: string;
        name?: string;
        email?: string;
      };

      if (!decoded.sub || !decoded.role || !decoded.sid) {
        client.disconnect(true);
        return;
      }

      // Check active Redis session
      try {
        await this.sessionsService.validateSession(decoded.sid);
      } catch {
        this.logger.warn(
          `Revoked session attempted socket handshake: ${decoded.sid}`,
        );
        client.disconnect(true);
        return;
      }

      client.data.user = {
        id: decoded.sub,
        role: decoded.role,
        sessionId: decoded.sid,
        name: decoded.name || decoded.email?.split('@')[0] || 'Anonymous',
      };

      this.logger.debug(
        `Schedule socket connected: ${client.id} (user: ${decoded.sub})`,
      );
    } catch (err) {
      this.logger.error(
        `Schedule socket connection error: ${(err as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedScheduleSocket) {
    const versionId = client.data.versionId;
    if (versionId) {
      const roomPresence = this.presence.get(versionId);
      if (roomPresence) {
        roomPresence.delete(client.id);
        if (roomPresence.size === 0) {
          this.presence.delete(versionId);
        } else {
          this.server
            .to(versionId)
            .emit(ScheduleSocketEvents.PRESENCE_CHANGED, {
              versionId,
              users: Array.from(roomPresence.values()),
            });
        }
      }
    }
    this.logger.debug(`Schedule socket disconnected: ${client.id}`);
  }

  @SubscribeMessage(ScheduleSocketEvents.JOIN_SCHEDULE)
  handleJoinSchedule(
    @ConnectedSocket() client: AuthenticatedScheduleSocket,
    @MessageBody() data: { versionId: string },
  ) {
    const { versionId } = data;
    if (!versionId) return;

    void client.join(versionId);
    client.data.versionId = versionId;

    if (!this.presence.has(versionId)) {
      this.presence.set(versionId, new Map());
    }
    const user = client.data.user;
    if (user) {
      const presenceUser: PresenceUser = {
        userId: user.id,
        name: user.name,
        color: '#FACC15',
      };
      this.presence.get(versionId)!.set(client.id, presenceUser);

      this.server.to(versionId).emit(ScheduleSocketEvents.PRESENCE_CHANGED, {
        versionId,
        users: Array.from(this.presence.get(versionId)!.values()),
      });
    }
  }

  @SubscribeMessage(ScheduleSocketEvents.LEAVE_SCHEDULE)
  handleLeaveSchedule(
    @ConnectedSocket() client: AuthenticatedScheduleSocket,
    @MessageBody() data: { versionId: string },
  ) {
    const { versionId } = data;
    if (!versionId) return;

    void client.leave(versionId);
    client.data.versionId = undefined;

    const roomPresence = this.presence.get(versionId);
    if (roomPresence) {
      roomPresence.delete(client.id);
      this.server.to(versionId).emit(ScheduleSocketEvents.PRESENCE_CHANGED, {
        versionId,
        users: Array.from(roomPresence.values()),
      });
    }
  }

  broadcastSlotMoved(versionId: string, payload: unknown) {
    this.server.to(versionId).emit(ScheduleSocketEvents.SLOT_MOVED, payload);
  }

  broadcastSlotUpdated(versionId: string, payload: unknown) {
    this.server.to(versionId).emit(ScheduleSocketEvents.SLOT_UPDATED, payload);
  }

  broadcastSlotLocked(versionId: string, payload: unknown) {
    this.server.to(versionId).emit(ScheduleSocketEvents.SLOT_LOCKED, payload);
  }

  broadcastSlotCleared(versionId: string, payload: unknown) {
    this.server.to(versionId).emit(ScheduleSocketEvents.SLOT_CLEARED, payload);
  }

  broadcastRevisionConflict(versionId: string, payload: unknown) {
    this.server
      .to(versionId)
      .emit(ScheduleSocketEvents.REVISION_CONFLICT, payload);
  }
}
