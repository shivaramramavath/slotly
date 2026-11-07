import { io, Socket } from 'socket.io-client';
import type { BuildProgressPayload } from '@slotly/contracts';
import { getAccessToken } from '@/lib/api-client';

export type BuildSocketStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting';

export interface BuildsSocketCallbacks {
  onStatusChange?: (status: BuildSocketStatus) => void;
  onProgress?: (payload: BuildProgressPayload) => void;
  onCompleted?: (payload: BuildProgressPayload) => void;
  onFailed?: (payload: BuildProgressPayload) => void;
}

export class BuildsSocketService {
  private socket: Socket | null = null;
  private currentProjectId: string | null = null;
  private status: BuildSocketStatus = 'disconnected';
  private callbacks: BuildsSocketCallbacks = {};

  constructor(callbacks: BuildsSocketCallbacks = {}) {
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: BuildsSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getStatus(): BuildSocketStatus {
    return this.status;
  }

  connect(projectId: string): void {
    if (this.socket?.connected && this.currentProjectId === projectId) {
      return;
    }

    this.disconnect();
    this.currentProjectId = projectId;
    this.updateStatus('connecting');

    const token = getAccessToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    this.socket = io(`${apiUrl}/builds`, {
      auth: { token: token ? `Bearer ${token}` : undefined },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      this.updateStatus('connected');
      this.socket?.emit('build:join', { projectId });
    });

    this.socket.on('disconnect', () => {
      this.updateStatus('disconnected');
    });

    this.socket.on('connect_error', () => {
      this.updateStatus('disconnected');
    });

    this.socket.on('build:progress', (payload: BuildProgressPayload) => {
      this.callbacks.onProgress?.(payload);
    });

    this.socket.on('build:completed', (payload: BuildProgressPayload) => {
      this.callbacks.onCompleted?.(payload);
    });

    this.socket.on('build:failed', (payload: BuildProgressPayload) => {
      this.callbacks.onFailed?.(payload);
    });
  }

  disconnect(): void {
    if (this.socket) {
      if (this.currentProjectId) {
        this.socket.emit('build:leave', { projectId: this.currentProjectId });
      }
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentProjectId = null;
    this.updateStatus('disconnected');
  }

  private updateStatus(newStatus: BuildSocketStatus): void {
    this.status = newStatus;
    this.callbacks.onStatusChange?.(newStatus);
  }
}
