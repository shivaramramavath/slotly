# Server Blueprint Module Code Map

### `server/src/modules/blueprint/blueprint.module.ts`
*(no description)*

- **Class** `BlueprintModule`

### `server/src/modules/blueprint/controllers/blueprint.controller.ts`
*(no description)*

- **Controller** `BlueprintController` (base: `/projects/:projectId/blueprint`)
  - `GET /projects/:projectId/blueprint` -> `getGraph()` [perm: 'BLUEPRINT_READ']
  - `GET /projects/:projectId/blueprint/readiness` -> `getReadiness()` [perm: 'BLUEPRINT_READ']
  - `GET /projects/:projectId/blueprint/nodes/:nodeId/impact` -> `getImpact()` [perm: 'BLUEPRINT_READ']
  - `POST /projects/:projectId/blueprint/operations` -> `applyOperations()` [perm: 'BLUEPRINT_EDIT']
  - `GET /projects/:projectId/blueprint/history` -> `getHistory()` [perm: 'BLUEPRINT_READ']
  - `GET /projects/:projectId/blueprint/recommendations` -> `getRecommendations()` [perm: 'BLUEPRINT_READ']
  - `GET /projects/:projectId/blueprint/export` -> `export()` [perm: 'BLUEPRINT_READ']
  - `POST /projects/:projectId/blueprint/import` -> `import()` [perm: 'BLUEPRINT_EDIT']
  - `GET /projects/:projectId/blueprint/nodes/:nodeId/comments` -> `getComments()` [perm: 'BLUEPRINT_READ']
  - `POST /projects/:projectId/blueprint/nodes/:nodeId/comments` -> `addComment()` [perm: 'BLUEPRINT_EDIT']
  - `POST /projects/:projectId/blueprint/snapshots` -> `createSnapshot()` [perm: 'BLUEPRINT_EDIT']
  - `GET /projects/:projectId/blueprint/snapshots` -> `listSnapshots()` [perm: 'BLUEPRINT_READ']
  - `POST /projects/:projectId/blueprint/snapshots/:snapshotId/restore` -> `restoreSnapshot()` [perm: 'BLUEPRINT_EDIT']
  - `GET /projects/:projectId/blueprint/snapshots/:snapshotId/compare` -> `compareSnapshot()` [perm: 'BLUEPRINT_READ']

### `server/src/modules/blueprint/controllers/template.controller.ts`
*(no description)*

- **Controller** `TemplateController` (base: `/blueprint-templates`)
  - `GET /blueprint-templates` -> `list()` [perm: 'BLUEPRINT_READ']
  - `POST /blueprint-templates` -> `create()` [perm: 'BLUEPRINT_TEMPLATE_MANAGE']
  - `GET /blueprint-templates/:templateId` -> `getById()` [perm: 'BLUEPRINT_READ']
  - `POST /blueprint-templates/:templateId/apply` -> `apply()` [perm: 'BLUEPRINT_EDIT']
  - `POST /blueprint-templates/:templateId/duplicate` -> `duplicate()` [perm: 'BLUEPRINT_TEMPLATE_MANAGE']
  - `GET /blueprint-templates/:templateId/export` -> `export()` [perm: 'BLUEPRINT_READ']
  - `POST /blueprint-templates/import` -> `import()` [perm: 'BLUEPRINT_TEMPLATE_MANAGE']

### `server/src/modules/blueprint/gates/blueprint-gates.ts`
*(no description)*

- **Class** `ProjectNotLockedGate` implements `IGate`
- **Class** `PermissionGate` implements `IGate`
- **Class** `ParentExistsGate` implements `IGate`
- **Class** `ParentTypeAllowedGate` implements `IGate`
- **Class** `ParentCompleteGate` implements `IGate`
- **Class** `SingleParentGate` implements `IGate`
- **Class** `NoCycleGate` implements `IGate`
- **Class** `DuplicateNameGate` implements `IGate`
- **Class** `CapacityGate` implements `IGate`
- **Class** `ConnectionEndpointGate` implements `IGate`
- **Class** `QualificationGate` implements `IGate`

### `server/src/modules/blueprint/gates/gate-chain.ts`
*(no description)*

- **Injectable** `GateChain` (deps: NodeTypeRegistry)

