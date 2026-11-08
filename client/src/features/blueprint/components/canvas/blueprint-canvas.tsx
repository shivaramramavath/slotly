// React component for blueprint-canvas.
'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Node,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './node-factory';
import { BlueprintContextMenu } from './blueprint-context-menu';
import { BlueprintFloatingAlignBar } from './blueprint-floating-align-bar';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useGateValidation } from '../../hooks/use-gate-validation';
import { useBlueprintCommands } from '../../hooks/use-blueprint-commands';
import { toast } from '@/components/ui/toast';
import type { BlueprintCanvasNode, BlueprintCanvasEdge } from '../../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';

interface BlueprintCanvasProps {
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onAddEdge: (source: string, target: string) => Promise<{ success: boolean }>;
  onAddNode: (type: BlueprintNodeType, parentId?: string, position?: { x: number; y: number }) => Promise<{ success: boolean }>;
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

  const { isValidConnection, canAddNodeType, getNodeById } = useGateValidation(nodes, edges);
  const { undo, redo, canUndo, canRedo } = useBlueprintCommands();

  // Listen for custom "slotly:add-child" event dispatched from Node "+" button
  useEffect(() => {
    const handleAddChild = (e: Event) => {
      const customEvent = e as CustomEvent<{ parentId: string; childType: BlueprintNodeType }>;
      const { parentId, childType } = customEvent.detail;
      const parentNode = nodes.find((n) => n.id === parentId);
      const position = parentNode
        ? { x: parentNode.position.x + 20, y: parentNode.position.y + 160 }
        : { x: 200, y: 200 };

      void onAddNode(childType, parentId, position);
    };

    window.addEventListener('slotly:add-child', handleAddChild);
    return () => window.removeEventListener('slotly:add-child', handleAddChild);
  }, [nodes, onAddNode]);

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

  // Node and edge change handlers
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (isCanvasLocked) {
        // filter out position changes when canvas is locked
        const nonPositionChanges = changes.filter((c) => c.type !== 'position');
        setNodes((nds) => applyNodeChanges(nonPositionChanges, nds) as BlueprintCanvasNode[]);
        return;
      }
      setNodes((nds) => applyNodeChanges(changes, nds) as BlueprintCanvasNode[]);
    },
    [isCanvasLocked, setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (isCanvasLocked) return;
      setEdges((eds) => applyEdgeChanges(changes, eds) as BlueprintCanvasEdge[]);
    },
    [isCanvasLocked, setEdges],
  );

  // Selection change
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const ids = selectedNodes.map((n) => n.id);
      setSelectedNodeIds(ids);
    },
    [setSelectedNodeIds],
  );

  // Copy subtree
  const handleCopy = useCallback(
    (node: BlueprintCanvasNode) => {
      const getDescendantIds = (parentId: string): string[] => {
        const children = nodes.filter((n) => n.data.parentId === parentId);
        return [...children.map((c) => c.id), ...children.flatMap((c) => getDescendantIds(c.id))];
      };

      const subtreeIds = [node.id, ...getDescendantIds(node.id)];
      const subtreeNodes = nodes.filter((n) => subtreeIds.includes(n.id));
      const subtreeEdges = edges.filter(
        (e) => subtreeIds.includes(e.source) && subtreeIds.includes(e.target),
      );

      setClipboard({ nodes: subtreeNodes, edges: subtreeEdges });
      toast.info('Subtree copied', `Copied '${node.data.label}' (${subtreeNodes.length} nodes).`);
    },
    [nodes, edges, setClipboard],
  );

  // Paste subtree under complete target parent
  const handlePaste = useCallback(
    async (targetParentId?: string) => {
      if (!clipboard || clipboard.nodes.length === 0) {
        toast.info('Clipboard empty', 'Copy a node or subtree first.');
        return;
      }

      const rootToPaste = clipboard.nodes[0]!;
      const parentNode = getNodeById(targetParentId);

      // G1 Creation Gate check
      const check = canAddNodeType(rootToPaste.data.nodeType, parentNode);
      if (!check.allowed) {
        toast.error('Cannot paste here', check.reason || 'Gate condition failed (G1).');
        return;
      }

      const offsetX = parentNode ? parentNode.position.x + 30 : 250;
      const offsetY = parentNode ? parentNode.position.y + 160 : 250;
      const baseOldX = rootToPaste.position.x;
      const baseOldY = rootToPaste.position.y;

      // Create nodes with new IDs
      const idMap = new Map<string, string>();
      for (const oldNode of clipboard.nodes) {
        const newId = crypto.randomUUID();
        idMap.set(oldNode.id, newId);
        const relX = oldNode.position.x - baseOldX;
        const relY = oldNode.position.y - baseOldY;

        const effectiveParent =
          oldNode.id === rootToPaste.id
            ? targetParentId
            : idMap.get(oldNode.data.parentId || '') || targetParentId;

        await onAddNode(
          oldNode.data.nodeType,
          effectiveParent,
          { x: offsetX + relX, y: offsetY + relY },
        );
      }

      toast.success('Pasted subtree', `Created ${clipboard.nodes.length} nodes under '${parentNode?.data.label || 'Root'}'.`);
    },
    [clipboard, getNodeById, canAddNodeType, onAddNode],
  );

  // Duplicate node + subtree
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
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Drop node from palette
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/slotly-node-type') as BlueprintNodeType;
      if (!nodeType) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      const selected = nodes.find((n) => n.selected);
      void onAddNode(nodeType, selected?.id, position);
    },
    [nodes, onAddNode],
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
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_, node) => selectNode(node.id)}
        onEdgeClick={(_, edge) => selectEdge(edge.id)}
        onSelectionChange={handleSelectionChange}
        onPaneClick={() => {
          selectNode(null);
          selectEdge(null);
          setContextMenu(null);
        }}
        isValidConnection={isValidConnection}
        selectionOnDrag
        nodesDraggable={!isCanvasLocked}
        snapToGrid
        snapGrid={[gridSize, gridSize]}
        fitView
        deleteKeyCode={null}
      >
        <Background color="#232323" gap={gridSize} size={1} />
        <Controls className="!bg-[#111111] !border !border-[#232323] !rounded-md overflow-hidden fill-[#FAFAFA]" />
        <MiniMap
          nodeColor={(node) => {
            const status = (node.data as BlueprintCanvasNode['data'])?.effectiveStatus;
            if (status === 'complete') return '#22C55E';
            if (status === 'blocked') return '#3A3A3A';
            return '#FACC15';
          }}
          maskColor="rgba(10, 10, 10, 0.7)"
          className="!bg-[#111111] !border !border-[#232323] !rounded-md overflow-hidden"
        />
      </ReactFlow>

      {/* Floating Align & Distribute Toolbar */}
      <BlueprintFloatingAlignBar />

      {/* Context Menu */}
      <BlueprintContextMenu
        onAddChild={(parentId, childType) => {
          const parent = nodes.find((n) => n.id === parentId);
          const position = parent
            ? { x: parent.position.x + 20, y: parent.position.y + 160 }
            : { x: 200, y: 200 };
          void onAddNode(childType, parentId, position);
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
