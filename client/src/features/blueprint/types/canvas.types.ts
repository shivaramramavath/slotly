// Core implementation for canvas.types in client/src/features/blueprint/types.
import type { Node, Edge } from '@xyflow/react';
import type {
  BlueprintNodeType,
  NodeStatus,
  BlueprintSnapshotDto,
} from '@slotly/contracts';

/** Type alias for layout direction. */
export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';
/** Type alias for layout algorithm. */
export type LayoutAlgorithm = 'hierarchical' | 'compact' | 'department';
/** Type alias for sidebar tab. */
export type SidebarTab = 'node' | 'check' | 'ai' | 'config' | 'constraints';
/** Type alias for autosave status. */
export type AutosaveStatus = 'saved' | 'saving' | 'offline';

/** Type alias for alignment type. */
export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
/** Type alias for distribution type. */
export type DistributionType = 'horizontal' | 'vertical';

/** Interface defining structure for canvas node data. */
export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  nodeType: BlueprintNodeType;
  status: NodeStatus;
  effectiveStatus: NodeStatus;
  missing: Array<{ field: string; message: string }>;
  parentId?: string | undefined;
  refId?: string | undefined;
  locked?: boolean | undefined;
  hidden?: boolean | undefined;
  lockedBy?: { userId: string; userName: string } | undefined;
  config: Record<string, unknown>;
  commentsCount?: number;
}

/** Type alias for blueprint canvas node. */
export type BlueprintCanvasNode = Node<CanvasNodeData, 'blueprint'>;
/** Type alias for blueprint canvas edge. */
export type BlueprintCanvasEdge = Edge;

/** Interface defining structure for group node data. */
export interface GroupNodeData extends Record<string, unknown> {
  label: string;
  groupType: 'department' | 'program' | 'semester' | 'section';
  collapsed: boolean;
  childCount: number;
  completeCount: number;
}

/** Type alias for blueprint group node. */
export type BlueprintGroupNode = Node<GroupNodeData, 'blueprintGroup'>;

/** Interface defining structure for remote cursor. */
export interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastActive: number;
}

/** Interface defining structure for node lock state. */
export interface NodeLockState {
  nodeId: string;
  userId: string;
  userName: string;
}

/** Interface defining structure for command. */
export interface Command {
  id: string;
  description: string;
  execute: () => Promise<void> | void;
  undo: () => Promise<void> | void;
}

/** Interface defining structure for parent regression banner state. */
export interface ParentRegressionBannerState {
  count: number;
  nodeNames: string[];
}

/** Interface defining structure for clipboard data. */
export interface ClipboardData {
  nodes: BlueprintCanvasNode[];
  edges: BlueprintCanvasEdge[];
}

/** Interface defining structure for context menu state. */
export interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string | undefined;
}

/** Interface defining structure for snapshot diff state. */
export interface SnapshotDiffState {
  snapshot: BlueprintSnapshotDto;
  diff: {
    addedNodes: string[];
    removedNodes: string[];
    modifiedNodes: string[];
  };
}

/** Interface defining structure for conflict state. */
export interface ConflictState {
  currentRevision: number;
  rejectedRevision: number;
  message: string;
  currentState?: unknown;
}
