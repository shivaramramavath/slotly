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
import { Inject, Logger } from '@nestjs/common';
import { Server, Socket, type DefaultEventsMap } from 'socket.io';
import { createHash, randomUUID } from 'crypto';
import {
  type BlueprintGraphDto,
  type BlueprintNodeDto,
  type CursorUpdatePayload,
  type EdgeAddPayload,
  type EdgeDeletePayload,
  type NodeAddPayload,
  type NodeDeletePayload,
  type NodeLockPayload,
  type NodeMovePayload,
  type NodeUnlockPayload,
  type NodeUpdatePayload,
  type PresenceUser,
  type ProjectJoinPayload,
  type ProjectLeavePayload,
  SocketEvents,
  type UserRole,
} from '@slotly/contracts';
import { BlueprintService } from '../services/blueprint.service';
import { WriteBehindService } from '../../../common/queue/write-behind.service';
import { CompletionService } from '../services/completion.service';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { SESSIONS_SERVICE } from '../../auth/services/sessions.service';
import type { SessionsService } from '../../auth/services/sessions.service';

export interface SocketUserData {
  id: string;
  role: UserRole;
  sessionId: string;
  name: string;
}

export interface SocketData {
  user?: SocketUserData;
}

export type AuthenticatedSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

interface NodeLockInfo {
  userId: string;
  userName: string;
}

