// Domain service orchestrating blueprint-socket.service business logic.
import { io, Socket } from 'socket.io-client';
import {
  SocketEvents,
  type CursorUpdatePayload,
  type BlueprintNodeDto,
  type BlueprintEdgeDto,
  type NodeStatusChangedPayload,
  type OpsAppliedPayload,
  type PresenceChangedPayload,
  type RevisionConflictPayload,
  type NodeLockedPayload,
  type NodeUnlockedPayload,
} from '@slotly/contracts';
import { getAccessToken, silentRefresh } from '@/lib/api-client';
import { registerLogoutCleanup } from '@/features/auth/services/logout-registry';

/** Type alias for socket status. */
export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

/** Interface defining structure for blueprint socket callbacks. */
export interface BlueprintSocketCallbacks {
  onStatusChange?: (status: SocketStatus) => void;
  onPresenceChange?: (payload: PresenceChangedPayload) => void;
  onCursorUpdate?: (payload: CursorUpdatePayload) => void;
  onNodeLocked?: (payload: NodeLockedPayload) => void;
  onNodeUnlocked?: (payload: NodeUnlockedPayload) => void;
  onNodeStatusChanged?: (payload: NodeStatusChangedPayload) => void;
  onOpsApplied?: (payload: OpsAppliedPayload) => void;
  onRevisionConflict?: (payload: RevisionConflictPayload) => void;
  onNodeMoved?: (payload: { nodeId: string; position: { x: number; y: number } }) => void;
  onNodeUpdated?: (payload: { nodeId: string; data: Record<string, unknown> }) => void;
}

/** Class implementing blueprint socket service. */
export class BlueprintSocketService {
  private socket: Socket | null = null;
  private currentProjectId: string | null = null;
  private status: SocketStatus = 'disconnected';
  private callbacks: BlueprintSocketCallbacks = {};

