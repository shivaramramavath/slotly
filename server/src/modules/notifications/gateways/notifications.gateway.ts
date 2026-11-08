// WebSocket gateway managing real-time notifications and announcements.
import {
  ConnectedSocket,
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
  NotificationSocketEvents,
  type NotificationDto,
  type UserRole,
} from '@slotly/contracts';
import { jwtConfig, DEFAULT_CONFIG } from '../../../config';
import type { JwtConfig } from '../../../config';
import { SESSIONS_SERVICE } from '../../auth/services/sessions.service';
import type { SessionsService } from '../../auth/services/sessions.service';

/** Interface representing authenticated socket user. */
export interface SocketUserData {
  id: string;
  role: UserRole;
  sessionId: string;
  name?: string | undefined;
}

/** Socket data type. */
export interface SocketData {
  user?: SocketUserData;
}

/** Type alias for authenticated socket. */
export type AuthenticatedNotificationSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

/** WebSocket gateway handling real-time push on /notifications namespace. */
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: DEFAULT_CONFIG.app.clientUrl,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    @Optional()
    @Inject(SESSIONS_SERVICE)
    private readonly sessionsService?: SessionsService,
    @Optional()
    @Inject(jwtConfig.KEY)
    private readonly jwtConf?: JwtConfig,
  ) {}

  afterInit() {
    this.logger.log(
      'Notifications WebSocket Gateway initialized on /notifications',
    );
  }

  async handleConnection(client: AuthenticatedNotificationSocket) {
    try {
      const rawToken =
        (client.handshake.auth?.['token'] as string | undefined) ||
        (typeof client.handshake.headers['authorization'] === 'string'
          ? client.handshake.headers['authorization']
          : undefined) ||
        (client.handshake.query?.['token'] as string | undefined);

      if (!rawToken) {
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
        this.jwtConf?.access.secret ||
        'slotly-dev-super-secure-access-token-secret-32-chars';
      const expectedSig = createHash('sha256')
        .update(`${header}.${payload}.${secret}`)
        .digest('base64url');

      if (signature !== expectedSig) {
        client.disconnect(true);
        return;
      }

      const parsed = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf-8'),
      ) as {
        sub?: string;
        sid?: string;
        role?: UserRole;
        exp?: number;
        name?: string;
      };

      if (!parsed.sub || (parsed.exp && Date.now() >= parsed.exp * 1000)) {
        client.disconnect(true);
        return;
      }

      if (this.sessionsService && parsed.sid) {
        const session = await this.sessionsService.validateSession(parsed.sid);
        if (!session || session.status !== 'active') {
          client.disconnect(true);
          return;
        }
      }

      client.data.user = {
        id: parsed.sub,
        role: parsed.role || 'STUDENT',
        sessionId: parsed.sid || '',
        name: parsed.name,
      };

      // Automatically join the user-specific room for targeted events
      const userRoom = `user:${parsed.sub}`;
      await client.join(userRoom);
      this.logger.debug(`Socket ${client.id} joined personal room ${userRoom}`);
    } catch (err: unknown) {
      this.logger.warn(`Notifications socket handshake failed: ${String(err)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedNotificationSocket) {
    this.logger.debug(`Notifications client disconnected: ${client.id}`);
  }

  /** Client subscription handler to re-join user room if needed. */
  @SubscribeMessage(NotificationSocketEvents.SUBSCRIBE)
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedNotificationSocket,
  ) {
    if (client.data.user?.id) {
      await client.join(`user:${client.data.user.id}`);
      return { status: 'subscribed', userId: client.data.user.id };
    }
    return { status: 'unauthenticated' };
  }

  /** Pushes an in-app notification directly to a specific user's connected sockets. */
  emitToUser(userId: string, notification: NotificationDto) {
    if (!this.server) return;
    this.server
      .to(`user:${userId}`)
      .emit(NotificationSocketEvents.NOTIFICATION_RECEIVED, notification);
  }

  /** Broadcasts a platform-wide or audience announcement. */
  broadcastAnnouncement(payload: {
    title: string;
    message: string;
    audience?: unknown;
    createdAt: string;
  }) {
    if (!this.server) return;
    this.server.emit(NotificationSocketEvents.ANNOUNCEMENT_RECEIVED, payload);
  }
}
