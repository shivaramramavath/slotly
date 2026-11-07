# Client Blueprint Feature Code Map

### `client/src/features/blueprint/components/blueprint-workspace.tsx`
*(no description)*

- **Component** `BlueprintWorkspace({ projectId }: BlueprintWorkspaceProps)`

### `client/src/features/blueprint/components/canvas/blueprint-canvas.tsx`
*(no description)*

- **Component** `BlueprintCanvas({
  onMoveNode,
  onAddEdge,
  onAddNode,
  onCursorMove,
}: BlueprintCanvasProps)`

### `client/src/features/blueprint/components/canvas/blueprint-context-menu.tsx`
*(no description)*

- **Component** `BlueprintContextMenu({
  onAddChild,
  onDuplicate,
  onCopy,
  onPaste,
}: BlueprintContextMenuProps)`

### `client/src/features/blueprint/components/canvas/blueprint-floating-align-bar.tsx`
*(no description)*

- **Component** `BlueprintFloatingAlignBar()`

### `client/src/features/blueprint/components/canvas/node-factory.tsx`
*(no description)*

- **Component** `BlueprintNode()`
- **Component** `BlueprintGroupNode()`
- **Const** `nodeTypes`: `{ blueprint: React.MemoExoticComponent<({ id, d...`

### `client/src/features/blueprint/components/dialogs/bulk-add-dialog.tsx`
*(no description)*

- **Component** `BulkAddDialog({ onAddBatchNodes }: BulkAddDialogProps)`

### `client/src/features/blueprint/components/dialogs/export-dialog.tsx`
*(no description)*

- **Component** `ExportDialog()`

### `client/src/features/blueprint/components/dialogs/history-dialog.tsx`
*(no description)*

- **Component** `HistoryDialog()`

### `client/src/features/blueprint/components/dialogs/impact-preview-dialog.tsx`
*(no description)*

- **Component** `ImpactPreviewDialog({ onConfirmDelete }: ImpactPreviewDialogProps)`

### `client/src/features/blueprint/components/dialogs/import-dialog.tsx`
*(no description)*

- **Component** `ImportDialog({ onImportCompleted }: ImportDialogProps)`

### `client/src/features/blueprint/components/dialogs/node-comments-dialog.tsx`
*(no description)*

- **Component** `NodeCommentsDialog()`

### `client/src/features/blueprint/components/dialogs/parent-regression-banner.tsx`
*(no description)*

- **Component** `ParentRegressionBanner()`

### `client/src/features/blueprint/components/dialogs/readiness-dialog.tsx`
*(no description)*

- **Component** `ReadinessDialog({ onBuildSchedule }: ReadinessDialogProps)`

### `client/src/features/blueprint/components/dialogs/revision-conflict-dialog.tsx`
*(no description)*

- **Component** `RevisionConflictDialog({
  onReloadServerState,
  onForceOverwrite,
}: RevisionConflictDialogProps)`

### `client/src/features/blueprint/components/dialogs/save-template-dialog.tsx`
*(no description)*

- **Component** `SaveTemplateDialog()`

### `client/src/features/blueprint/components/dialogs/shortcuts-dialog.tsx`
*(no description)*

- **Component** `ShortcutsDialog()`

### `client/src/features/blueprint/components/dialogs/snapshots-dialog.tsx`
*(no description)*

- **Component** `SnapshotsDialog({ onSnapshotRestored }: SnapshotsDialogProps)`

### `client/src/features/blueprint/components/dialogs/templates-dialog.tsx`
*(no description)*

- **Component** `TemplatesDialog({ onTemplateApplied }: TemplatesDialogProps)`

### `client/src/features/blueprint/components/dialogs/validation-panel.tsx`
*(no description)*

- **Component** `ValidationPanel({ isOpen, onClose }: ValidationPanelProps)`

### `client/src/features/blueprint/components/palette/blueprint-palette.tsx`
*(no description)*

- **Component** `BlueprintPalette({ onAddNode }: BlueprintPaletteProps)`

### `client/src/features/blueprint/components/sidebar/blueprint-sidebar.tsx`
*(no description)*

- **Component** `BlueprintSidebar({ projectId, onUpdateConfig }: BlueprintSidebarProps)`

### `client/src/features/blueprint/components/sidebar/tabs/blueprint-constraints-tab.tsx`
*(no description)*

- **Component** `BlueprintConstraintsTab({ projectId }: BlueprintConstraintsTabProps)`

### `client/src/features/blueprint/components/toolbar/blueprint-search-filter.tsx`
*(no description)*

- **Component** `BlueprintSearchFilter()`

### `client/src/features/blueprint/components/toolbar/blueprint-toolbar.tsx`
*(no description)*

- **Component** `BlueprintToolbar({ onToggleValidation, showValidation }: BlueprintToolbarProps)`

### `client/src/features/blueprint/components/validation/conflict-card.tsx`
*(no description)*

- **Component** `ConflictCard({
  violation,
  onApplySuggestion,
  className = '',
}: ConflictCardProps)`

