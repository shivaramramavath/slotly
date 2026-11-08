# Client Builds Feature Code Map

### `client/src/features/builds/components/alternative-card.tsx`
*React component for alternative-card.*

- **Component** `AlternativeCard({
  version,
  projectId,
  isCompared = false,
  onToggleCompare,
  isComparingFull = false,
}: AlternativeCardProps)` - React component rendering alternative card.

### `client/src/features/builds/components/build-blocked-view.tsx`
*React component for build-blocked-view.*

- **Component** `BuildBlockedView({ projectId, readiness }: BuildBlockedViewProps)` - React component rendering build blocked view.

### `client/src/features/builds/components/build-config-card.tsx`
*React component for build-config-card.*

- **Component** `BuildConfigCard({
  config,
  onChange,
  onStart,
  disabled = false,
  isLoading = false,
}: BuildConfigCardProps)` - React component rendering build config card.

### `client/src/features/builds/components/build-progress-panel.tsx`
*React component for build-progress-panel.*

- **Component** `BuildProgressPanel({
  status,
  progress,
  currentStep,
  currentMessage,
  logs,
  error,
  onCancel,
  isCancelling = false,
}: BuildProgressPanelProps)` - React component rendering build progress panel.

### `client/src/features/builds/components/build-view.tsx`
*React component for build-view.*

- **Component** `BuildView({ projectId }: BuildViewProps)` - React component rendering build view.

### `client/src/features/builds/components/compare-dialog.tsx`
*React component for compare-dialog.*

- **Component** `CompareDialog({
  isOpen,
  onClose,
  versionA,
  versionB,
  projectId,
}: CompareDialogProps)` - React component rendering compare dialog.

### `client/src/features/builds/index.ts`
*Core implementation for index in client/src/features/builds.*

*(No public exports)*

### `client/src/features/builds/services/builds-socket.service.ts`
*Domain service orchestrating builds-socket.service business logic.*

- **Class** `BuildsSocketService` - Class implementing builds socket service.
- **Interface** `BuildsSocketCallbacks` - Interface defining structure for builds socket callbacks.
- **Type** `BuildSocketStatus` - Type alias for build socket status.

### `client/src/features/builds/services/builds.api.ts`
*Domain service orchestrating builds.api business logic.*

- **Const** `buildsApi`: `{ startBuild(projectId: string, dto: { alternat...` - Constant representing builds api.

### `client/src/features/builds/store/builds.store.ts`
*Zustand store managing application state for builds.store.*

- **Interface** `BuildLogEntry` - Interface defining structure for build log entry.
- **Interface** `BuildsState` - Interface defining structure for builds state.
- **Zustand Store** `useBuildsStore` (actions: setProjectId, setConfig, setReadiness, handleProgress, handleCompleted, handleFailed, setVersions, selectVersion, ...) - Zustand store managing use builds store state.

