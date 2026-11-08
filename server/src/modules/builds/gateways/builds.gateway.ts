// WebSocket gateway managing real-time events for builds.gateway.
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
import { jwtConfig } from '../../../config';
import type { JwtConfig } from '../../../config';
import { Server, Socket, type DefaultEventsMap } from 'socket.io';
import { createHash } from 'crypto';
import type { BuildProgressPayload, UserRole } from '@slotly/contracts';
import { SESSIONS_SERVICE } from '../../auth/services/sessions.service';
import type { SessionsService } from '../../auth/services/sessions.service';

/** Interface defining structure for socket user data. */
export interface SocketUserData {
  id: string;
  role: UserRole;
  sessionId: string;
  name: string;
}

/** Interface defining structure for socket data. */
export interface SocketData {
  user?: SocketUserData;
}

/** Type alias for authenticated socket. */
export type AuthenticatedSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

/** WebSocket gateway handling builds gateway real-time events. */
@WebSocketGateway({
  namespace: '/builds',
  cors: {
    origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
    credentials: true,
  },
})
export class BuildsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(BuildsGateway.name);

  constructor(
    @Inject(SESSIONS_SERVICE)
    private readonly sessionsService: SessionsService,
    @Optional()
    @Inject(jwtConfig.KEY)
    private readonly jwtConf?: JwtConfig,
  ) {}

  afterInit() {
    this.logger.log('Builds WebSocket Gateway initialized on /builds');
  }

  async handleConnection(client: AuthenticatedSocket) {
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

      if (
        !parsed.sub ||
        !parsed.sid ||
        (parsed.exp && Date.now() >= parsed.exp * 1000)
      ) {
        client.disconnect(true);
        return;
      }

      const session = await this.sessionsService.validateSession(parsed.sid);
      if (!session || session.status !== 'active') {
        client.disconnect(true);
        return;
      }

      client.data.user = {
        id: session.userId,
        role: session.role || parsed.role || 'STUDENT',
        sessionId: session.sessionId,
        name: parsed.name || 'Anonymous User',
      };
    } catch (err: unknown) {
      this.logger.warn(
        `Handshake failed for socket ${client.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('build:join')
  handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ) {
    const user = client.data?.user;
    if (!user) {
      return { success: false, message: 'Unauthenticated' };
    }
    if (data?.projectId) {
      const room = `project:${data.projectId}`;
      void client.join(room);
      return { success: true, room };
    }
    return { success: false };
  }

  @SubscribeMessage('build:leave')
  handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId: string },
  ) {
    const user = client.data?.user;
    if (!user) {
      return { success: false, message: 'Unauthenticated' };
    }
    if (data?.projectId) {
      const room = `project:${data.projectId}`;
      void client.leave(room);
      return { success: true };
    }
    return { success: false };
  }

  /**
   * Broadcasts build progress to clients in the project room.
   */
  broadcastProgress(projectId: string, payload: BuildProgressPayload) {
    if (this.server) {
      this.server.to(`project:${projectId}`).emit('build:progress', payload);
    }
  }

  /**
   * Broadcasts build completion to clients in the project room.
   */
  broadcastCompleted(projectId: string, payload: BuildProgressPayload) {
    if (this.server) {
      this.server.to(`project:${projectId}`).emit('build:completed', payload);
    }
  }

  /**
   * Broadcasts build failure to clients in the project room.
   */
  broadcastFailed(projectId: string, payload: BuildProgressPayload) {
    if (this.server) {
      this.server.to(`project:${projectId}`).emit('build:failed', payload);
    }
  }
}
