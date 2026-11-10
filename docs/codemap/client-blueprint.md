# Client Blueprint Feature Code Map

### `client/src/features/blueprint/components/blueprint-workspace.tsx`
*React component for blueprint-workspace.*

- **Component** `BlueprintWorkspace({ projectId }: BlueprintWorkspaceProps)` - React component rendering blueprint workspace.

### `client/src/features/blueprint/components/canvas/blueprint-canvas.tsx`
*React component for blueprint-canvas.*

- **Component** `BlueprintCanvas({
  onMoveNode,
  onAddEdge,
  onAddNode,
  onCursorMove,
}: BlueprintCanvasProps)` - React component rendering blueprint canvas.

### `client/src/features/blueprint/components/canvas/blueprint-context-menu.tsx`
*React component for blueprint-context-menu.*

- **Component** `BlueprintContextMenu({
  onAddChild,
  onDuplicate,
  onCopy,
  onPaste,
}: BlueprintContextMenuProps)` - React component rendering blueprint context menu.

### `client/src/features/blueprint/components/canvas/blueprint-floating-align-bar.tsx`
*React component for blueprint-floating-align-bar.*

- **Component** `BlueprintFloatingAlignBar()` - React component rendering blueprint floating align bar.

### `client/src/features/blueprint/components/canvas/dotted-edge.tsx`
*React component for dotted-edge.*

- **Interface** `EdgeLabelPillProps`
- **Component** `EdgeLabelPill()` - Edge Label Pill rendered at edge midpoint
- **Component** `DottedEdge()` - Custom React Flow Edge with dotted styling and slow flow animation when connected to selected node

### `client/src/features/blueprint/components/canvas/issue-label.ts`
*Helper utility for formatting blueprint node issues and labels.*

- **Interface** `NodeIssueItem` - Interface defining a structured node issue item.
- **Function** `formatIssueLabel(field: string)`: `string` - Formats a raw field key into a readable, plain-language sentence.
- **Function** `groupAndSortIssues(node: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasNode)`: `{ errors: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/canvas/issue-label").NodeIssueItem[]; warnings: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/canvas/issue-label").NodeIssueItem[]; all: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/canvas/issue-label").NodeIssueItem[]; totalCount: number; }` - Groups and sorts issues for a node: blocking errors first, then warnings/missing fields.

### `client/src/features/blueprint/components/canvas/node-card.tsx`
*Presentation component rendering compact NodeCard and its subcomponents.*

- **Interface** `NodeCardProps`
- **Function** `calculateNodeProgress(node: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasNode)`: `number` - Compute completion percentage based on filled vs missing required fields
- **Function** `getNodeMetricLine(node: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasNode)`: `string` - Get single metric line text for subtitle
- **Const** `TYPE_ICONS`: `Record<"institution" | "department" | "program"...`
- **Const** `TYPE_LABELS`: `Record<"institution" | "department" | "program"...`
- **Component** `NodeProgress()` - Subcomponent: Progress Bar kept for feature parity
- **Component** `HandleRing()` - Subcomponent: Target Ring Handle at Top Edge
- **Component** `HandlePill()` - Subcomponent: Source Pill Handle at Bottom Edge
- **Component** `AddChildButton()` - Subcomponent: Add Child Control Button
- **Component** `NodeCard()` - Base NodeCard component matching compact 232px specification

### `client/src/features/blueprint/components/canvas/node-factory.tsx`
*React component for node-factory.*

- **Component** `BlueprintNode()` - React component rendering standard blueprint node
- **Component** `BlueprintGroupNode()` - React component rendering blueprint group node.
- **Const** `nodeTypes`: `{ blueprint: React.MemoExoticComponent<({ id, d...` - Constant representing node types for React Flow.

### `client/src/features/blueprint/components/canvas/node-issues-card.tsx`
*React component for compact node-issues-card.*

- **Interface** `NodeIssuesCardProps`
- **Component** `NodeIssuesCard({
  node,
  anchorRect,
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/canvas/node-issues-card").NodeIssuesCardProps)` - React component rendering compact hover & focus card for node errors and requirements

### `client/src/features/blueprint/components/canvas/safe-defaults.ts`
*Helper utility providing safe default configurations for blueprint auto-fix.*

- **Function** `getSafeDefaultsForNodeType(nodeType: "institution" | "department" | "program" | "academicYear" | "semester" | "section" | "batch" | "subjectAssignment" | "electiveGroup" | "faculty" | "room", currentConfig: Record<string, unknown> | undefined)`: `Record<string, unknown>` - Returns safe default configuration values for a node type to resolve missing requirements.

### `client/src/features/blueprint/components/dialogs/bulk-add-dialog.tsx`
*React component for bulk-add-dialog.*