### `client/src/features/blueprint/hooks/use-blueprint-commands.ts`
*(no description)*

- **Hook** `useBlueprintCommands()`: `{ executeCommand: (command: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").Command) => Promise<void>; undo: () => Promise<void>; redo: () => Promise<void>; canUndo: boolean; canRedo: boolean; }`

### `client/src/features/blueprint/hooks/use-blueprint-layout.ts`
*(no description)*

- **Hook** `useBlueprintLayout()`: `{ getLayoutedElements: typeof getLayoutedElements; saveSnapshotForReset: () => void; resetLayout: () => void; avoidOverlaps: typeof avoidOverlapsHelper; }`

### `client/src/features/blueprint/hooks/use-blueprint-socket.ts`
*(no description)*

- **Hook** `useBlueprintSocket(projectId: string)`: `{ addNode: (type: "institution" | "department" | "program" | "academicYear" | "semester" | "section" | "batch" | "subjectAssignment" | "electiveGroup" | "faculty" | "room", parentId?: string | undefined, position?: { x: number; y: number; }, data?: Record<string, unknown>) => Promise<{ success: boolean; reasonCode?: string | undefined; message?: string | undefined; fixHint?: { nodeId?: string | undefined; field?: string | undefined; } | undefined; }>; deleteNode: (nodeId: string) => Promise<{ success: boolean; reasonCode?: string | undefined; message?: string | undefined; }>; addEdge: (source: string, target: string) => Promise<{ success: boolean; reasonCode?: string | undefined; message?: string | undefined; fixHint?: { nodeId?: string | undefined; field?: string | undefined; } | undefined; }>; deleteEdge: (edgeId: string) => Promise<{ success: boolean; reasonCode?: string | undefined; message?: string | undefined; }>; moveNode: (nodeId: string, position: { x: number; y: number; }) => void; updateNodeConfig: (nodeId: string, data: Record<string, unknown>) => void; lockNode: (nodeId: string) => Promise<{ success: boolean; message?: string | undefined; } | { success: boolean; }>; unlockNode: (nodeId: string) => Promise<{ success: boolean; message?: string | undefined; } | { success: boolean; }>; sendCursor: (x: number, y: number) => void; }`

### `client/src/features/blueprint/hooks/use-gate-validation.ts`
*(no description)*

- **Hook** `useGateValidation(nodes: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasNode[], edges: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasEdge[])`: `{ canAddNodeType: (type: "institution" | "department" | "program" | "academicYear" | "semester" | "section" | "batch" | "subjectAssignment" | "electiveGroup" | "faculty" | "room", parent: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasNode | null | undefined) => { allowed: boolean; reason?: string | undefined; }; getAllowedChildTypes: (parentType: "institution" | "department" | "program" | "academicYear" | "semester" | "section" | "batch" | "subjectAssignment" | "electiveGroup" | "faculty" | "room") => ("institution" | "department" | "program" | "academicYear" | "semester" | "section" | "batch" | "subjectAssignment" | "electiveGroup" | "faculty" | "room")[]; isValidConnection: (connection: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@xyflow+react@12.12.1_@type_0d31d3f3453ea8575b43a5b4a03d989f/node_modules/@xyflow/react/dist/esm/types/edges").Edge | import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@xyflow+system@0.0.84/node_modules/@xyflow/system/dist/esm/types/general").Connection) => boolean; getNodeById: (id: string | null | undefined) => import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasNode | undefined; }`

### `client/src/features/blueprint/hooks/use-guided-mode.ts`
*(no description)*

- **Hook** `useGuidedMode()`: `{ goToNextStep: () => void; }`

### `client/src/features/blueprint/services/blueprint-socket.service.ts`
*(no description)*

- **Class** `BlueprintSocketService`
- **Interface** `BlueprintSocketCallbacks`
- **Type** `SocketStatus`

### `client/src/features/blueprint/store/blueprint.store.ts`
*(no description)*

- **Zustand Store** `useBlueprintStore` (actions: initGraph, setNodes, setEdges, updateNodePosition, updateNodeData, updateNodeStatus, selectNode, setSelectedNodeIds, ...)

### `client/src/features/blueprint/types/canvas.types.ts`
*(no description)*

- **Interface** `CanvasNodeData` extends `Record<string, unknown>`
- **Interface** `GroupNodeData` extends `Record<string, unknown>`
- **Interface** `RemoteCursor`
- **Interface** `NodeLockState`
- **Interface** `Command`
- **Interface** `ParentRegressionBannerState`
- **Interface** `ClipboardData`
- **Interface** `ContextMenuState`
- **Interface** `SnapshotDiffState`
- **Interface** `ConflictState`
- **Type** `LayoutDirection`
- **Type** `LayoutAlgorithm`
- **Type** `SidebarTab`
- **Type** `AutosaveStatus`
- **Type** `AlignmentType`
- **Type** `DistributionType`
- **Type** `BlueprintCanvasNode`
- **Type** `BlueprintCanvasEdge`
- **Type** `BlueprintGroupNode`