### `server/src/modules/blueprint/gates/gate.interface.ts`
*(no description)*

- **Interface** `GateContext`
- **Interface** `GateResult`
- **Interface** `IGate`

### `server/src/modules/blueprint/gateways/blueprint.gateway.ts`
*(no description)*

- **Gateway** `BlueprintGateway` (namespace: `/blueprint`)
  - `/blueprint: SocketEvents.JOIN_PROJECT` -> `handleJoinProject()`
  - `/blueprint: SocketEvents.LEAVE_PROJECT` -> `handleLeaveProject()`
  - `/blueprint: SocketEvents.UPDATE_CURSOR` -> `handleCursorUpdate()`
  - `/blueprint: SocketEvents.LOCK_NODE` -> `handleNodeLock()`
  - `/blueprint: SocketEvents.UNLOCK_NODE` -> `handleNodeUnlock()`
  - `/blueprint: SocketEvents.NODE_ADD` -> `handleNodeAdd()`
  - `/blueprint: SocketEvents.NODE_DELETE` -> `handleNodeDelete()`
  - `/blueprint: SocketEvents.EDGE_ADD` -> `handleEdgeAdd()`
  - `/blueprint: SocketEvents.EDGE_DELETE` -> `handleEdgeDelete()`
  - `/blueprint: SocketEvents.NODE_MOVE` -> `handleNodeMove()`
  - `/blueprint: SocketEvents.NODE_UPDATE` -> `handleNodeUpdate()`
- **Interface** `SocketUserData`
- **Interface** `SocketData`
- **Type** `AuthenticatedSocket`

### `server/src/modules/blueprint/model/completion-rule.strategy.ts`
*(no description)*

- **Interface** `CompletionContext`
- **Interface** `CompletionResult`
- **Interface** `CompletionRuleStrategy`

### `server/src/modules/blueprint/model/node-type.registry.ts`
*(no description)*

- **Injectable** `NodeTypeRegistry`
- **Interface** `NodeTypeDefinition`

### `server/src/modules/blueprint/model/rules/blueprint-completion.rules.ts`
*(no description)*

- **Class** `InstitutionCompletionRule` implements `CompletionRuleStrategy`
- **Class** `DepartmentCompletionRule` implements `CompletionRuleStrategy`
- **Class** `ProgramCompletionRule` implements `CompletionRuleStrategy`
- **Class** `AcademicYearCompletionRule` implements `CompletionRuleStrategy`
- **Class** `SemesterCompletionRule` implements `CompletionRuleStrategy`
- **Class** `SectionCompletionRule` implements `CompletionRuleStrategy`
- **Class** `BatchCompletionRule` implements `CompletionRuleStrategy`
- **Class** `SubjectAssignmentCompletionRule` implements `CompletionRuleStrategy`
- **Class** `ElectiveGroupCompletionRule` implements `CompletionRuleStrategy`
- **Class** `FacultyCompletionRule` implements `CompletionRuleStrategy`
- **Class** `RoomCompletionRule` implements `CompletionRuleStrategy`

### `server/src/modules/blueprint/processors/blueprint-write.processor.ts`
*(no description)*

- **Queue Processor** `BlueprintWriteProcessor` (queue: `WRITE_BEHIND_QUEUE`)
  - `WRITE_BEHIND_QUEUE: *` -> `BlueprintWriteProcessor.process()`
- **Interface** `SyncNodeJobData`

### `server/src/modules/blueprint/repositories/blueprint-auxiliary.repositories.ts`
*(no description)*