- **Component** `BulkAddDialog({ onAddBatchNodes }: BulkAddDialogProps)` - React component rendering bulk add dialog.

### `client/src/features/blueprint/components/dialogs/export-dialog.tsx`
*React component for export-dialog.*

- **Component** `ExportDialog()` - React component rendering export dialog.

### `client/src/features/blueprint/components/dialogs/history-dialog.tsx`
*React component for history-dialog.*

- **Component** `HistoryDialog()` - React component rendering history dialog.

### `client/src/features/blueprint/components/dialogs/impact-preview-dialog.tsx`
*React component for impact-preview-dialog.*

- **Component** `ImpactPreviewDialog({ onConfirmDelete }: ImpactPreviewDialogProps)` - React component rendering impact preview dialog.

### `client/src/features/blueprint/components/dialogs/import-dialog.tsx`
*React component for import-dialog.*

- **Component** `ImportDialog({ onImportCompleted }: ImportDialogProps)` - React component rendering import dialog.

### `client/src/features/blueprint/components/dialogs/node-comments-dialog.tsx`
*React component for node-comments-dialog.*

- **Component** `NodeCommentsDialog()` - React component rendering node comments dialog.

### `client/src/features/blueprint/components/dialogs/parent-regression-banner.tsx`
*React component for parent-regression-banner.*

- **Component** `ParentRegressionBanner()` - React component rendering parent regression banner.

### `client/src/features/blueprint/components/dialogs/readiness-dialog.tsx`
*React component for readiness-dialog.*

- **Component** `ReadinessDialog({ onBuildSchedule }: ReadinessDialogProps)` - React component rendering readiness dialog.

### `client/src/features/blueprint/components/dialogs/revision-conflict-dialog.tsx`
*React component for revision-conflict-dialog.*

- **Component** `RevisionConflictDialog({
  onReloadServerState,
  onForceOverwrite,
}: RevisionConflictDialogProps)` - React component rendering revision conflict dialog.

### `client/src/features/blueprint/components/dialogs/save-template-dialog.tsx`
*React component for save-template-dialog.*

- **Component** `SaveTemplateDialog()` - React component rendering save template dialog.

### `client/src/features/blueprint/components/dialogs/shortcuts-dialog.tsx`
*React component for shortcuts-dialog.*

- **Component** `ShortcutsDialog()` - React component rendering shortcuts dialog.

### `client/src/features/blueprint/components/dialogs/snapshots-dialog.tsx`
*React component for snapshots-dialog.*

- **Component** `SnapshotsDialog({ onSnapshotRestored }: SnapshotsDialogProps)` - React component rendering snapshots dialog.

### `client/src/features/blueprint/components/dialogs/templates-dialog.tsx`
*React component for templates-dialog.*

- **Component** `TemplatesDialog({ onTemplateApplied }: TemplatesDialogProps)` - React component rendering templates dialog.

### `client/src/features/blueprint/components/dialogs/validation-panel.tsx`
*React component for validation-panel.*

- **Component** `ValidationPanel({ isOpen, onClose }: ValidationPanelProps)` - React component rendering validation panel.

### `client/src/features/blueprint/components/header/blueprint-header.tsx`
*React component for blueprint-header.*

- **Interface** `BlueprintHeaderProps`
- **Component** `BlueprintHeader({
  projectId,
  onOpenValidation,
  onBuildSchedule,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/header/blueprint-header").BlueprintHeaderProps)` - React component rendering single 48px Blueprint Header matching reference spec

### `client/src/features/blueprint/components/hint/first-run-hint.tsx`
*React component for first-run-hint.*

- **Component** `FirstRunHint()` - React component rendering first-run onboarding hint for empty canvas

### `client/src/features/blueprint/components/palette/blueprint-palette.tsx`
*React component for blueprint-palette.*

- **Interface** `PaletteItem`
- **Component** `BlueprintPalette({ onAddNode }: BlueprintPaletteProps)` - React component rendering blueprint palette.
- **Const** `PALETTE_ITEMS`: `import("E:/Shiva Ram/Projects/slotly/client/src...`

### `client/src/features/blueprint/components/palette/node-library-item.tsx`
*React component for node-library-item.*

- **Interface** `NodeLibraryItemProps`
- **Component** `NodeLibraryItem({
  item,
  isExpanded,
  isAllowed,
  reason,
  isFocused,
  onSelect,
  onKeyDown,
  itemRef,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/palette/node-library-item").NodeLibraryItemProps)` - React component rendering an individual node library item

### `client/src/features/blueprint/components/palette/node-library-panel.tsx`
*React component for node-library-panel.*

