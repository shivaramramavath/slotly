// Core node and edge creation orchestrator with validation, inheritance, and single undo command.
import type { BlueprintNodeType } from '@slotly/contracts';
import { canAddChild, type CanAddChildResult } from './can-add-child';
import { getInheritedDataSnapshot } from './inheritance';
import type { BlueprintCanvasNode, BlueprintCanvasEdge, Command } from './types/canvas.types';

export interface CreateChildNodeParams {
  parentId?: string | null | undefined;
  type: BlueprintNodeType;
  position?: { x: number; y: number } | undefined;
  nodes: BlueprintCanvasNode[];
  edges: BlueprintCanvasEdge[];
  isCanvasLocked?: boolean | undefined;
  projectId: string;
  // Execution callbacks
  onAddNodeSocket: (
    type: BlueprintNodeType,
    parentId?: string,
    position?: { x: number; y: number },
    data?: Record<string, unknown>,
  ) => Promise<{ success: boolean; reasonCode?: string; message?: string }>;
  onAddEdgeSocket: (source: string, target: string) => Promise<{ success: boolean }>;
  onDeleteNodeSocket: (nodeId: string) => Promise<{ success: boolean }>;
  setNodes: (updater: (prev: BlueprintCanvasNode[]) => BlueprintCanvasNode[]) => void;
  setEdges: (updater: (prev: BlueprintCanvasEdge[]) => BlueprintCanvasEdge[]) => void;
  selectNode: (nodeId: string | null) => void;
  setActiveTab: (tab: 'config' | 'constraints' | 'ai') => void;
  pushCommand: (command: Command) => void;
}

export interface CreateChildNodeResult {
  success: boolean;
  nodeId?: string | undefined;
  edgeId?: string | undefined;
  validation: CanAddChildResult;
}

/**
 * Single creation function: validates through canAddChild, computes inheritance snapshot,
 * creates node and edge, selects node, switches to Config tab, and registers ONE undo/redo command.
 */
export async function createChildNode(
  params: CreateChildNodeParams,
): Promise<CreateChildNodeResult> {
  const {
    parentId,
    type,
    nodes,
    isCanvasLocked = false,
    onAddNodeSocket,
    onAddEdgeSocket,
    onDeleteNodeSocket,
    setNodes,
    setEdges,
    selectNode,
    setActiveTab,
    pushCommand,
  } = params;

  // 1. Validation check through single pure rule function
  const validation = canAddChild(nodes, parentId, type, isCanvasLocked);
  if (!validation.ok) {
    return { success: false, validation };
  }

  const parent = parentId ? nodes.find((n) => n.id === parentId) : null;

  // 2. Compute inherited data snapshot
  const inheritedData = parent ? getInheritedDataSnapshot(parent, type) : {};
  const initialName = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const mergedConfig = {
    ...inheritedData,
    name: initialName,
  };

  // 3. Compute placement position
  let placement = params.position;
  if (!placement) {
    if (parent) {
      placement = {
        x: parent.position.x + (Math.random() * 20 - 10),
        y: parent.position.y + 160,
      };
    } else {
      placement = { x: 250, y: 150 };
    }
  }

  const generatedNodeId = crypto.randomUUID();
  const generatedEdgeId = parentId ? `e_${parentId}_${generatedNodeId}` : undefined;

  // 4. Create optimistic node
  const newNode: BlueprintCanvasNode = {
    id: generatedNodeId,
    type: 'blueprint',
    position: placement,
    data: {
      label: initialName,
      nodeType: type,
      status: 'empty',
      effectiveStatus: 'empty',
      missing: [],
      parentId: parentId || undefined,
      locked: false,
      hidden: false,
      config: mergedConfig,
    },
  };

  const newEdge: BlueprintCanvasEdge | undefined = parentId
    ? {
        id: generatedEdgeId!,
        source: parentId,
        target: generatedNodeId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#8A8A8A', strokeWidth: 1.5 },
      }
    : undefined;

  // 5. Apply state changes optimistically
  setNodes((prev) => [...prev, newNode]);
  if (newEdge) {
    setEdges((prev) => [...prev, newEdge]);
  }
  selectNode(generatedNodeId);
  setActiveTab('config');

  // 6. Push single atomic Undo/Redo command
  const undoCommand: Command = {
    id: `create_child_${generatedNodeId}`,
    description: `Add ${type} under ${parent?.data.label || 'Canvas'}`,
    execute: async () => {
      setNodes((prev) => [...prev.filter((n) => n.id !== generatedNodeId), newNode]);
      if (newEdge) {
        setEdges((prev) => [...prev.filter((e) => e.id !== newEdge.id), newEdge]);
      }
      selectNode(generatedNodeId);
    },
    undo: async () => {
      setNodes((prev) => prev.filter((n) => n.id !== generatedNodeId));
      if (newEdge) {
        setEdges((prev) => prev.filter((e) => e.id !== newEdge.id));
      }
      selectNode(parentId || null);
      void onDeleteNodeSocket(generatedNodeId);
    },
  };
  pushCommand(undoCommand);

  // 7. Persist over socket
  try {
    const socketRes = await onAddNodeSocket(type, parentId || undefined, placement, mergedConfig);
    if (!socketRes.success) {
      // Revert optimistic addition if rejected by server
      setNodes((prev) => prev.filter((n) => n.id !== generatedNodeId));
      if (newEdge) {
        setEdges((prev) => prev.filter((e) => e.id !== newEdge.id));
      }
      return { success: false, validation };
    }

    if (parentId) {
      await onAddEdgeSocket(parentId, generatedNodeId);
    }
  } catch {
    // Socket error handled by caller/toast
  }

  return {
    success: true,
    nodeId: generatedNodeId,
    edgeId: generatedEdgeId,
    validation,
  };
}
