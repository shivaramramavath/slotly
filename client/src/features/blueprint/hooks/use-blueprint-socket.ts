import { useEffect, useRef, useCallback } from 'react';
import { BlueprintSocketService } from '../services/blueprint-socket.service';
import { useBlueprintStore } from '../store/blueprint.store';
import { toast } from '@/components/ui/toast';
import type { BlueprintNodeType } from '@slotly/contracts';

export function useBlueprintSocket(projectId: string) {
  const socketRef = useRef<BlueprintSocketService | null>(null);

  const setSocketStatus = useBlueprintStore((s) => s.setSocketStatus);
  const setPresenceUsers = useBlueprintStore((s) => s.setPresenceUsers);
  const updateRemoteCursor = useBlueprintStore((s) => s.updateRemoteCursor);
  const setNodeLock = useBlueprintStore((s) => s.setNodeLock);
  const removeNodeLock = useBlueprintStore((s) => s.removeNodeLock);
  const updateNodeStatus = useBlueprintStore((s) => s.updateNodeStatus);
  const updateNodePosition = useBlueprintStore((s) => s.updateNodePosition);
  const updateNodeData = useBlueprintStore((s) => s.updateNodeData);
  const setRevision = useBlueprintStore((s) => s.setRevision);
  const setConflictState = useBlueprintStore((s) => s.setConflictState);
  const setAutosaveStatus = useBlueprintStore((s) => s.setAutosaveStatus);
  const setNodes = useBlueprintStore((s) => s.setNodes);
  const setEdges = useBlueprintStore((s) => s.setEdges);
  const setFixHint = useBlueprintStore((s) => s.setFixHint);
  const selectNode = useBlueprintStore((s) => s.selectNode);

  useEffect(() => {
    if (!projectId) return;

    const socketService = new BlueprintSocketService({
      onStatusChange: (status) => {
        setSocketStatus(status);
        if (status === 'disconnected') {
          setAutosaveStatus('offline');
        } else if (status === 'connected') {
          setAutosaveStatus('saved');
        }
      },
      onPresenceChange: ({ users }) => {
        setPresenceUsers(users);
      },
      onCursorUpdate: (payload: { x: number; y: number; userId?: string; name?: string; color?: string }) => {
        if (payload.userId) {
          updateRemoteCursor({
            userId: payload.userId,
            name: payload.name || 'Collaborator',
            color: payload.color || '#FACC15',
            x: payload.x,
            y: payload.y,
            lastActive: Date.now(),
          });
        }
      },
      onNodeLocked: ({ nodeId, userId, userName }) => {
        setNodeLock({ nodeId, userId, userName });
      },
      onNodeUnlocked: ({ nodeId }) => {
        removeNodeLock(nodeId);
      },
      onNodeStatusChanged: ({ nodeId, status, effectiveStatus, missing }) => {
        updateNodeStatus(nodeId, status, effectiveStatus, missing);
      },
      onOpsApplied: ({ revision, applied }) => {
        setRevision(revision);
        // Refresh nodes if any structural change
        applied.forEach((op) => {
          if (op.type === 'delete_node' && op.targetId) {
            setNodes((prev) => prev.filter((n) => n.id !== op.targetId));
            setEdges((prev) => prev.filter((e) => e.source !== op.targetId && e.target !== op.targetId));
          } else if (op.type === 'delete_edge' && op.targetId) {
            setEdges((prev) => prev.filter((e) => e.id !== op.targetId));
          }
        });
      },
      onRevisionConflict: ({ currentRevision, rejectedRevision, message }) => {
        setConflictState({ currentRevision, rejectedRevision, message });
        setRevision(currentRevision);
        toast.error('Revision Conflict', message || 'Graph has been updated by another user.');
      },
      onNodeMoved: ({ nodeId, position }) => {
        updateNodePosition(nodeId, position);
      },
      onNodeUpdated: ({ nodeId, data }) => {
        updateNodeData(nodeId, { config: data });
      },
    });

    socketService.connect(projectId);
    socketRef.current = socketService;

    return () => {
      socketService.disconnect();
      socketRef.current = null;
    };
  }, [
    projectId,
    setSocketStatus,
    setPresenceUsers,
    updateRemoteCursor,
    setNodeLock,
    removeNodeLock,
    updateNodeStatus,
    updateNodePosition,
    updateNodeData,
    setRevision,
    setAutosaveStatus,
    setConflictState,
    setNodes,
    setEdges,
  ]);

  const addNode = useCallback(
    async (
      type: BlueprintNodeType,
      parentId?: string,
      position = { x: 100, y: 100 },
      data: Record<string, unknown> = {},
    ) => {
      if (!socketRef.current) return { success: false };

      const res = await socketRef.current.addNode({
        node: {
          id: crypto.randomUUID(),
          projectId,
          type,
          position,
          data,
          status: 'empty',
          effectiveStatus: 'empty',
          missing: [],
          locked: false,
          hidden: false,
        },
        parentId,
      });

      if (!res.success) {
        toast.fromErrorCode(res.reasonCode || 'GATE_FAILED', res.message || 'Operation rejected');
        if (res.fixHint?.nodeId) {
          selectNode(res.fixHint.nodeId);
          setFixHint(res.fixHint);
        }
      }

      return res;
    },
    [projectId, selectNode, setFixHint],
  );

  const deleteNode = useCallback(
    async (nodeId: string) => {
      if (!socketRef.current) return { success: false };

      const res = await socketRef.current.deleteNode(nodeId);
      if (!res.success) {
        toast.fromErrorCode(res.reasonCode || 'GATE_FAILED', res.message || 'Failed to delete node');
      } else {
        setNodes((prev) => prev.filter((n) => n.id !== nodeId));
        setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
        toast.success('Node deleted', 'Cascade delete removed node and downstream links.');
      }
      return res;
    },
    [setNodes, setEdges],
  );

  const addEdge = useCallback(
    async (source: string, target: string) => {
      if (!socketRef.current) return { success: false };

      const res = await socketRef.current.addEdge({
        edge: {
          id: crypto.randomUUID(),
          projectId,
          source,
          target,
          type: 'hierarchy',
        },
      });

      if (!res.success) {
        toast.fromErrorCode(res.reasonCode || 'GATE_FAILED', res.message || 'Connection rejected');
        if (res.fixHint?.nodeId) {
          selectNode(res.fixHint.nodeId);
          setFixHint(res.fixHint);
        }
      }

      return res;
    },
    [projectId, selectNode, setFixHint],
  );

  const deleteEdge = useCallback(
    async (edgeId: string) => {
      if (!socketRef.current) return { success: false };

      const res = await socketRef.current.deleteEdge(edgeId);
      if (!res.success) {
        toast.fromErrorCode(res.reasonCode || 'GATE_FAILED', res.message || 'Failed to delete connection');
      } else {
        setEdges((prev) => prev.filter((e) => e.id !== edgeId));
      }
      return res;
    },
    [setEdges],
  );

  const moveNode = useCallback((nodeId: string, position: { x: number; y: number }) => {
    updateNodePosition(nodeId, position);
    socketRef.current?.moveNode(nodeId, position);
  }, [updateNodePosition]);

  const updateNodeConfig = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setAutosaveStatus('saving');
      updateNodeData(nodeId, { config: data });
      socketRef.current?.updateNode(nodeId, data);
      setTimeout(() => setAutosaveStatus('saved'), 400);
    },
    [updateNodeData, setAutosaveStatus],
  );

  const lockNode = useCallback(async (nodeId: string) => {
    return socketRef.current?.lockNode(nodeId) || { success: false };
  }, []);

  const unlockNode = useCallback(async (nodeId: string) => {
    return socketRef.current?.unlockNode(nodeId) || { success: false };
  }, []);

  const sendCursor = useCallback((x: number, y: number) => {
    socketRef.current?.sendCursor(x, y);
  }, []);

  return {
    addNode,
    deleteNode,
    addEdge,
    deleteEdge,
    moveNode,
    updateNodeConfig,
    lockNode,
    unlockNode,
    sendCursor,
  };
}