  constructor(callbacks: BlueprintSocketCallbacks = {}) {
    this.callbacks = callbacks;
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  setCallbacks(callbacks: BlueprintSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  connect(projectId: string): void {
    if (this.socket?.connected && this.currentProjectId === projectId) {
      return;
    }

    this.disconnect();
    this.currentProjectId = projectId;
    this.updateStatus('connecting');

    const token = getAccessToken();
    if (!token) {
      this.updateStatus('disconnected');
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    this.socket = io(`${apiUrl}/blueprint`, {
      transports: ['websocket', 'polling'],
      auth: (cb: (data: { token?: string }) => void) => {
        const currentToken = getAccessToken();
        cb(currentToken ? { token: `Bearer ${currentToken}` } : {});
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.updateStatus('connected');
      if (this.currentProjectId) {
        this.socket?.emit(SocketEvents.JOIN_PROJECT, { projectId: this.currentProjectId });
      }
    });

    this.socket.on('disconnect', () => {
      this.updateStatus('disconnected');
    });

    registerLogoutCleanup('blueprint_socket', () => {
      this.disconnect();
    });

    let hasRefreshedForAuth = false;
    this.socket.on('connect_error', async (err: Error) => {
      if (
        !hasRefreshedForAuth &&
        (err?.message?.includes('auth') ||
          err?.message?.includes('unauthorized') ||
          err?.message?.includes('token'))
      ) {
        hasRefreshedForAuth = true;
        try {
          await silentRefresh();
          this.socket?.connect();
        } catch {
          // Handled
        }
      }
      this.updateStatus('reconnecting');
    });

    // Server events
    this.socket.on(SocketEvents.PRESENCE_CHANGED, (payload: PresenceChangedPayload) => {
      this.callbacks.onPresenceChange?.(payload);
    });

    this.socket.on('cursor:updated', (payload: CursorUpdatePayload) => {
      this.callbacks.onCursorUpdate?.(payload);
    });

    this.socket.on(SocketEvents.NODE_LOCKED, (payload: NodeLockedPayload) => {
      this.callbacks.onNodeLocked?.(payload);
    });

    this.socket.on(SocketEvents.NODE_UNLOCKED, (payload: NodeUnlockedPayload) => {
      this.callbacks.onNodeUnlocked?.(payload);
    });

    this.socket.on(SocketEvents.NODE_STATUS_CHANGED, (payload: NodeStatusChangedPayload) => {
      this.callbacks.onNodeStatusChanged?.(payload);
    });

    this.socket.on(SocketEvents.OPS_APPLIED, (payload: OpsAppliedPayload) => {
      this.callbacks.onOpsApplied?.(payload);
    });

    this.socket.on(SocketEvents.REVISION_CONFLICT, (payload: RevisionConflictPayload) => {
      this.callbacks.onRevisionConflict?.(payload);
    });

    this.socket.on('node:moved', (payload: { nodeId: string; position: { x: number; y: number } }) => {
      this.callbacks.onNodeMoved?.(payload);
    });

    this.socket.on('node:updated', (payload: { nodeId: string; data: Record<string, unknown> }) => {
      this.callbacks.onNodeUpdated?.(payload);
    });
  }

  private updateStatus(newStatus: SocketStatus) {
    this.status = newStatus;
    this.callbacks.onStatusChange?.(newStatus);
  }

  disconnect(): void {
    if (this.socket) {
      if (this.currentProjectId) {
        this.socket.emit(SocketEvents.LEAVE_PROJECT, { projectId: this.currentProjectId });
      }
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentProjectId = null;
    this.updateStatus('disconnected');
  }

  sendCursor(x: number, y: number): void {
    if (!this.socket?.connected || !this.currentProjectId) return;
    this.socket.emit(SocketEvents.UPDATE_CURSOR, {
      projectId: this.currentProjectId,
      x,
      y,
    });
  }

  lockNode(nodeId: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected || !this.currentProjectId) {
        resolve({ success: false, message: 'Socket offline' });
        return;
      }
      this.socket.emit(
        SocketEvents.LOCK_NODE,
        { projectId: this.currentProjectId, nodeId },
        (res: { success: boolean; message?: string }) => resolve(res),
      );
    });
  }

  unlockNode(nodeId: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected || !this.currentProjectId) {
        resolve({ success: false, message: 'Socket offline' });
        return;
      }
      this.socket.emit(
        SocketEvents.UNLOCK_NODE,
        { projectId: this.currentProjectId, nodeId },
        (res: { success: boolean; message?: string }) => resolve(res),
      );
    });
  }

  addNode(payload: {
    node: BlueprintNodeDto;
    parentId?: string | null | undefined;
  }): Promise<{ success: boolean; reasonCode?: string; message?: string; fixHint?: { nodeId?: string; field?: string } }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected || !this.currentProjectId) {
        resolve({ success: false, message: 'Socket offline' });
        return;
      }
      this.socket.emit(
        SocketEvents.NODE_ADD,
        { ...payload, projectId: this.currentProjectId },
        (res: { success: boolean; reasonCode?: string; message?: string; fixHint?: { nodeId?: string; field?: string } }) =>
          resolve(res),
      );
    });
  }

  deleteNode(
    nodeId: string,
  ): Promise<{ success: boolean; reasonCode?: string; message?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected || !this.currentProjectId) {
        resolve({ success: false, message: 'Socket offline' });
        return;
      }
      this.socket.emit(
        SocketEvents.NODE_DELETE,
        { projectId: this.currentProjectId, nodeId },
        (res: { success: boolean; reasonCode?: string; message?: string }) => resolve(res),
      );
    });
  }

  addEdge(payload: {
    edge: BlueprintEdgeDto;
  }): Promise<{ success: boolean; reasonCode?: string; message?: string; fixHint?: { nodeId?: string; field?: string } }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected || !this.currentProjectId) {
        resolve({ success: false, message: 'Socket offline' });
        return;
      }
      this.socket.emit(
        SocketEvents.EDGE_ADD,
        { ...payload, projectId: this.currentProjectId },
        (res: { success: boolean; reasonCode?: string; message?: string; fixHint?: { nodeId?: string; field?: string } }) =>
          resolve(res),
      );
    });
  }

  deleteEdge(
    edgeId: string,
  ): Promise<{ success: boolean; reasonCode?: string; message?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected || !this.currentProjectId) {
        resolve({ success: false, message: 'Socket offline' });
        return;
      }
      this.socket.emit(
        SocketEvents.EDGE_DELETE,
        { projectId: this.currentProjectId, edgeId },
        (res: { success: boolean; reasonCode?: string; message?: string }) => resolve(res),
      );
    });
  }

  moveNode(nodeId: string, position: { x: number; y: number }): void {
    if (!this.socket?.connected || !this.currentProjectId) return;
    this.socket.emit(SocketEvents.NODE_MOVE, {
      projectId: this.currentProjectId,
      nodeId,
      position,
    });
  }

  updateNode(nodeId: string, data: Record<string, unknown>): void {
    if (!this.socket?.connected || !this.currentProjectId) return;
    this.socket.emit(SocketEvents.NODE_UPDATE, {
      projectId: this.currentProjectId,
      nodeId,
      data,
    });
  }
}