- **Interface** `NodeLibraryPanelProps`
- **Component** `NodeLibraryPanel({ onAddNode }: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/palette/node-library-panel").NodeLibraryPanelProps)` - React component rendering floating vertical node library panel

### `client/src/features/blueprint/components/sidebar/blueprint-sidebar.tsx`
*React component for blueprint-sidebar.*

- **Component** `BlueprintSidebar({ projectId, onUpdateConfig }: BlueprintSidebarProps)` - React component rendering blueprint sidebar.

### `client/src/features/blueprint/components/sidebar/side-panel-tabs.tsx`
*React component for side-panel-tabs.*

- **Interface** `SidePanelTabsProps`
- **Component** `SidePanelTabs({ activeTab, onTabChange }: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/sidebar/side-panel-tabs").SidePanelTabsProps)` - React component rendering underlined text tabs matching the reference spec

### `client/src/features/blueprint/components/sidebar/tabs/blueprint-constraints-tab.tsx`
*React component for blueprint-constraints-tab.*

- **Component** `BlueprintConstraintsTab({ projectId }: BlueprintConstraintsTabProps)` - React component rendering blueprint constraints tab.

### `client/src/features/blueprint/components/toolbar/blueprint-search-filter.tsx`
*React component for blueprint-search-filter.*

- **Component** `BlueprintSearchFilter()` - React component rendering blueprint search filter.

### `client/src/features/blueprint/components/toolbar/blueprint-toolbar.tsx`
*React component for blueprint-toolbar.*

- **Component** `BlueprintToolbar({ onToggleValidation, showValidation }: BlueprintToolbarProps)` - React component rendering blueprint toolbar.

### `client/src/features/blueprint/components/toolbar/floating-toolbar.tsx`
*React component for floating-toolbar.*

- **Interface** `FloatingToolbarProps`
- **Component** `FloatingToolbar({
  onCopy,
  onPaste,
  onDuplicate,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/toolbar/floating-toolbar").FloatingToolbarProps)` - React component rendering floating bottom pill toolbar

### `client/src/features/blueprint/components/toolbar/toolbar-menu.tsx`
*React component for toolbar-menu.*

- **Interface** `ToolbarMenuProps`
- **Component** `ToolbarMenu({ onCopy, onPaste, onDuplicate }: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/components/toolbar/toolbar-menu").ToolbarMenuProps)` - React component rendering More menu dropdown for floating toolbar

### `client/src/features/blueprint/components/validation/conflict-card.tsx`
*React component for conflict-card.*

- **Component** `ConflictCard({
  violation,
  onApplySuggestion,
  className = '',
}: ConflictCardProps)` - React component rendering conflict card.

### `client/src/features/blueprint/hooks/use-blueprint-commands.ts`
*Custom React hook for use-blueprint-commands.*

- **Hook** `useBlueprintCommands()`: `{ executeCommand: (command: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").Command) => Promise<void>; undo: () => Promise<void>; redo: () => Promise<void>; canUndo: boolean; canRedo: boolean; }` - Custom React hook for use blueprint commands.

### `client/src/features/blueprint/hooks/use-blueprint-layout.ts`
*Custom React hook for use-blueprint-layout.*

- **Hook** `useBlueprintLayout()`: `{ getLayoutedElements: typeof getLayoutedElements; saveSnapshotForReset: () => void; resetLayout: () => void; avoidOverlaps: typeof avoidOverlapsHelper; }` - Custom React hook for use blueprint layout.

### `client/src/features/blueprint/hooks/use-blueprint-socket.ts`
*Custom React hook for use-blueprint-socket.*

- **Hook** `useBlueprintSocket(projectId: string)`: `{ addNode: (type: "institution" | "department" | "program" | "academicYear" | "semester" | "section" | "batch" | "subjectAssignment" | "electiveGroup" | "faculty" | "room", parentId?: string | undefined, position?: { x: number; y: number; }, data?: Record<string, unknown>) => Promise<{ success: boolean; reasonCode?: string | undefined; message?: string | undefined; fixHint?: { nodeId?: string | undefined; field?: string | undefined; } | undefined; }>; deleteNode: (nodeId: string) => Promise<{ success: boolean; reasonCode?: string | undefined; message?: string | undefined; }>; addEdge: (source: string, target: string) => Promise<{ success: boolean; reasonCode?: string | undefined; message?: string | undefined; fixHint?: { nodeId?: string | undefined; field?: string | undefined; } | undefined; }>; deleteEdge: (edgeId: string) => Promise<{ success: boolean; reasonCode?: string | undefined; message?: string | undefined; }>; moveNode: (nodeId: string, position: { x: number; y: number; }) => void; updateNodeConfig: (nodeId: string, data: Record<string, unknown>) => void; lockNode: (nodeId: string) => Promise<{ success: boolean; message?: string | undefined; } | { success: boolean; }>; unlockNode: (nodeId: string) => Promise<{ success: boolean; message?: string | undefined; } | { success: boolean; }>; sendCursor: (x: number, y: number) => void; }` - Custom React hook for use blueprint socket.

