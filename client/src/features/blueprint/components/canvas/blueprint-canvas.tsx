// React component for blueprint-canvas.
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './node-factory';
import { DottedEdge } from './dotted-edge';
import { BlueprintContextMenu } from './blueprint-context-menu';
import { BlueprintFloatingAlignBar } from './blueprint-floating-align-bar';
import { FloatingToolbar } from '../toolbar/floating-toolbar';
import { NodeLibraryPanel } from '../palette/node-library-panel';
import { NodeIssuesCard } from './node-issues-card';
import { FirstRunHint } from '../hint/first-run-hint';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useGateValidation } from '../../hooks/use-gate-validation';
import { useBlueprintCommands } from '../../hooks/use-blueprint-commands';
import { useGuidedMode } from '../../hooks/use-guided-mode';
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
  const isMinimapOpen = useBlueprintStore((s) => s.isMinimapOpen);
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const setActiveTab = useBlueprintStore((s) => s.setActiveTab);

  const { screenToFlowPosition } = useReactFlow();

  const { isValidConnection, canAddNodeType, getNodeById } = useGateValidation(nodes, edges);
  const { undo, redo, canUndo, canRedo } = useBlueprintCommands();
  const { goToNextStep } = useGuidedMode();
  const incompleteCount = nodes.filter((n) => n.data.effectiveStatus === 'incomplete').length;

  // Drag and drop state from library
  const [activeDragType, setActiveDragType] = useState<BlueprintNodeType | null>(null);
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
  const [dragReason, setDragReason] = useState<{ text: string; x: number; y: number } | null>(null);

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
      const { reason, clientX, clientY } = (e as CustomEvent<{ reason: string; clientX: number; clientY: number }>).detail;
      setDragReason({ text: reason, x: clientX, y: clientY });
    };

    const handleDragReasonClear = () => {
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

      const res = await onAddNode(childType, parentId, position);
      if (res.success) {
        setActiveTab('config');
      }
    };

    window.addEventListener('slotly:add-child', handleAddChild);
    return () => window.removeEventListener('slotly:add-child', handleAddChild);
  }, [nodes, onAddNode, setActiveTab]);

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

      const check = canAddNodeType(activeDragType, undefined);
      if (check.allowed) {
        event.dataTransfer.dropEffect = 'copy';
        setIsCanvasDragOver(true);
        setDragReason(null);
      } else {
        event.dataTransfer.dropEffect = 'none';
        setIsCanvasDragOver(false);
        const reasonText = check.reason || 'Requires selecting a parent node.';
        setDragReason({
          text: `Drop onto a valid parent node. ${reasonText}`,
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [activeDragType, isCanvasLocked, canAddNodeType],
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
        toast.info('Canvas locked', 'Canvas is locked. Unlock canvas to add or modify nodes.');
        return;
      }

      const check = canAddNodeType(nodeType, undefined);
      if (!check.allowed) {
        toast.error('Cannot add node here', `Drop onto a valid parent node. ${check.reason || ''}`);
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX - 116,
        y: event.clientY - 32,
      });

      const res = await onAddNode(nodeType, undefined, position);
      if (res.success) {
        setActiveTab('config');
      }
    },
    [activeDragType, isCanvasLocked, canAddNodeType, screenToFlowPosition, onAddNode, setActiveTab],
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
          className="pointer-events-none fixed z-50 px-2.5 py-1.5 rounded-[8px] bg-[#111111]/95 border border-[#383838] text-[12px] font-mono text-[#FAFAFA] shadow-2xl flex items-center gap-1.5 animate-in fade-in-0 duration-75"
          style={{ left: `${dragReason.x + 16}px`, top: `${dragReason.y + 16}px` }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          <span>{dragReason.text}</span>
        </div>
      )}

      {/* Floating Vertical Node Library on Left */}
      <NodeLibraryPanel onAddNode={onAddNode} />

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
