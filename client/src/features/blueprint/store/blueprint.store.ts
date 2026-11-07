import { create } from 'zustand';
import type {
  BlueprintCanvasNode,
  BlueprintCanvasEdge,
  LayoutDirection,
  SidebarTab,
  AutosaveStatus,
  RemoteCursor,
  NodeLockState,
  Command,
  ParentRegressionBannerState,
  AlignmentType,
  DistributionType,
  ClipboardData,
  ContextMenuState,
  ConflictState,
} from '../types/canvas.types';
import type { SocketStatus } from '../services/blueprint-socket.service';
import type {
  BlueprintGraphDto,
  BlueprintNodeDto,
  BlueprintNodeType,
  NodeStatus,
  PresenceUser,
} from '@slotly/contracts';

interface BlueprintState {
  projectId: string;
  revision: number;
  nodes: BlueprintCanvasNode[];
  edges: BlueprintCanvasEdge[];
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  activeTab: SidebarTab;
  layoutDirection: LayoutDirection;
  socketStatus: SocketStatus;
  presenceUsers: PresenceUser[];
  remoteCursors: Record<string, RemoteCursor>;
  lockedNodes: Record<string, NodeLockState>;
  autosaveStatus: AutosaveStatus;
  impactPreviewNode: BlueprintCanvasNode | null;
  regressionBanner: ParentRegressionBannerState | null;
  undoStack: Command[];
  redoStack: Command[];
  fixHint: { nodeId?: string; field?: string } | null;
  isInitialLoading: boolean;

  // Advanced Designer State (Phase 7)
  clipboard: ClipboardData | null;
  contextMenu: ContextMenuState | null;
  focusModeNodeId: string | null;
  searchQuery: string;
  filterNodeType: BlueprintNodeType | 'all';
  hideUnrelated: boolean;
  isCanvasLocked: boolean;
  gridSize: number;
  isFullscreen: boolean;
  conflictState: ConflictState | null;

  // Modals & Drawers
  isHistoryOpen: boolean;
  isSnapshotsOpen: boolean;
  isTemplatesOpen: boolean;
  isImportOpen: boolean;
  isExportOpen: boolean;
  isBulkAddOpen: boolean;
  isShortcutsOpen: boolean;
  isReadinessOpen: boolean;
  isSaveTemplateOpen: boolean;
  activeCommentsNodeId: string | null;

  // Actions
  initGraph: (projectId: string, graph: BlueprintGraphDto) => void;
  setNodes: (nodes: BlueprintCanvasNode[] | ((prev: BlueprintCanvasNode[]) => BlueprintCanvasNode[])) => void;
  setEdges: (edges: BlueprintCanvasEdge[] | ((prev: BlueprintCanvasEdge[]) => BlueprintCanvasEdge[])) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<BlueprintCanvasNode['data']>) => void;
  updateNodeStatus: (
    nodeId: string,
    status: NodeStatus,
    effectiveStatus: NodeStatus,
    missing: Array<{ field: string; message: string }>,
  ) => void;
  selectNode: (nodeId: string | null) => void;
  setSelectedNodeIds: (nodeIds: string[]) => void;
  selectAll: () => void;
  selectEdge: (edgeId: string | null) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setLayoutDirection: (direction: LayoutDirection) => void;
  setSocketStatus: (status: SocketStatus) => void;
  setPresenceUsers: (users: PresenceUser[]) => void;
  updateRemoteCursor: (cursor: RemoteCursor) => void;
  setNodeLock: (lock: NodeLockState) => void;
  removeNodeLock: (nodeId: string) => void;
  setAutosaveStatus: (status: AutosaveStatus) => void;
  setImpactPreviewNode: (node: BlueprintCanvasNode | null) => void;
  setRegressionBanner: (banner: ParentRegressionBannerState | null) => void;
  setFixHint: (hint: { nodeId?: string; field?: string } | null) => void;
  setRevision: (revision: number) => void;
  pushCommand: (command: Command) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;

  // Phase 7 Actions
  setClipboard: (data: ClipboardData | null) => void;
  setContextMenu: (state: ContextMenuState | null) => void;
  setFocusModeNodeId: (nodeId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterNodeType: (type: BlueprintNodeType | 'all') => void;
  setHideUnrelated: (hide: boolean) => void;
  setIsCanvasLocked: (locked: boolean) => void;
  setGridSize: (size: number) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setConflictState: (conflict: ConflictState | null) => void;

  toggleNodeLock: (nodeId: string) => void;
  toggleNodeHidden: (nodeId: string) => void;

  // Drawer / Modal toggles
  setIsHistoryOpen: (open: boolean) => void;
  setIsSnapshotsOpen: (open: boolean) => void;
  setIsTemplatesOpen: (open: boolean) => void;
  setIsImportOpen: (open: boolean) => void;
  setIsExportOpen: (open: boolean) => void;
  setIsBulkAddOpen: (open: boolean) => void;
  setIsShortcutsOpen: (open: boolean) => void;
  setIsReadinessOpen: (open: boolean) => void;
  setIsSaveTemplateOpen: (open: boolean) => void;
  setActiveCommentsNodeId: (nodeId: string | null) => void;

  // Align and Distribute
  alignSelectedNodes: (type: AlignmentType) => void;
  distributeSelectedNodes: (type: DistributionType) => void;
}

