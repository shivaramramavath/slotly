# Client Builds Feature Code Map

### `client/src/features/builds/components/alternative-card.tsx`
*(no description)*

- **Component** `AlternativeCard({
  version,
  projectId,
  isCompared = false,
  onToggleCompare,
  isComparingFull = false,
}: AlternativeCardProps)`

### `client/src/features/builds/components/build-blocked-view.tsx`
*(no description)*

- **Component** `BuildBlockedView({ projectId, readiness }: BuildBlockedViewProps)`

### `client/src/features/builds/components/build-config-card.tsx`
*(no description)*

- **Component** `BuildConfigCard({
  config,
  onChange,
  onStart,
  disabled = false,
  isLoading = false,
}: BuildConfigCardProps)`

### `client/src/features/builds/components/build-progress-panel.tsx`
*(no description)*

- **Component** `BuildProgressPanel({
  status,
  progress,
  currentStep,
  currentMessage,
  logs,
  error,
  onCancel,
  isCancelling = false,
}: BuildProgressPanelProps)`

### `client/src/features/builds/components/build-view.tsx`
*(no description)*

- **Component** `BuildView({ projectId }: BuildViewProps)`

### `client/src/features/builds/components/compare-dialog.tsx`
*(no description)*

- **Component** `CompareDialog({
  isOpen,
  onClose,
  versionA,
  versionB,
  projectId,
}: CompareDialogProps)`

### `client/src/features/builds/index.ts`
*(no description)*

*(No public exports)*

### `client/src/features/builds/services/builds-socket.service.ts`
*(no description)*

- **Class** `BuildsSocketService`
- **Interface** `BuildsSocketCallbacks`
- **Type** `BuildSocketStatus`

### `client/src/features/builds/services/builds.api.ts`
*(no description)*

- **Const** `buildsApi`: `{ startBuild(projectId: string, dto: { alternat...`

### `client/src/features/builds/store/builds.store.ts`
*(no description)*

- **Interface** `BuildLogEntry`
- **Interface** `BuildsState`
- **Zustand Store** `useBuildsStore` (actions: setProjectId, setConfig, setReadiness, handleProgress, handleCompleted, handleFailed, setVersions, selectVersion, ...)

