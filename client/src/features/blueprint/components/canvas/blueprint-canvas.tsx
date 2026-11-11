// React component for blueprint-canvas with gated add and connect-end creation.
'use client';

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Connection,
  Node,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  OnSelectionChangeParams,
  useReactFlow,
  FinalConnectionState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './node-factory';
import { DottedEdge } from './dotted-edge';
import { BlueprintContextMenu } from './blueprint-context-menu';
import { BlueprintFloatingAlignBar } from './blueprint-floating-align-bar';
import { FloatingToolbar } from '../toolbar/floating-toolbar';
import { NodeLibraryPanel } from '../palette/node-library-panel';
import { NodeIssuesCard } from './node-issues-card';
import { ConnectEndMenu } from './connect-end-menu';
import { FirstRunHint } from '../hint/first-run-hint';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useGateValidation } from '../../hooks/use-gate-validation';
import { useBlueprintCommands } from '../../hooks/use-blueprint-commands';
import { useGuidedMode } from '../../hooks/use-guided-mode';
import { canAddChild, ALLOWED_PARENTS } from '../../can-add-child';
import { createChildNode } from '../../create-child-node';
import { toast } from '@/components/ui/toast';
import type { BlueprintCanvasNode, BlueprintCanvasEdge } from '../../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';

const edgeTypes = {
  default: DottedEdge,
  dotted: DottedEdge,
};

interface BlueprintCanvasProps {
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onAddEdge: (source: string, target: string) => Promise<{ success: boolean }>;
  onAddNode: (
    type: BlueprintNodeType,
    parentId?: string,
    position?: { x: number; y: number },
    data?: Record<string, unknown>,
  ) => Promise<{ success: boolean; reasonCode?: string; message?: string }>;
  onCursorMove: (x: number, y: number) => void;
}