function dtoToCanvasNode(dto: BlueprintNodeDto): BlueprintCanvasNode {
  return {
    id: dto.id,
    type: 'blueprint',
    position: dto.position || { x: 0, y: 0 },
    data: {
      label: (dto.data?.name as string) || (dto.data?.label as string) || dto.type,
      nodeType: dto.type,
      status: dto.status || 'empty',
      effectiveStatus: dto.effectiveStatus || 'empty',
      missing: dto.missing || [],
      parentId: dto.parentId || undefined,
      refId: dto.refId || undefined,
      locked: dto.locked || false,
      hidden: dto.hidden || false,
      config: dto.data || {},
    },
  };
}

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  projectId: '',
  revision: 0,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedNodeIds: [],
  selectedEdgeId: null,
  activeTab: 'config',
  layoutDirection: 'TB',
  socketStatus: 'disconnected',
  presenceUsers: [],
  remoteCursors: {},
  lockedNodes: {},
  autosaveStatus: 'saved',
  impactPreviewNode: null,
  regressionBanner: null,
  undoStack: [],
  redoStack: [],
  fixHint: null,
  isInitialLoading: true,

  // Phase 7 Initial State
  clipboard: null,
  contextMenu: null,
  focusModeNodeId: null,
  searchQuery: '',
  filterNodeType: 'all',
  hideUnrelated: false,
  isCanvasLocked: false,
  gridSize: 15,
  isFullscreen: false,
  conflictState: null,

  isHistoryOpen: false,
  isSnapshotsOpen: false,
  isTemplatesOpen: false,
  isImportOpen: false,
  isExportOpen: false,
  isBulkAddOpen: false,
  isShortcutsOpen: false,
  isReadinessOpen: false,
  isSaveTemplateOpen: false,
  activeCommentsNodeId: null,

  initGraph: (projectId, graph) => {
    const canvasNodes = graph.nodes.map(dtoToCanvasNode);
    const canvasEdges: BlueprintCanvasEdge[] = graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#8A8A8A', strokeWidth: 1.5 },
    }));

    set({
      projectId,
      revision: graph.revision || 1,
      nodes: canvasNodes,
      edges: canvasEdges,
      isInitialLoading: false,
      selectedNodeId: canvasNodes[0]?.id || null,
      selectedNodeIds: canvasNodes[0] ? [canvasNodes[0].id] : [],
    });
  },

  setNodes: (updater) =>
    set((state) => ({
      nodes: typeof updater === 'function' ? updater(state.nodes) : updater,
    })),

  setEdges: (updater) =>
    set((state) => ({
      edges: typeof updater === 'function' ? updater(state.edges) : updater,
    })),

  updateNodePosition: (nodeId, position) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
    })),

  updateNodeData: (nodeId, partialData) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                ...partialData,
                config: {
                  ...n.data.config,
                  ...(partialData.config || {}),
                },
              },
            }
          : n,
      ),
    })),

  updateNodeStatus: (nodeId, status, effectiveStatus, missing) =>
    set((state) => {
      let blockedCount = 0;
      const blockedNames: string[] = [];

      const updatedNodes = state.nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              status,
              effectiveStatus,
              missing,
            },
          };
        }
        return n;
      });

      for (const n of updatedNodes) {
        if (n.data.effectiveStatus === 'blocked') {
          blockedCount++;
          blockedNames.push(n.data.label);
        }
      }

      return {
        nodes: updatedNodes,
        regressionBanner:
          blockedCount > 0
            ? {
                count: blockedCount,
                nodeNames: blockedNames.slice(0, 3),
              }
            : null,
      };
    }),

  selectNode: (nodeId) =>
    set({
      selectedNodeId: nodeId,
      selectedNodeIds: nodeId ? [nodeId] : [],
      selectedEdgeId: null,
      activeTab: 'config',
    }),

  setSelectedNodeIds: (selectedNodeIds) =>
    set({
      selectedNodeIds,
      selectedNodeId: selectedNodeIds[0] || null,
    }),

  selectAll: () =>
    set((state) => ({
      nodes: state.nodes.map((n) => ({ ...n, selected: true })),
      selectedNodeIds: state.nodes.map((n) => n.id),
      selectedNodeId: state.nodes[0]?.id || null,
    })),

  selectEdge: (edgeId) =>
    set({
      selectedEdgeId: edgeId,
      selectedNodeId: null,
      selectedNodeIds: [],
    }),

  setActiveTab: (activeTab) => set({ activeTab }),

  setLayoutDirection: (layoutDirection) => set({ layoutDirection }),

  setSocketStatus: (socketStatus) => set({ socketStatus }),

  setPresenceUsers: (presenceUsers) => set({ presenceUsers }),

  updateRemoteCursor: (cursor) =>
    set((state) => ({
      remoteCursors: {
        ...state.remoteCursors,
        [cursor.userId]: cursor,
      },
    })),

  setNodeLock: (lock) =>
    set((state) => ({
      lockedNodes: {
        ...state.lockedNodes,
        [lock.nodeId]: lock,
      },
    })),

  removeNodeLock: (nodeId) =>
    set((state) => {
      const rest = { ...state.lockedNodes };
      delete rest[nodeId];
      return { lockedNodes: rest };
    }),

  setAutosaveStatus: (autosaveStatus) => set({ autosaveStatus }),

  setImpactPreviewNode: (impactPreviewNode) => set({ impactPreviewNode }),

  setRegressionBanner: (regressionBanner) => set({ regressionBanner }),

  setFixHint: (fixHint) => set({ fixHint }),

  setRevision: (revision) => set({ revision }),

  pushCommand: (command) =>
    set((state) => ({
      undoStack: [...state.undoStack, command],
      redoStack: [],
    })),

  undo: async () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const command = undoStack[undoStack.length - 1];
    if (!command) return;

    await command.undo();
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, command],
    });
  },

  redo: async () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const command = redoStack[redoStack.length - 1];
    if (!command) return;

    await command.execute();
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, command],
    });
  },

  // Phase 7 Actions
  setClipboard: (clipboard) => set({ clipboard }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setFocusModeNodeId: (focusModeNodeId) => set({ focusModeNodeId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterNodeType: (filterNodeType) => set({ filterNodeType }),
  setHideUnrelated: (hideUnrelated) => set({ hideUnrelated }),
  setIsCanvasLocked: (isCanvasLocked) => set({ isCanvasLocked }),
  setGridSize: (gridSize) => set({ gridSize }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setConflictState: (conflictState) => set({ conflictState }),

  toggleNodeLock: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, locked: !n.data.locked } }
          : n,
      ),
    })),

  toggleNodeHidden: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, hidden: !n.data.hidden } }
          : n,
      ),
    })),

  setIsHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
  setIsSnapshotsOpen: (isSnapshotsOpen) => set({ isSnapshotsOpen }),
  setIsTemplatesOpen: (isTemplatesOpen) => set({ isTemplatesOpen }),
  setIsImportOpen: (isImportOpen) => set({ isImportOpen }),
  setIsExportOpen: (isExportOpen) => set({ isExportOpen }),
  setIsBulkAddOpen: (isBulkAddOpen) => set({ isBulkAddOpen }),
  setIsShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
  setIsReadinessOpen: (isReadinessOpen) => set({ isReadinessOpen }),
  setIsSaveTemplateOpen: (isSaveTemplateOpen) => set({ isSaveTemplateOpen }),
  setActiveCommentsNodeId: (activeCommentsNodeId) => set({ activeCommentsNodeId }),

  // Align nodes: Left, Center, Right, Top, Middle, Bottom
  alignSelectedNodes: (type) =>
    set((state) => {
      const selected = state.nodes.filter((n) => n.selected || state.selectedNodeIds.includes(n.id));
      if (selected.length < 2) return state;

      const NODE_WIDTH = 240;
      const NODE_HEIGHT = 130;

      const minX = Math.min(...selected.map((n) => n.position.x));
      const maxX = Math.max(...selected.map((n) => n.position.x + NODE_WIDTH));
      const minY = Math.min(...selected.map((n) => n.position.y));
      const maxY = Math.max(...selected.map((n) => n.position.y + NODE_HEIGHT));

      const updated = state.nodes.map((node) => {
        if (!selected.some((s) => s.id === node.id)) return node;

        let { x, y } = node.position;
        if (type === 'left') x = minX;
        if (type === 'center') x = minX + (maxX - minX) / 2 - NODE_WIDTH / 2;
        if (type === 'right') x = maxX - NODE_WIDTH;
        if (type === 'top') y = minY;
        if (type === 'middle') y = minY + (maxY - minY) / 2 - NODE_HEIGHT / 2;
        if (type === 'bottom') y = maxY - NODE_HEIGHT;

        return { ...node, position: { x, y } };
      });

      return { nodes: updated };
    }),

  // Distribute nodes: Horizontal or Vertical
  distributeSelectedNodes: (type) =>
    set((state) => {
      const selected = state.nodes.filter((n) => n.selected || state.selectedNodeIds.includes(n.id));
      if (selected.length < 3) return state;

      if (type === 'horizontal') {
        const sorted = [...selected].sort((a, b) => a.position.x - b.position.x);
        const minX = sorted[0]!.position.x;
        const maxX = sorted[sorted.length - 1]!.position.x;
        const totalSpan = maxX - minX;
        const step = totalSpan / (sorted.length - 1);

        const posMap = new Map<string, number>();
        sorted.forEach((n, idx) => posMap.set(n.id, minX + idx * step));

        return {
          nodes: state.nodes.map((node) =>
            posMap.has(node.id)
              ? { ...node, position: { x: posMap.get(node.id)!, y: node.position.y } }
              : node,
          ),
        };
      } else {
        const sorted = [...selected].sort((a, b) => a.position.y - b.position.y);
        const minY = sorted[0]!.position.y;
        const maxY = sorted[sorted.length - 1]!.position.y;
        const totalSpan = maxY - minY;
        const step = totalSpan / (sorted.length - 1);

        const posMap = new Map<string, number>();
        sorted.forEach((n, idx) => posMap.set(n.id, minY + idx * step));

        return {
          nodes: state.nodes.map((node) =>
            posMap.has(node.id)
              ? { ...node, position: { x: node.position.x, y: posMap.get(node.id)! } }
              : node,
          ),
        };
      }
    }),
}));