- **Injectable** `BlueprintTemplateRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `BlueprintHistoryRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `BlueprintSnapshotRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `BlueprintCommentRepository` (deps: ObjectId; }> & { __v: number; }>)

### `server/src/modules/blueprint/repositories/blueprint.repository.interface.ts`
*(no description)*

- **Interface** `IBlueprintRepository` extends `BaseRepository<Blueprint>`

### `server/src/modules/blueprint/repositories/cached-blueprint.repository.ts`
*(no description)*

- **Injectable** `CachedBlueprintRepository` implements `IBlueprintRepository` (deps: MongoBlueprintRepository, @Inject(CACHE_SERVICE))

### `server/src/modules/blueprint/repositories/mongo-blueprint.repository.ts`
*(no description)*

- **Injectable** `MongoBlueprintRepository` implements `IBlueprintRepository` (deps: ObjectId; }> & { __v: number; }>)

### `server/src/modules/blueprint/schemas/blueprint-comment.schema.ts`
*(no description)*

- **Mongoose Schema** `BlueprintComment` (collection: `blueprint_comments` (indexes: projectId, nodeId))
- **Type** `BlueprintCommentDocument`
- **Zod Schema** `BlueprintCommentSchema` -> `BlueprintComment`

### `server/src/modules/blueprint/schemas/blueprint-history.schema.ts`
*(no description)*

- **Mongoose Schema** `BlueprintHistory` (collection: `blueprint_history` (indexes: projectId))
- **Type** `BlueprintHistoryDocument`
- **Zod Schema** `BlueprintHistorySchema` -> `BlueprintHistory`

### `server/src/modules/blueprint/schemas/blueprint-snapshot.schema.ts`
*(no description)*

- **Mongoose Schema** `BlueprintSnapshot` (collection: `blueprint_snapshots` (indexes: projectId))
- **Type** `BlueprintSnapshotDocument`
- **Zod Schema** `BlueprintSnapshotSchema` -> `BlueprintSnapshot`

### `server/src/modules/blueprint/schemas/blueprint-template.schema.ts`
*(no description)*

- **Mongoose Schema** `BlueprintTemplate` (collection: `blueprint_templates` (indexes: category, visibility, institutionId))
- **Type** `BlueprintTemplateDocument`
- **Zod Schema** `BlueprintTemplateSchema` -> `BlueprintTemplate`

### `server/src/modules/blueprint/schemas/blueprint.schema.ts`
*(no description)*

- **Mongoose Schema** `BlueprintNodeSchemaClass` (collection: `blueprintnodeschemaclass`)
- **Mongoose Schema** `BlueprintEdgeSchemaClass` (collection: `blueprintedgeschemaclass`)
- **Mongoose Schema** `Blueprint` (collection: `blueprints` (indexes: projectId))
- **Type** `BlueprintDocument`
- **Zod Schema** `BlueprintSchema` -> `Blueprint`

### `server/src/modules/blueprint/services/blueprint.service.ts`
*(no description)*

- **Injectable** `BlueprintService` (deps: CachedBlueprintRepository, CachedProjectRepository, OperationService, CompletionService, ReadinessService, ImpactAnalyzerService, RecommendationsService, BlueprintHistoryRepository, BlueprintSnapshotRepository, BlueprintCommentRepository, EventBus)

### `server/src/modules/blueprint/services/completion.service.ts`
*(no description)*

- **Injectable** `CompletionService` (deps: NodeTypeRegistry)
- **Interface** `NodeStatusChangeEvent`

### `server/src/modules/blueprint/services/constraint-resolver.service.ts`
*(no description)*

- **Injectable** `ConstraintResolverService`

### `server/src/modules/blueprint/services/graph-from-institution.builder.ts`
*(no description)*

- **Injectable** `GraphFromInstitutionBuilder` (deps: CompletionService)
- **Interface** `StructureBuildInput`

### `server/src/modules/blueprint/services/impact-analyzer.service.ts`
*(no description)*

- **Injectable** `ImpactAnalyzerService`

### `server/src/modules/blueprint/services/operation.service.ts`
*(no description)*

- **Injectable** `OperationService` (deps: GateChain, CompletionService)
- **Interface** `ApplyBatchResult`

### `server/src/modules/blueprint/services/readiness.service.ts`
*(no description)*

- **Injectable** `ReadinessService`

### `server/src/modules/blueprint/services/recommendations.service.ts`
*(no description)*

- **Class** `FacultyRecommender` implements `IRecommenderStrategy`
- **Class** `RoomRecommender` implements `IRecommenderStrategy`
- **Class** `MissingConnectionDetector` implements `IRecommenderStrategy`
- **Class** `UnusedResourceDetector` implements `IRecommenderStrategy`
- **Injectable** `RecommendationsService`
- **Interface** `IRecommenderStrategy`

### `server/src/modules/blueprint/services/template.service.ts`
*(no description)*

- **Injectable** `TemplateService` implements `OnModuleInit` (deps: BlueprintTemplateRepository, CachedBlueprintRepository, CachedProjectRepository, OperationService)

