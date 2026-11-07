import {
  BlueprintGateway,
  type AuthenticatedSocket,
} from '../gateways/blueprint.gateway';
import { SocketEvents, type BlueprintNodeDto } from '@slotly/contracts';
import { BlueprintWriteProcessor } from '../processors/blueprint-write.processor';
import type { BlueprintService } from '../services/blueprint.service';
import type { WriteBehindService } from '../../../common/queue/write-behind.service';
import type { CompletionService } from '../services/completion.service';
import type { CachedBlueprintRepository } from '../repositories/cached-blueprint.repository';
import type { CacheService } from '../../../common/cache/cache.interface';
import type { SessionsService } from '../../auth/services/sessions.service';
import type { Server } from 'socket.io';
import type { Job } from 'bullmq';
import type { SyncNodeJobData } from '../processors/blueprint-write.processor';

describe('BlueprintGateway & Write-Behind Processor', () => {
  let gateway: BlueprintGateway;
  let processor: BlueprintWriteProcessor;

  // Mock services
  const mockBlueprintService = {
    applyOperations: jest.fn(),
    getGraph: jest.fn(),
  };

  const mockWriteBehindService = {
    enqueue: jest.fn(),
    decrementPendingWrites: jest.fn(),
  };

  const mockCompletionService = {
    recomputeGraph: jest.fn(),
  };

  const mockBlueprintRepo = {
    updateNode: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    remember: jest.fn(),
  };

  const mockSessionsService = {
    validateSession: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    gateway = new BlueprintGateway(
      mockBlueprintService as unknown as BlueprintService,
      mockWriteBehindService as unknown as WriteBehindService,
      mockCompletionService as unknown as CompletionService,
      mockCacheService as unknown as CacheService,
      mockSessionsService as unknown as SessionsService,
    );
    gateway.server = mockServer as unknown as Server;

    processor = new BlueprintWriteProcessor(
      mockBlueprintRepo as unknown as CachedBlueprintRepository,
      mockWriteBehindService as unknown as WriteBehindService,
    );
  });

  describe('Project Presence & Room Management', () => {
    it('should join project room and broadcast presence', async () => {
      const mockClient = {
        id: 'socket_1',
        join: jest.fn(),
        data: {
          user: {
            id: 'user_1',
            role: 'ADMIN',
            sessionId: 'ses_1',
            name: 'Alice',
          },
        },
      };

      const result = await gateway.handleJoinProject(
        mockClient as unknown as AuthenticatedSocket,
        {
          projectId: 'proj_1',
        },
      );

      expect(result).toEqual({ success: true });
      expect(mockClient.join).toHaveBeenCalledWith('project:proj_1');
      expect(mockServer.to).toHaveBeenCalledWith('project:proj_1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        SocketEvents.PRESENCE_CHANGED,
        expect.objectContaining({
          users: [
            expect.objectContaining({
              userId: 'user_1',
              name: 'Alice',
            }),
          ],
        }),
      );
    });

    it('should handle disconnect and remove presence', async () => {
      const mockClient = {
        id: 'socket_1',
        join: jest.fn(),
        data: {
          user: {
            id: 'user_1',
            role: 'ADMIN',
            sessionId: 'ses_1',
            name: 'Alice',
          },
        },
      };

      await gateway.handleJoinProject(
        mockClient as unknown as AuthenticatedSocket,
        { projectId: 'proj_1' },
      );
      gateway.handleDisconnect(mockClient as unknown as AuthenticatedSocket);

      expect(mockServer.emit).toHaveBeenCalledWith(
        SocketEvents.PRESENCE_CHANGED,
        { users: [] },
      );
    });
  });

  describe('Node Locking', () => {
    it('should acquire lock and broadcast node:locked', () => {
      const mockClient = {
        data: {
          user: { id: 'user_1', role: 'DESIGNER', name: 'Bob' },
        },
      };

      const res = gateway.handleNodeLock(
        mockClient as unknown as AuthenticatedSocket,
        {
          projectId: 'proj_1',
          nodeId: 'node_1',
        },
      );

      expect(res).toEqual({ success: true });
      expect(mockServer.to).toHaveBeenCalledWith('project:proj_1');
      expect(mockServer.emit).toHaveBeenCalledWith(SocketEvents.NODE_LOCKED, {
        nodeId: 'node_1',
        userId: 'user_1',
        userName: 'Bob',
      });
    });

    it('should reject lock if already acquired by another user', () => {
      const client1 = {
        data: { user: { id: 'user_1', role: 'DESIGNER', name: 'Bob' } },
      };
      const client2 = {
        data: { user: { id: 'user_2', role: 'DESIGNER', name: 'Charlie' } },
      };

      gateway.handleNodeLock(client1 as unknown as AuthenticatedSocket, {
        projectId: 'proj_1',
        nodeId: 'node_1',
      });

      const res = gateway.handleNodeLock(
        client2 as unknown as AuthenticatedSocket,
        {
          projectId: 'proj_1',
          nodeId: 'node_1',
        },
      );

      expect(res).toEqual({
        success: false,
        message: 'Node is locked by Bob',
      });
    });

    it('should unlock and broadcast node:unlocked', () => {
      const client = {
        data: { user: { id: 'user_1', role: 'DESIGNER', name: 'Bob' } },
      };

      gateway.handleNodeLock(client as unknown as AuthenticatedSocket, {
        projectId: 'proj_1',
        nodeId: 'node_1',
      });

      const res = gateway.handleNodeUnlock(
        client as unknown as AuthenticatedSocket,
        {
          projectId: 'proj_1',
          nodeId: 'node_1',
        },
      );

      expect(res).toEqual({ success: true });
      expect(mockServer.to).toHaveBeenCalledWith('project:proj_1');
      expect(mockServer.emit).toHaveBeenCalledWith(SocketEvents.NODE_UNLOCKED, {
        nodeId: 'node_1',
      });
    });
  });

  describe('Critical Operations Routing (Synchronous & Gate Gated)', () => {
    it('should route node:add through GateChain and broadcast ops:applied', async () => {
      const client = {
        data: { user: { id: 'user_1', role: 'ADMIN' } },
      };

      mockBlueprintService.applyOperations.mockResolvedValueOnce({
        revision: 2,
        applied: [{ opId: 'op_1', type: 'add_node', targetId: 'node_dept' }],
        skipped: [],
      });

      mockBlueprintService.getGraph.mockResolvedValueOnce({
        nodes: [
          {
            id: 'node_dept',
            status: 'complete',
            missing: [],
            effectiveStatus: 'complete',
          },
        ],
      });

      const res = await gateway.handleNodeAdd(
        client as unknown as AuthenticatedSocket,
        {
          projectId: 'proj_1',
          node: {
            id: 'node_dept',
            projectId: 'proj_1',
            type: 'department',
            position: { x: 0, y: 100 },
            data: { name: 'Computer Science', code: 'CSE' },
            locked: false,
            hidden: false,
            status: 'complete',
            missing: [],
            effectiveStatus: 'complete',
          },
          parentId: 'node_inst',
        },
      );

      expect(res).toEqual({ success: true, revision: 2 });
      expect(mockBlueprintService.applyOperations).toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith('project:proj_1');
      expect(mockServer.emit).toHaveBeenCalledWith(SocketEvents.OPS_APPLIED, {
        revision: 2,
        applied: [{ opId: 'op_1', type: 'add_node', targetId: 'node_dept' }],
      });
      expect(mockServer.emit).toHaveBeenCalledWith(
        SocketEvents.NODE_STATUS_CHANGED,
        {
          nodeId: 'node_dept',
          status: 'complete',
          missing: [],
          effectiveStatus: 'complete',
        },
      );
    });

    it('should return rejection reason code if gate fails on node:add', async () => {
      const client = {
        data: { user: { id: 'user_1', role: 'ADMIN' } },
      };

      mockBlueprintService.applyOperations.mockResolvedValueOnce({
        revision: 1,
        applied: [],
        skipped: [
          {
            opId: 'op_1',
            type: 'add_node',
            targetId: 'node_sec',
            reasonCode: 'PARENT_INCOMPLETE',
            message: 'Parent semester is incomplete',
            fixHint: { nodeId: 'node_sem', field: 'startDate' },
          },
        ],
      });

      const res = await gateway.handleNodeAdd(
        client as unknown as AuthenticatedSocket,
        {
          projectId: 'proj_1',
          node: {
            id: 'node_sec',
            projectId: 'proj_1',
            type: 'section',
            position: { x: 0, y: 400 },
            data: { name: 'Section A', strength: 60 },
            locked: false,
            hidden: false,
            status: 'complete',
            missing: [],
            effectiveStatus: 'complete',
          },
          parentId: 'node_sem',
        },
      );

      expect(res).toEqual({
        success: false,
        reasonCode: 'PARENT_INCOMPLETE',
        message: 'Parent semester is incomplete',
        fixHint: { nodeId: 'node_sem', field: 'startDate' },
      });
    });

    it('should reject modification from student or read-only role', async () => {
      const client = {
        data: { user: { id: 'user_student', role: 'STUDENT' } },
      };

      const res = await gateway.handleNodeAdd(
        client as unknown as AuthenticatedSocket,
        {
          projectId: 'proj_1',
          node: { id: 'test' } as unknown as BlueprintNodeDto,
        },
      );

      expect(res).toEqual(
        expect.objectContaining({
          success: false,
          reasonCode: 'PERMISSION_DENIED',
        }),
      );
    });
  });

  describe('Non-Critical Operations (Redis First + Write-Behind Coalescing)', () => {
    it('should update Redis immediately and enqueue write-behind on node:move', async () => {
      const client = {
        data: { user: { id: 'user_1', role: 'DESIGNER' } },
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      };

      mockCacheService.get.mockResolvedValueOnce({
        nodes: [{ id: 'node_1', position: { x: 0, y: 0 } }],
      });

      const res = await gateway.handleNodeMove(
        client as unknown as AuthenticatedSocket,
        {
          projectId: 'proj_1',
          nodeId: 'node_1',
          position: { x: 150, y: 300 },
        },
      );

      expect(res).toEqual({ success: true });
      expect(mockCacheService.set).toHaveBeenCalled();
      expect(mockWriteBehindService.enqueue).toHaveBeenCalledWith(
        'node',
        'node_1',
        { position: { x: 150, y: 300 } },
        'proj_1',
      );
      expect(client.to).toHaveBeenCalledWith('project:proj_1');
    });

    it('should update Redis, enqueue write-behind, and recompute status on node:update', async () => {
      const client = {
        data: { user: { id: 'user_1', role: 'DESIGNER' } },
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      };

      mockCacheService.get.mockResolvedValueOnce({
        nodes: [{ id: 'node_dept', data: { name: 'CS' } }],
      });

      mockBlueprintService.getGraph.mockResolvedValueOnce({
        nodes: [
          {
            id: 'node_dept',
            data: { name: 'Computer Science', code: 'CSE' },
            status: 'complete',
            missing: [],
            effectiveStatus: 'complete',
          },
        ],
        edges: [],
      });

      mockCompletionService.recomputeGraph.mockReturnValueOnce({
        updatedNodes: [],
        changes: [
          {
            nodeId: 'node_dept',
            status: 'complete',
            missing: [],
            effectiveStatus: 'complete',
          },
        ],
      });

      const res = await gateway.handleNodeUpdate(
        client as unknown as AuthenticatedSocket,
        {
          projectId: 'proj_1',
          nodeId: 'node_dept',
          data: { code: 'CSE' },
        },
      );

      expect(res).toEqual({ success: true });
      expect(mockWriteBehindService.enqueue).toHaveBeenCalledWith(
        'node',
        'node_dept',
        { data: { code: 'CSE' } },
        'proj_1',
      );
      expect(mockCompletionService.recomputeGraph).toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith('project:proj_1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        SocketEvents.NODE_STATUS_CHANGED,
        expect.objectContaining({
          nodeId: 'node_dept',
          status: 'complete',
        }),
      );
    });
  });

  describe('BlueprintWriteProcessor (Coalesced DB Persistence)', () => {
    it('should persist node update to MongoDB and decrement pending writes', async () => {
      const job = {
        id: 'node:node_1',
        data: {
          entity: 'node',
          id: 'node_1',
          projectId: 'proj_1',
          payload: {
            position: { x: 200, y: 400 },
          },
          timestamp: Date.now(),
        },
      };

      mockBlueprintRepo.updateNode.mockResolvedValueOnce(true);

      const res = await processor.process(
        job as unknown as Job<SyncNodeJobData>,
      );

      expect(res).toEqual({ success: true });
      expect(mockBlueprintRepo.updateNode).toHaveBeenCalledWith(
        'proj_1',
        'node_1',
        {
          position: { x: 200, y: 400 },
          data: undefined,
        },
      );
      expect(
        mockWriteBehindService.decrementPendingWrites,
      ).toHaveBeenCalledWith('proj_1');
    });
  });
});