@WebSocketGateway({
  namespace: '/blueprint',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BlueprintGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(BlueprintGateway.name);

  // In-memory presence map: projectId -> Map<socketId, PresenceUser>
  private readonly presence = new Map<string, Map<string, PresenceUser>>();

  // In-memory node lock map: `${projectId}:${nodeId}` -> NodeLockInfo
  private readonly locks = new Map<string, NodeLockInfo>();

  constructor(
    private readonly blueprintService: BlueprintService,
    private readonly writeBehindService: WriteBehindService,
    private readonly completionService: CompletionService,
    @Inject(CACHE_SERVICE) private readonly cacheService: CacheService,
    @Inject(SESSIONS_SERVICE)
    private readonly sessionsService: SessionsService,
  ) {}

  afterInit() {
    this.logger.log('Blueprint WebSocket Gateway initialized on /blueprint');
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
        this.logger.warn(
          `Unauthorized socket connection attempt: ${client.id}`,
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
        process.env['JWT_ACCESS_SECRET'] ||
        'slotly-dev-super-secure-access-token-secret-32-chars';
      const expectedSig = createHash('sha256')
        .update(`${header}.${payload}.${secret}`)
        .digest('base64url');

      if (signature !== expectedSig) {
        this.logger.warn(`Invalid socket token signature: ${client.id}`);
        client.disconnect(true);
        return;
      }

      const parsed = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf-8'),
      ) as {
        sub: string;
        sid: string;
        role: UserRole;
        exp: number;
        name?: string;
      };

      if (Date.now() >= parsed.exp * 1000) {
        client.disconnect(true);
        return;
      }

      // Validate session in Redis
      const session = await this.sessionsService.validateSession(parsed.sid);
      if (!session || session.status !== 'active') {
        client.disconnect(true);
        return;
      }

      const userData: SocketUserData = {
        id: session.userId,
        role: session.role,
        sessionId: session.sessionId,
        name: parsed.name || `User ${session.userId.slice(-4)}`,
      };

      client.data = { user: userData };
      this.logger.debug(
        `Socket authenticated: ${client.id} (user: ${userData.id}, role: ${userData.role})`,
      );
    } catch (err) {
      this.logger.error(`Socket handshake failed: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);

    // Clean up presence in all projects
    for (const [projectId, projectUsers] of this.presence.entries()) {
      if (projectUsers.has(client.id)) {
        projectUsers.delete(client.id);
        this.broadcastPresence(projectId);
      }
    }

    // Clean up locks held by this user
    const user = client.data?.user;
    if (user) {
      for (const [key, lockInfo] of this.locks.entries()) {
        if (lockInfo.userId === user.id) {
          this.locks.delete(key);
          const parts = key.split(':');
          const projectId = parts[0];
          const nodeId = parts[1];
          if (projectId && nodeId) {
            this.server
              .to(`project:${projectId}`)
              .emit(SocketEvents.NODE_UNLOCKED, { nodeId });
          }
        }
      }
    }
  }

  private canEdit(role?: UserRole): boolean {
    return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'DESIGNER';
  }

  private broadcastPresence(projectId: string) {
    const projectUsers = this.presence.get(projectId);
    const users: PresenceUser[] = projectUsers
      ? Array.from(projectUsers.values())
      : [];
    this.server
      .to(`project:${projectId}`)
      .emit(SocketEvents.PRESENCE_CHANGED, { users });
  }

  @SubscribeMessage(SocketEvents.JOIN_PROJECT)
  async handleJoinProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ProjectJoinPayload,
  ) {
    const { projectId } = payload;
    const user = client.data.user;
    if (!user) return { success: false, message: 'Unauthenticated' };

    const roomName = `project:${projectId}`;
    await client.join(roomName);

    if (!this.presence.has(projectId)) {
      this.presence.set(projectId, new Map());
    }

    // Color based on userId
    const colors = ['#FACC15', '#22C55E', '#3B82F6', '#EC4899', '#A855F7'];
    const charCode = user.id.charCodeAt(user.id.length - 1) || 0;
    const color = colors[charCode % colors.length] ?? '#FACC15';

    this.presence.get(projectId)!.set(client.id, {
      userId: user.id,
      name: user.name,
      color,
    });

    this.broadcastPresence(projectId);
    return { success: true };
  }

  @SubscribeMessage(SocketEvents.LEAVE_PROJECT)
  async handleLeaveProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ProjectLeavePayload,
  ) {
    const { projectId } = payload;
    await client.leave(`project:${projectId}`);

    const projectUsers = this.presence.get(projectId);
    if (projectUsers) {
      projectUsers.delete(client.id);
      this.broadcastPresence(projectId);
    }

    return { success: true };
  }

  @SubscribeMessage(SocketEvents.UPDATE_CURSOR)
  handleCursorUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: CursorUpdatePayload,
  ) {
    const { projectId, x, y } = payload;
    const projectUsers = this.presence.get(projectId);
    if (projectUsers?.has(client.id)) {
      const u = projectUsers.get(client.id)!;
      u.cursor = { x, y };
      // Broadcast cursor to other room members
      client.to(`project:${projectId}`).emit('cursor:moved', {
        userId: u.userId,
        name: u.name,
        color: u.color,
        x,
        y,
      });
    }
  }

  @SubscribeMessage(SocketEvents.LOCK_NODE)
  handleNodeLock(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: NodeLockPayload,
  ) {
    const user = client.data.user;
    if (!user || !this.canEdit(user.role)) {
      return { success: false, message: 'Permission denied' };
    }

    const { projectId, nodeId } = payload;
    const lockKey = `${projectId}:${nodeId}`;
    const existing = this.locks.get(lockKey);

    if (existing && existing.userId !== user.id) {
      return {
        success: false,
        message: `Node is locked by ${existing.userName}`,
      };
    }

    this.locks.set(lockKey, { userId: user.id, userName: user.name });
    this.server.to(`project:${projectId}`).emit(SocketEvents.NODE_LOCKED, {
      nodeId,
      userId: user.id,
      userName: user.name,
    });

    return { success: true };
  }

  @SubscribeMessage(SocketEvents.UNLOCK_NODE)
  handleNodeUnlock(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: NodeUnlockPayload,
  ) {
    const user = client.data.user;
    if (!user) return { success: false, message: 'Unauthenticated' };

    const { projectId, nodeId } = payload;
    const lockKey = `${projectId}:${nodeId}`;
    const existing = this.locks.get(lockKey);

    if (
      existing &&
      (existing.userId === user.id ||
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN')
    ) {
      this.locks.delete(lockKey);
      this.server
        .to(`project:${projectId}`)
        .emit(SocketEvents.NODE_UNLOCKED, { nodeId });
      return { success: true };
    }

    return { success: false };
  }

  // ==========================================
  // CRITICAL OPERATIONS (Synchronous writes)
  // ==========================================

  @SubscribeMessage(SocketEvents.NODE_ADD)
  async handleNodeAdd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: NodeAddPayload,
  ) {
    const user = client.data.user;
    if (!user || !this.canEdit(user.role)) {
      return {
        success: false,
        reasonCode: 'PERMISSION_DENIED',
        message: 'Only Designers and Admins can modify the blueprint',
      };
    }

    const { projectId, node, parentId } = payload;
    try {
      const res = await this.blueprintService.applyOperations(
        projectId,
        {
          operations: [
            {
              opId: randomUUID(),
              type: 'add_node',
              targetId: node.id,
              node,
              parentId: parentId ?? node.parentId ?? null,
            },
          ],
        },
        user.id,
      );

      if (res.skipped && res.skipped.length > 0) {
        const rejection = res.skipped[0]!;
        return {
          success: false,
          reasonCode: rejection.reasonCode,
          message: rejection.message,
          fixHint: rejection.fixHint,
        };
      }

      // Broadcast ops:applied to room
      this.server.to(`project:${projectId}`).emit(SocketEvents.OPS_APPLIED, {
        revision: res.revision,
        applied: res.applied,
      });

      // Broadcast node status
      const updatedGraph = await this.blueprintService.getGraph(projectId);
      const addedNode = updatedGraph.nodes.find((n) => n.id === node.id);
      if (addedNode) {
        this.server
          .to(`project:${projectId}`)
          .emit(SocketEvents.NODE_STATUS_CHANGED, {
            nodeId: addedNode.id,
            status: addedNode.status,
            missing: addedNode.missing,
            effectiveStatus: addedNode.effectiveStatus,
          });
      }

      return { success: true, revision: res.revision };
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  @SubscribeMessage(SocketEvents.NODE_DELETE)
  async handleNodeDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: NodeDeletePayload,
  ) {
    const user = client.data.user;
    if (!user || !this.canEdit(user.role)) {
      return {
        success: false,
        reasonCode: 'PERMISSION_DENIED',
        message: 'Permission denied',
      };
    }

    const { projectId, nodeId } = payload;
    try {
      const res = await this.blueprintService.applyOperations(
        projectId,
        {
          operations: [
            {
              opId: randomUUID(),
              type: 'delete_node',
              targetId: nodeId,
            },
          ],
        },
        user.id,
      );

      if (res.skipped && res.skipped.length > 0) {
        const rejection = res.skipped[0]!;
        return {
          success: false,
          reasonCode: rejection.reasonCode,
          message: rejection.message,
          fixHint: rejection.fixHint,
        };
      }

      this.server.to(`project:${projectId}`).emit(SocketEvents.OPS_APPLIED, {
        revision: res.revision,
        applied: res.applied,
      });

      return { success: true, revision: res.revision };
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  @SubscribeMessage(SocketEvents.EDGE_ADD)
  async handleEdgeAdd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: EdgeAddPayload,
  ) {
    const user = client.data.user;
    if (!user || !this.canEdit(user.role)) {
      return {
        success: false,
        reasonCode: 'PERMISSION_DENIED',
        message: 'Permission denied',
      };
    }

    const { projectId, edge } = payload;
    try {
      const res = await this.blueprintService.applyOperations(
        projectId,
        {
          operations: [
            {
              opId: randomUUID(),
              type: 'add_edge',
              targetId: edge.id,
              edge,
            },
          ],
        },
        user.id,
      );

      if (res.skipped && res.skipped.length > 0) {
        const rejection = res.skipped[0]!;
        return {
          success: false,
          reasonCode: rejection.reasonCode,
          message: rejection.message,
          fixHint: rejection.fixHint,
        };
      }

      this.server.to(`project:${projectId}`).emit(SocketEvents.OPS_APPLIED, {
        revision: res.revision,
        applied: res.applied,
      });

      return { success: true, revision: res.revision };
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  @SubscribeMessage(SocketEvents.EDGE_DELETE)
  async handleEdgeDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: EdgeDeletePayload,
  ) {
    const user = client.data.user;
    if (!user || !this.canEdit(user.role)) {
      return {
        success: false,
        reasonCode: 'PERMISSION_DENIED',
        message: 'Permission denied',
      };
    }

    const { projectId, edgeId } = payload;
    try {
      const res = await this.blueprintService.applyOperations(
        projectId,
        {
          operations: [
            {
              opId: randomUUID(),
              type: 'delete_edge',
              targetId: edgeId,
            },
          ],
        },
        user.id,
      );

      if (res.skipped && res.skipped.length > 0) {
        const rejection = res.skipped[0]!;
        return {
          success: false,
          reasonCode: rejection.reasonCode,
          message: rejection.message,
          fixHint: rejection.fixHint,
        };
      }

      this.server.to(`project:${projectId}`).emit(SocketEvents.OPS_APPLIED, {
        revision: res.revision,
        applied: res.applied,
      });

      return { success: true, revision: res.revision };
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  // ==========================================
  // NON-CRITICAL OPERATIONS (Redis + Write-Behind)
  // ==========================================

  @SubscribeMessage(SocketEvents.NODE_MOVE)
  async handleNodeMove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: NodeMovePayload,
  ) {
    const user = client.data.user;
    if (!user || !this.canEdit(user.role)) {
      return { success: false, message: 'Permission denied' };
    }

    const { projectId, nodeId, position } = payload;

    // 1. Update in Redis cache immediately
    const cacheKey = `slotly:blueprint:${projectId}`;
    const cached = await this.cacheService.get<BlueprintGraphDto>(cacheKey);
    if (cached && cached.nodes) {
      const target = cached.nodes.find(
        (n: BlueprintNodeDto) => n.id === nodeId,
      );
      if (target) {
        target.position = position;
        await this.cacheService.set(cacheKey, cached, 7200);
      }
    }

    // 2. Enqueue coalesced write-behind job (jobId = node:${nodeId})
    await this.writeBehindService.enqueue(
      'node',
      nodeId,
      { position },
      projectId,
    );

    // 3. Broadcast move to peers in the room (excluding sender)
    client.to(`project:${projectId}`).emit('node:moved', { nodeId, position });

    return { success: true };
  }

  @SubscribeMessage(SocketEvents.NODE_UPDATE)
  async handleNodeUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: NodeUpdatePayload,
  ) {
    const user = client.data.user;
    if (!user || !this.canEdit(user.role)) {
      return { success: false, message: 'Permission denied' };
    }

    const { projectId, nodeId, data } = payload;

    // 1. Update in Redis cache immediately
    const cacheKey = `slotly:blueprint:${projectId}`;
    const cached = await this.cacheService.get<BlueprintGraphDto>(cacheKey);
    let targetNode: BlueprintNodeDto | undefined;

    if (cached && cached.nodes) {
      targetNode = cached.nodes.find((n: BlueprintNodeDto) => n.id === nodeId);
      if (targetNode) {
        targetNode.data = { ...targetNode.data, ...data };
        await this.cacheService.set(cacheKey, cached, 7200);
      }
    }

    // 2. Enqueue coalesced write-behind job (jobId = node:${nodeId})
    await this.writeBehindService.enqueue('node', nodeId, { data }, projectId);

    // 3. Broadcast config update to peers
    client.to(`project:${projectId}`).emit('node:updated', { nodeId, data });

    // 4. Recompute completion status for the node and any descendants (G3 regression)
    try {
      const graph = await this.blueprintService.getGraph(projectId);
      const { changes } = this.completionService.recomputeGraph(graph.nodes);

      // Find node & descendants to broadcast status changes
      for (const updated of changes) {
        this.server
          .to(`project:${projectId}`)
          .emit(SocketEvents.NODE_STATUS_CHANGED, {
            nodeId: updated.nodeId,
            status: updated.status,
            missing: updated.missing,
            effectiveStatus: updated.effectiveStatus,
          });
      }
    } catch (err) {
      this.logger.error(
        `Failed to recompute completion on node update: ${(err as Error).message}`,
      );
    }

    return { success: true };
  }
}