### `client/src/features/blueprint/hooks/use-gate-validation.ts`
*Custom React hook for use-gate-validation.*

- **Hook** `useGateValidation(nodes: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasNode[], edges: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasEdge[])`: `{ canAddNodeType: (type: "institution" | "department" | "program" | "academicYear" | "semester" | "section" | "batch" | "subjectAssignment" | "electiveGroup" | "faculty" | "room", parent: import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasNode | null | undefined) => { allowed: boolean; reason?: string | undefined; }; getAllowedChildTypes: (parentType: "institution" | "department" | "program" | "academicYear" | "semester" | "section" | "batch" | "subjectAssignment" | "electiveGroup" | "faculty" | "room") => ("institution" | "department" | "program" | "academicYear" | "semester" | "section" | "batch" | "subjectAssignment" | "electiveGroup" | "faculty" | "room")[]; isValidConnection: (connection: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@xyflow+react@12.12.1_@type_0d31d3f3453ea8575b43a5b4a03d989f/node_modules/@xyflow/react/dist/esm/types/edges").Edge | import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@xyflow+system@0.0.84/node_modules/@xyflow/system/dist/esm/types/general").Connection) => boolean; getNodeById: (id: string | null | undefined) => import("E:/Shiva Ram/Projects/slotly/client/src/features/blueprint/types/canvas.types").BlueprintCanvasNode | undefined; }` - Custom React hook for use gate validation.

### `client/src/features/blueprint/hooks/use-guided-mode.ts`
*Custom React hook for use-guided-mode.*

- **Hook** `useGuidedMode()`: `{ goToNextStep: () => void; }` - Custom React hook for use guided mode.

### `client/src/features/blueprint/services/blueprint-socket.service.ts`
*Domain service orchestrating blueprint-socket.service business logic.*

- **Class** `BlueprintSocketService` - Class implementing blueprint socket service.
- **Interface** `BlueprintSocketCallbacks` - Interface defining structure for blueprint socket callbacks.
- **Type** `SocketStatus` - Type alias for socket status.

### `client/src/features/blueprint/services/blueprint.api.ts`
*Domain service orchestrating blueprint.api business logic.*

- **Const** `blueprintApi`: `{ getGraph(projectId: string): Promise<{ revisi...` - Constant representing blueprint api.

### `client/src/features/blueprint/store/blueprint.store.ts`
*Zustand store managing application state for blueprint.store.*

- **Zustand Store** `useBlueprintStore` (actions: initGraph, setNodes, setEdges, updateNodePosition, updateNodeData, updateNodeStatus, selectNode, setSelectedNodeIds, ...) - Zustand store managing use blueprint store state.

### `client/src/features/blueprint/types/canvas.types.ts`
*Core implementation for canvas.types in client/src/features/blueprint/types.*

- **Interface** `CanvasNodeData` extends `Record<string, unknown>` - Interface defining structure for canvas node data.
- **Interface** `GroupNodeData` extends `Record<string, unknown>` - Interface defining structure for group node data.
- **Interface** `RemoteCursor` - Interface defining structure for remote cursor.
- **Interface** `NodeLockState` - Interface defining structure for node lock state.
- **Interface** `Command` - Interface defining structure for command.
- **Interface** `ParentRegressionBannerState` - Interface defining structure for parent regression banner state.
- **Interface** `ClipboardData` - Interface defining structure for clipboard data.
- **Interface** `ContextMenuState` - Interface defining structure for context menu state.
- **Interface** `SnapshotDiffState` - Interface defining structure for snapshot diff state.
- **Interface** `ConflictState` - Interface defining structure for conflict state.
- **Type** `LayoutDirection` - Type alias for layout direction.
- **Type** `LayoutAlgorithm` - Type alias for layout algorithm.
- **Type** `SidebarTab` - Type alias for sidebar tab.
- **Type** `AutosaveStatus` - Type alias for autosave status.
- **Type** `AlignmentType` - Type alias for alignment type.
- **Type** `DistributionType` - Type alias for distribution type.
- **Type** `BlueprintCanvasNode` - Type alias for blueprint canvas node.
- **Type** `BlueprintCanvasEdge` - Type alias for blueprint canvas edge.
- **Type** `BlueprintGroupNode` - Type alias for blueprint group node.

