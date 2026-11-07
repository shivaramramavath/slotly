import type { Node, Edge } from '@xyflow/react';
import type {
  BlueprintNodeType,
  NodeStatus,
  BlueprintSnapshotDto,
} from '@slotly/contracts';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';
export type LayoutAlgorithm = 'hierarchical' | 'compact' | 'department';
export type SidebarTab = 'config' | 'constraints' | 'ai';
export type AutosaveStatus = 'saved' | 'saving' | 'offline';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

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

export type BlueprintCanvasNode = Node<CanvasNodeData, 'blueprint'>;
export type BlueprintCanvasEdge = Edge;

export interface GroupNodeData extends Record<string, unknown> {
  label: string;
  groupType: 'department' | 'program' | 'semester' | 'section';
  collapsed: boolean;
  childCount: number;
  completeCount: number;
}

export type BlueprintGroupNode = Node<GroupNodeData, 'blueprintGroup'>;

export interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastActive: number;
}

export interface NodeLockState {
  nodeId: string;
  userId: string;
  userName: string;
}

export interface Command {
  id: string;
  description: string;
  execute: () => Promise<void> | void;
  undo: () => Promise<void> | void;
}

export interface ParentRegressionBannerState {
  count: number;
  nodeNames: string[];
}

export interface ClipboardData {
  nodes: BlueprintCanvasNode[];
  edges: BlueprintCanvasEdge[];
}

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string | undefined;
}

export interface SnapshotDiffState {
  snapshot: BlueprintSnapshotDto;
  diff: {
    addedNodes: string[];
    removedNodes: string[];
    modifiedNodes: string[];
  };
}

export interface ConflictState {
  currentRevision: number;
  rejectedRevision: number;
  message: string;
  currentState?: unknown;
}