/** React component rendering blueprint canvas. */
export function BlueprintCanvas({
  onMoveNode,
  onAddEdge,
  onAddNode,
  onCursorMove,
}: BlueprintCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const projectId = useBlueprintStore((s) => s.projectId);
  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const setNodes = useBlueprintStore((s) => s.setNodes);
  const setEdges = useBlueprintStore((s) => s.setEdges);
  const selectNode = useBlueprintStore((s) => s.selectNode);
  const selectEdge = useBlueprintStore((s) => s.selectEdge);
  const setSelectedNodeIds = useBlueprintStore((s) => s.setSelectedNodeIds);
  const selectAll = useBlueprintStore((s) => s.selectAll);
  const remoteCursors = useBlueprintStore((s) => s.remoteCursors);
  const setImpactPreviewNode = useBlueprintStore((s) => s.setImpactPreviewNode);
  const setContextMenu = useBlueprintStore((s) => s.setContextMenu);
  const clipboard = useBlueprintStore((s) => s.clipboard);
  const setClipboard = useBlueprintStore((s) => s.setClipboard);
  const isCanvasLocked = useBlueprintStore((s) => s.isCanvasLocked);
  const gridSize = useBlueprintStore((s) => s.gridSize);
  const focusModeNodeId = useBlueprintStore((s) => s.focusModeNodeId);
  const setFocusModeNodeId = useBlueprintStore((s) => s.setFocusModeNodeId);
  const toggleNodeLock = useBlueprintStore((s) => s.toggleNodeLock);
  const toggleNodeHidden = useBlueprintStore((s) => s.toggleNodeHidden);
  const setIsShortcutsOpen = useBlueprintStore((s) => s.setIsShortcutsOpen);
  const isMinimapOpen = useBlueprintStore((s) => s.isMinimapOpen);
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const setActiveTab = useBlueprintStore((s) => s.setActiveTab);
  const pushCommand = useBlueprintStore((s) => s.pushCommand);

  const { screenToFlowPosition } = useReactFlow();

  const { isValidConnection } = useGateValidation(nodes, edges);
  const { undo, redo, canUndo, canRedo } = useBlueprintCommands();
  const { goToNextStep } = useGuidedMode();
  const incompleteCount = nodes.filter((n) => n.data.effectiveStatus === 'incomplete').length;

  // Drag and drop state from library
  const [activeDragType, setActiveDragType] = useState<BlueprintNodeType | null>(null);
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
  const [dragReason, setDragReason] = useState<{
    text: string;
    x: number;
    y: number;
    targetNodeId?: string | undefined;
    showConfigButton?: boolean | undefined;
  } | null>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Connect-end menu state
  const [connectEndState, setConnectEndState] = useState<{
    isOpen: boolean;
    sourceNode: BlueprintCanvasNode | null;
    screenPosition: { x: number; y: number } | null;
    flowPosition: { x: number; y: number } | null;
  }>({
    isOpen: false,
    sourceNode: null,
    screenPosition: null,
    flowPosition: null,
  });

  // Unified child node creation orchestrator
  const handleCreateChild = useCallback(
    async (
      type: BlueprintNodeType,
      parentId?: string | null,
      position?: { x: number; y: number },
    ) => {
      const res = await createChildNode({
        parentId,
        type,
        position,
        nodes,
        edges,
        isCanvasLocked,
        projectId,
        onAddNodeSocket: onAddNode,
        onAddEdgeSocket: onAddEdge,
        onDeleteNodeSocket: async () => ({ success: true }),
        setNodes,
        setEdges,
        selectNode,
        setActiveTab,
        pushCommand,
      });

      if (!res.success) {
        toast.error('Cannot add node', res.validation.reason || 'Operation rejected');
        if (res.validation.fix?.targetNodeId) {
          selectNode(res.validation.fix.targetNodeId);
          setActiveTab('config');
        }
      }

      return res;
    },
    [
      nodes,
      edges,
      isCanvasLocked,
      projectId,
      onAddNode,
      onAddEdge,
      setNodes,
      setEdges,
      selectNode,
      setActiveTab,
      pushCommand,
    ],
  );

  useEffect(() => {
    const handleDragStart = (e: Event) => {
      const { type } = (e as CustomEvent<{ type: BlueprintNodeType }>).detail;
      setActiveDragType(type);
    };

    const handleDragEnd = () => {
      setActiveDragType(null);
      setIsCanvasDragOver(false);
      setDragReason(null);
    };

    const handleDragReason = (e: Event) => {
      const detail = (e as CustomEvent<{
        reason: string;
        clientX: number;
        clientY: number;
        targetNodeId?: string | undefined;
        showConfigButton?: boolean | undefined;
      }>).detail;

      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);

      setDragReason({
        text: detail.reason,
        x: detail.clientX,
        y: detail.clientY,
        targetNodeId: detail.targetNodeId,
        showConfigButton: detail.showConfigButton,
      });

      // Auto-hide chip after 4 seconds
      autoHideTimerRef.current = setTimeout(() => {
        setDragReason(null);
      }, 4000);
    };

    const handleDragReasonClear = () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      setDragReason(null);
    };

    window.addEventListener('slotly:drag-node-start', handleDragStart);
    window.addEventListener('slotly:drag-node-end', handleDragEnd);
    window.addEventListener('slotly:drag-reason', handleDragReason);
    window.addEventListener('slotly:drag-reason-clear', handleDragReasonClear);

    return () => {
      window.removeEventListener('slotly:drag-node-start', handleDragStart);
      window.removeEventListener('slotly:drag-node-end', handleDragEnd);
      window.removeEventListener('slotly:drag-reason', handleDragReason);
      window.removeEventListener('slotly:drag-reason-clear', handleDragReasonClear);
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, []);

  // Node Issues Card Hover & Focus state
  const [activeIssueNodeId, setActiveIssueNodeId] = useState<string | null>(null);
  const [issueAnchorRect, setIssueAnchorRect] = useState<DOMRect | null>(null);
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeIssueNode = useMemo(
    () => nodes.find((n) => n.id === activeIssueNodeId) || null,
    [nodes, activeIssueNodeId],
  );

  useEffect(() => {
    const handleNodeHover = (e: Event) => {
      const { nodeId } = (e as CustomEvent<{ nodeId: string }>).detail;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);

      openTimerRef.current = setTimeout(() => {
        const el = document.querySelector<HTMLElement>(`[data-testid="blueprint-node-${nodeId}"]`);
        if (el) {
          setIssueAnchorRect(el.getBoundingClientRect());
          setActiveIssueNodeId(nodeId);
        }
      }, 150);
    };

    const handleNodeLeave = () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

      closeTimerRef.current = setTimeout(() => {
        setActiveIssueNodeId(null);
      }, 100);
    };

    const handleNodeFocus = (e: Event) => {
      const { nodeId } = (e as CustomEvent<{ nodeId: string }>).detail;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);

      const el = document.querySelector<HTMLElement>(`[data-testid="blueprint-node-${nodeId}"]`);
      if (el) {
        setIssueAnchorRect(el.getBoundingClientRect());
        setActiveIssueNodeId(nodeId);
      }
    };

    const handleNodeBlur = () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

      closeTimerRef.current = setTimeout(() => {
        setActiveIssueNodeId(null);
      }, 100);
    };

    window.addEventListener('slotly:node-hover', handleNodeHover);
    window.addEventListener('slotly:node-leave', handleNodeLeave);
    window.addEventListener('slotly:node-focus', handleNodeFocus);
    window.addEventListener('slotly:node-blur', handleNodeBlur);

    return () => {
      window.removeEventListener('slotly:node-hover', handleNodeHover);
      window.removeEventListener('slotly:node-leave', handleNodeLeave);
      window.removeEventListener('slotly:node-focus', handleNodeFocus);
      window.removeEventListener('slotly:node-blur', handleNodeBlur);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleNodeDragStart = useCallback(() => {
    setActiveIssueNodeId(null);
  }, []);

  const handleMoveStart = useCallback(() => {
    setActiveIssueNodeId(null);
  }, []);

  // Listen for custom "slotly:add-child" event dispatched from Node "+" button or DnD
  useEffect(() => {
    const handleAddChild = async (e: Event) => {
      const customEvent = e as CustomEvent<{ parentId: string; childType: BlueprintNodeType }>;
      const { parentId, childType } = customEvent.detail;
      const parentNode = nodes.find((n) => n.id === parentId);
      const position = parentNode
        ? { x: parentNode.position.x + 20, y: parentNode.position.y + 160 }
        : { x: 200, y: 200 };

      await handleCreateChild(childType, parentId, position);
    };

    window.addEventListener('slotly:add-child', handleAddChild);
    return () => window.removeEventListener('slotly:add-child', handleAddChild);
  }, [nodes, handleCreateChild]);

  // Handle drag stop (non-critical write-behind update)
  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      if (isCanvasLocked) return;
      onMoveNode(node.id, node.position);
    },
    [isCanvasLocked, onMoveNode],
  );

  // Connect edge with G2 validation gate
  const handleConnect = useCallback(
    async (connection: Connection) => {
      if (isCanvasLocked) return;
      if (!isValidConnection(connection)) {
        return;
      }
      if (connection.source && connection.target) {
        await onAddEdge(connection.source, connection.target);
      }
    },
    [isCanvasLocked, isValidConnection, onAddEdge],
  );

  // Connect-end handler: when connection is released on empty canvas
  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      if (isCanvasLocked) return;
      // If it connected to a valid handle/node, connectionState.isValid is true
      if (connectionState.isValid) return;

      const sourceId = connectionState.fromNode?.id;
      if (!sourceId) return;

      const source = nodes.find((n) => n.id === sourceId);
      if (!source) return;

      const clientX = 'clientX' in event ? event.clientX : event.touches?.[0]?.clientX ?? 0;
      const clientY = 'clientY' in event ? event.clientY : event.touches?.[0]?.clientY ?? 0;

      const flowPos = screenToFlowPosition({
        x: clientX,
        y: clientY,
      });

      setConnectEndState({
        isOpen: true,
        sourceNode: source,
        screenPosition: { x: clientX, y: clientY },
        flowPosition: flowPos,
      });
    },
    [isCanvasLocked, nodes, screenToFlowPosition],
  );

  // Node and edge change handlers
  const handleNodesChange = useCallback(
    (changes: NodeChange<BlueprintCanvasNode>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<BlueprintCanvasEdge>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges],
  );

  const handleSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const selectedNodes = params.nodes as BlueprintCanvasNode[];
      const selectedEdges = params.edges as BlueprintCanvasEdge[];

      if (selectedNodes.length === 1) {
        selectNode(selectedNodes[0]!.id);
        setSelectedNodeIds([selectedNodes[0]!.id]);
      } else if (selectedNodes.length > 1) {
        setSelectedNodeIds(selectedNodes.map((n) => n.id));
        selectNode(null);
      } else {
        setSelectedNodeIds([]);
        selectNode(null);
      }

      if (selectedEdges.length === 1) {
        selectEdge(selectedEdges[0]!.id);
      } else {
        selectEdge(null);
      }
    },
    [selectNode, selectEdge, setSelectedNodeIds],
  );

  const handleCopy = useCallback(
    (node: BlueprintCanvasNode) => {
      const descendantIds = new Set<string>([node.id]);
      const queue = [node.id];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        edges
          .filter((e) => e.source === curr)
          .forEach((e) => {
            if (!descendantIds.has(e.target)) {
              descendantIds.add(e.target);
              queue.push(e.target);
            }
          });
      }

      const subtreeNodes = nodes.filter((n) => descendantIds.has(n.id));
      const subtreeEdges = edges.filter(
        (e) => descendantIds.has(e.source) && descendantIds.has(e.target),
      );

      setClipboard({ nodes: subtreeNodes, edges: subtreeEdges });
      toast.success('Copied to clipboard', `Copied ${node.data.label} and its children.`);
    },
    [nodes, edges, setClipboard],
  );

  const handlePaste = useCallback(
    async (targetParentId?: string) => {
      if (!clipboard || clipboard.nodes.length === 0) return;
      if (isCanvasLocked) {
        toast.info('Canvas locked', 'Canvas is locked.');
        return;
      }

      const rootNode = clipboard.nodes[0]!;
      const check = canAddChild(nodes, targetParentId, rootNode.data.nodeType, isCanvasLocked);
      if (!check.ok) {
        toast.error('Cannot paste here', check.reason || 'Hierarchy gate failed');
        return;
      }

      const idMap = new Map<string, string>();
      clipboard.nodes.forEach((n) => idMap.set(n.id, crypto.randomUUID()));

      for (const origNode of clipboard.nodes) {
        const isSubtreeRoot = origNode.id === rootNode.id;
        const newParentId = isSubtreeRoot ? targetParentId : idMap.get(origNode.data.parentId || '');
        const newPos = { x: origNode.position.x + 40, y: origNode.position.y + 40 };

        await handleCreateChild(origNode.data.nodeType, newParentId, newPos);
      }

      toast.success('Pasted subtree', `Created duplicate of ${rootNode.data.label}.`);
    },
    [clipboard, isCanvasLocked, nodes, handleCreateChild],
  );

  const handleDuplicate = useCallback(
    async (node: BlueprintCanvasNode) => {
      handleCopy(node);
      await handlePaste(node.data.parentId);
    },
    [handleCopy, handlePaste],
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      if (isInput) return;

      const selected = nodes.find((n) => n.selected);

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected) {
          setImpactPreviewNode(selected);
        }
      } else if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAll();
      } else if (e.ctrlKey && e.key === 'c') {
        if (selected) {
          e.preventDefault();
          handleCopy(selected);
        }
      } else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        void handlePaste(selected?.id);
      } else if (e.ctrlKey && e.key === 'd') {
        if (selected) {
          e.preventDefault();
          void handleDuplicate(selected);
        }
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (canUndo) void undo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        if (canRedo) void redo();
      } else if (e.key === 'f' || e.key === 'F') {
        if (selected) {
          e.preventDefault();
          setFocusModeNodeId(focusModeNodeId === selected.id ? null : selected.id);
        }
      } else if (e.key === 'l' || e.key === 'L') {
        if (selected) {
          e.preventDefault();
          toggleNodeLock(selected.id);
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (selected) {
          e.preventDefault();
          toggleNodeHidden(selected.id);
        }
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    },
    [
      nodes,
      setImpactPreviewNode,
      selectAll,
      handleCopy,
      handlePaste,
      handleDuplicate,
      undo,
      redo,
      canUndo,
      canRedo,
      focusModeNodeId,
      setFocusModeNodeId,
      toggleNodeLock,
      toggleNodeHidden,
      setIsShortcutsOpen,
    ],
  );

  // Drag over handler for canvas drop
  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!activeDragType) return;

      if (isCanvasLocked) {
        event.dataTransfer.dropEffect = 'none';
        setDragReason({
          text: 'Canvas is locked. Unlock canvas to add or modify nodes.',
          x: event.clientX,
          y: event.clientY,
        });
        return;
      }

      // Root Institution on empty canvas
      if (activeDragType === 'institution') {
        const check = canAddChild(nodes, null, 'institution', isCanvasLocked);
        if (check.ok) {
          event.dataTransfer.dropEffect = 'copy';
          setIsCanvasDragOver(true);
          setDragReason(null);
          return;
        }
      }

      // Check complete valid parents
      const allowedParents = ALLOWED_PARENTS[activeDragType] || [];
      const validParents = nodes.filter((n) => allowedParents.includes(n.data.nodeType));
      const completeParents = validParents.filter(
        (n) => (n.data.effectiveStatus || n.data.status) === 'complete',
      );

      if (completeParents.length === 1) {
        event.dataTransfer.dropEffect = 'copy';
        setIsCanvasDragOver(true);
        setDragReason(null);
      } else if (completeParents.length > 1) {
        event.dataTransfer.dropEffect = 'none';
        setIsCanvasDragOver(false);
        setDragReason({
          text: 'Drop onto the parent you want',
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        event.dataTransfer.dropEffect = 'none';
        setIsCanvasDragOver(false);
        const check = canAddChild(nodes, null, activeDragType, isCanvasLocked);
        setDragReason({
          text: check.reason || 'No valid parent available',
          x: event.clientX,
          y: event.clientY,
          showConfigButton: check.code === 'parent-incomplete',
          targetNodeId: check.fix?.targetNodeId,
        });
      }
    },
    [activeDragType, isCanvasLocked, nodes],
  );

  // Drop node from palette onto empty canvas
  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      setIsCanvasDragOver(false);
      setDragReason(null);

      const nodeType = (event.dataTransfer.getData('application/x-slotly-node') ||
        event.dataTransfer.getData('application/slotly-node-type') ||
        activeDragType) as BlueprintNodeType;

      if (!nodeType) return;

      if (isCanvasLocked) {
        toast.info('Canvas locked', 'Canvas is locked.');
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX - 116,
        y: event.clientY - 32,
      });

      // 1. Root Institution drop
      if (nodeType === 'institution') {
        await handleCreateChild('institution', null, position);
        return;
      }

      // 2. Child types drop onto empty canvas
      const allowedParents = ALLOWED_PARENTS[nodeType] || [];
      const validParents = nodes.filter((n) => allowedParents.includes(n.data.nodeType));
      const completeParents = validParents.filter(
        (n) => (n.data.effectiveStatus || n.data.status) === 'complete',
      );

      if (completeParents.length === 1) {
        const parent = completeParents[0]!;
        const res = await handleCreateChild(nodeType, parent.id, position);
        if (res.success) {
          toast.success(
            `Added ${nodeType} under ${parent.data.label}`,
            'Click Undo in the toolbar to revert.',
          );
        }
      } else if (completeParents.length > 1) {
        toast.info('Multiple parents exist', 'Drop onto the parent you want.');
      } else {
        const check = canAddChild(nodes, null, nodeType, isCanvasLocked);
        toast.error('Cannot add node', check.reason || 'No valid complete parent exists.');
      }
    },
    [activeDragType, isCanvasLocked, screenToFlowPosition, handleCreateChild, nodes],
  );

  // Mouse move for multiplayer cursor sharing
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;
      onCursorMove(e.clientX - bounds.left, e.clientY - bounds.top);
    },
    [onCursorMove],
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="relative w-full h-full bg-[#0A0A0A] select-none"
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onConnectEnd={handleConnectEnd}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onMoveStart={handleMoveStart}
        onNodeClick={(_, node) => selectNode(node.id)}
        onEdgeClick={(_, edge) => selectEdge(edge.id)}
        onSelectionChange={handleSelectionChange}
        onPaneClick={() => {
          selectNode(null);
          selectEdge(null);
          setContextMenu(null);
          setActiveIssueNodeId(null);
        }}
        isValidConnection={isValidConnection}
        selectionOnDrag
        nodesDraggable={!isCanvasLocked}
        snapToGrid
        snapGrid={[gridSize, gridSize]}
        fitView
        fitViewOptions={{ maxZoom: 1, minZoom: 0.2, padding: 0.2 }}
        deleteKeyCode={null}
      >
        <Background
          variant={BackgroundVariant.Lines}
          color="rgba(255, 255, 255, 0.03)"
          gap={24}
          size={1}
        />
        {isMinimapOpen && (
          <MiniMap
            nodeColor="#2A2A2A"
            maskColor="rgba(255, 255, 255, 0.06)"
            className="!bg-[#111111] !border !border-[#232323] !rounded-[10px] overflow-hidden !bottom-4 !right-4 shadow-xl"
            style={{ width: 160, height: 100 }}
          />
        )}
      </ReactFlow>

      {/* Subtle corner vignette */}
      <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />

      {/* 1px dashed outline when root drop is valid on empty canvas */}
      {isCanvasDragOver && (
        <div
          data-testid="canvas-drop-active"
          className="pointer-events-none absolute inset-2 z-20 rounded-[16px] border border-dashed border-[#FAFAFA]/40"
        />
      )}

      {/* Floating Drag Reason Chip near cursor */}
      {dragReason && (
        <div
          data-testid="canvas-drag-reason"
          className="pointer-events-auto fixed z-50 px-2.5 py-1.5 rounded-[8px] bg-[#111111]/95 border border-[#383838] text-[12px] font-mono text-[#FAFAFA] shadow-2xl flex items-center gap-2 animate-in fade-in-0 duration-75"
          style={{ left: `${dragReason.x + 16}px`, top: `${dragReason.y + 16}px` }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          <span>{dragReason.text}</span>
          {dragReason.showConfigButton && dragReason.targetNodeId && (
            <button
              type="button"
              onClick={() => {
                selectNode(dragReason.targetNodeId!);
                setActiveTab('config');
                setDragReason(null);
              }}
              className="px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#282828] text-[11px] font-mono text-[#FAFAFA] border border-[#383838] transition-colors"
            >
              Open config
            </button>
          )}
        </div>
      )}

      {/* Floating Vertical Node Library on Left */}
      <NodeLibraryPanel
        onAddNode={(type, parentId) => handleCreateChild(type, parentId)}
      />

      {/* Guided Mode ("Next step") Ghost Button positioned next to Library Rail */}
      {incompleteCount > 0 && (
        <button
          type="button"
          onClick={goToNextStep}
          aria-label="Next incomplete node"
          className="absolute top-4 left-[76px] z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111111]/85 backdrop-blur-sm border border-[#232323] hover:border-[#383838] text-xs font-mono text-[#FAFAFA] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-pulse" />
          <span>Next step</span>
          <span className="text-[#8A8A8A] text-[10px]">({incompleteCount} incomplete)</span>
        </button>
      )}

      {/* Node Issues Hover & Focus Card */}
      <NodeIssuesCard
        node={activeIssueNode}
        anchorRect={issueAnchorRect}
        isOpen={Boolean(activeIssueNodeId)}
        onClose={() => setActiveIssueNodeId(null)}
        onMouseEnter={() => {
          if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        }}
        onMouseLeave={() => {
          closeTimerRef.current = setTimeout(() => {
            setActiveIssueNodeId(null);
          }, 100);
        }}
      />

      {/* Connect-End Menu for Adding Nodes on empty canvas drop */}
      <ConnectEndMenu
        isOpen={connectEndState.isOpen}
        sourceNode={connectEndState.sourceNode}
        position={connectEndState.screenPosition}
        onSelectType={async (childType) => {
          const parentId = connectEndState.sourceNode?.id;
          const pos = connectEndState.flowPosition || undefined;
          setConnectEndState({
            isOpen: false,
            sourceNode: null,
            screenPosition: null,
            flowPosition: null,
          });
          await handleCreateChild(childType, parentId, pos);
        }}
        onClose={() =>
          setConnectEndState({
            isOpen: false,
            sourceNode: null,
            screenPosition: null,
            flowPosition: null,
          })
        }
        onOpenConfig={(nodeId) => {
          selectNode(nodeId);
          setActiveTab('config');
        }}
      />

      {/* First-Run Onboarding Hint for Empty Canvas */}
      <FirstRunHint />

      {/* Floating Bottom Center Pill Toolbar */}
      <FloatingToolbar
        onCopy={() => {
          const selected = nodes.find((n) => n.id === selectedNodeId);
          if (selected) handleCopy(selected);
        }}
        onPaste={handlePaste}
        onDuplicate={() => {
          const selected = nodes.find((n) => n.id === selectedNodeId);
          if (selected) handleDuplicate(selected);
        }}
      />

      {/* Floating Align & Distribute Toolbar */}
      <BlueprintFloatingAlignBar />

      {/* Context Menu */}
      <BlueprintContextMenu
        onAddChild={(parentId, childType) => {
          const parent = nodes.find((n) => n.id === parentId);
          const position = parent
            ? { x: parent.position.x + 20, y: parent.position.y + 160 }
            : { x: 200, y: 200 };
          void handleCreateChild(childType, parentId, position);
        }}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDuplicate={handleDuplicate}
      />

      {/* Multiplayer Remote Cursors Overlay */}
      {Object.values(remoteCursors).map((cursor) => (
        <div
          key={cursor.userId}
          className="pointer-events-none absolute z-50 transition-all duration-75 flex items-center gap-1"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full border border-black shadow"
            style={{ backgroundColor: cursor.color }}
          />
          <span
            className="font-mono text-[9px] px-1 py-0.2 rounded text-[#0A0A0A] font-semibold"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </span>
        </div>
      ))}
    </div>
  );
}
