# Server Blueprint Module Code Map

### `server/src/modules/blueprint/blueprint.module.ts`
*Core implementation for blueprint.module in server/src/modules/blueprint.*

- **Class** `BlueprintModule` - Class implementing blueprint module.

### `server/src/modules/blueprint/controllers/blueprint.controller.ts`
*HTTP controller handling blueprint.controller endpoints.*

- **Controller** `BlueprintController` (base: `/projects/:projectId/blueprint`) - Controller handling blueprint controller HTTP endpoints.
  - `POST /projects/:projectId/blueprint/ai/chat` -> `chatAi()` [perm: 'BLUEPRINT_READ']
  - `GET /projects/:projectId/blueprint` -> `getGraph()` [perm: 'BLUEPRINT_READ']
  - `GET /projects/:projectId/blueprint/readiness` -> `getReadiness()` [perm: 'BLUEPRINT_READ']
  - `GET /projects/:projectId/blueprint/nodes/:nodeId/impact` -> `getImpact()` [perm: 'BLUEPRINT_READ']
  - `GET /projects/:projectId/blueprint/nodes/:nodeId/pool` -> `getNodePool()` [perm: 'BLUEPRINT_READ']
  - `POST /projects/:projectId/blueprint/nodes/:nodeId/pool` -> `mutatePool()` [perm: 'BLUEPRINT_EDIT']
  - `GET /projects/:projectId/blueprint/where-used` -> `getWhereUsed()` [perm: 'BLUEPRINT_READ']
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
*HTTP controller handling template.controller endpoints.*

- **Controller** `TemplateController` (base: `/blueprint-templates`) - Controller handling template controller HTTP endpoints.
  - `GET /blueprint-templates` -> `list()` [perm: 'BLUEPRINT_READ']
  - `POST /blueprint-templates` -> `create()` [perm: 'BLUEPRINT_TEMPLATE_MANAGE']
  - `GET /blueprint-templates/:templateId` -> `getById()` [perm: 'BLUEPRINT_READ']
  - `POST /blueprint-templates/:templateId/apply` -> `apply()` [perm: 'BLUEPRINT_EDIT']
  - `POST /blueprint-templates/:templateId/duplicate` -> `duplicate()` [perm: 'BLUEPRINT_TEMPLATE_MANAGE']
  - `GET /blueprint-templates/:templateId/export` -> `export()` [perm: 'BLUEPRINT_READ']
  - `POST /blueprint-templates/import` -> `import()` [perm: 'BLUEPRINT_TEMPLATE_MANAGE']

### `server/src/modules/blueprint/gates/blueprint-gates.ts`
*Core implementation for blueprint-gates in server/src/modules/blueprint/gates.*

- **Class** `ProjectNotLockedGate` implements `IGate` - Class implementing project not locked gate.
- **Class** `PermissionGate` implements `IGate` - Class implementing permission gate.
- **Class** `ParentExistsGate` implements `IGate` - Class implementing parent exists gate.
- **Class** `ParentTypeAllowedGate` implements `IGate` - Class implementing parent type allowed gate.
- **Class** `ParentCompleteGate` implements `IGate` - Class implementing parent complete gate.
- **Class** `SingleParentGate` implements `IGate` - Class implementing single parent gate.
- **Class** `NoCycleGate` implements `IGate` - Class implementing no cycle gate.
- **Class** `DuplicateNameGate` implements `IGate` - Class implementing duplicate name gate.
- **Class** `CapacityGate` implements `IGate` - Class implementing capacity gate.
- **Class** `ConnectionEndpointGate` implements `IGate` - Class implementing connection endpoint gate.
- **Class** `QualificationGate` implements `IGate` - Class implementing qualification gate.
- **Class** `PoolDuplicateGate` implements `IGate` - Gate verifying a pool addition does not duplicate an item already in additions.
- **Class** `PoolRequiredGate` implements `IGate` - Gate verifying descendant nodes cannot exclude items marked required by ancestors.
- **Class** `PoolImpactGate` implements `IGate` - Gate verifying removing/excluding a pool item does not break active section assignments.
- **Class** `PoolItemExistsGate` implements `IGate` - Gate verifying referenced library item exists in repository.
- **Class** `PoolItemActiveGate` implements `IGate` - Gate verifying referenced library item is not archived.
- **Class** `PoolDepartmentGate` implements `IGate` - Gate verifying resource department compatibility.
- **Class** `AssignmentInPoolGate` implements `IGate` - Gate verifying that assigned subjects, faculty, and rooms exist in effective pool.

### `server/src/modules/blueprint/gates/gate-chain.ts`
*Core implementation for gate-chain in server/src/modules/blueprint/gates.*

- **Injectable** `GateChain` (deps: NodeTypeRegistry) - Injectable service providing gate chain logic.

### `server/src/modules/blueprint/gates/gate.interface.ts`
*Core implementation for gate.interface in server/src/modules/blueprint/gates.*

- **Interface** `GateContext` - Interface defining structure for gate context.
- **Interface** `GateResult` - Interface defining structure for gate result.
- **Interface** `IGate` - Interface defining structure for gate.

### `server/src/modules/blueprint/gateways/blueprint.gateway.ts`
*WebSocket gateway managing real-time events for blueprint.gateway.*

- **Gateway** `BlueprintGateway` (namespace: `/blueprint`) - WebSocket gateway handling blueprint gateway real-time events.
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
  - `/blueprint: SocketEvents.NODE_PATCH` -> `handleNodePatch()`
  - `/blueprint: SocketEvents.POOL_MUTATE` -> `handlePoolMutate()`
  - `/blueprint: SocketEvents.ASSIGNMENT_MUTATE` -> `handleAssignmentMutate()`
- **Interface** `SocketUserData` - Interface defining structure for socket user data.
- **Interface** `SocketData` - Interface defining structure for socket data.
- **Type** `AuthenticatedSocket` - Type alias for authenticated socket.

### `server/src/modules/blueprint/model/completion-rule.strategy.ts`
*Strategy implementation for completion-rule.strategy.*

- **Interface** `CompletionContext` - Interface defining structure for completion context.
- **Interface** `CompletionResult` - Interface defining structure for completion result.
- **Interface** `CompletionRuleStrategy` - Interface defining structure for completion rule strategy.

### `server/src/modules/blueprint/model/node-type.registry.ts`
*Core implementation for node-type.registry in server/src/modules/blueprint/model.*

- **Injectable** `NodeTypeRegistry` - Injectable service providing node type registry logic.
- **Interface** `NodeTypeDefinition` - Interface defining structure for node type definition.

### `server/src/modules/blueprint/model/rules/blueprint-completion.rules.ts`
*Core implementation for blueprint-completion.rules in server/src/modules/blueprint/model/rules.*

- **Class** `InstitutionCompletionRule` implements `CompletionRuleStrategy` - Class implementing institution completion rule.
- **Class** `DepartmentCompletionRule` implements `CompletionRuleStrategy` - Class implementing department completion rule.
- **Class** `ProgramCompletionRule` implements `CompletionRuleStrategy` - Class implementing program completion rule.
- **Class** `AcademicYearCompletionRule` implements `CompletionRuleStrategy` - Class implementing academic year completion rule.
- **Class** `SemesterCompletionRule` implements `CompletionRuleStrategy` - Class implementing semester completion rule.
- **Class** `SectionCompletionRule` implements `CompletionRuleStrategy` - Class implementing section completion rule.
- **Class** `BatchCompletionRule` implements `CompletionRuleStrategy` - Class implementing batch completion rule.
- **Class** `SubjectAssignmentCompletionRule` implements `CompletionRuleStrategy` - Class implementing subject assignment completion rule.
- **Class** `ElectiveGroupCompletionRule` implements `CompletionRuleStrategy` - Class implementing elective group completion rule.
- **Class** `FacultyCompletionRule` implements `CompletionRuleStrategy` - Class implementing faculty completion rule.
- **Class** `RoomCompletionRule` implements `CompletionRuleStrategy` - Class implementing room completion rule.

### `server/src/modules/blueprint/processors/blueprint-write.processor.ts`
*Queue processor handling background jobs for blueprint-write.processor.*

- **Queue Processor** `BlueprintWriteProcessor` (queue: `WRITE_BEHIND_QUEUE`) - BullMQ queue processor for blueprint write processor jobs.
  - `WRITE_BEHIND_QUEUE: *` -> `BlueprintWriteProcessor.process()`
- **Interface** `SyncNodeJobData` - Interface defining structure for sync node job data.

### `server/src/modules/blueprint/repositories/blueprint-auxiliary.repositories.ts`
*Core implementation for blueprint-auxiliary.repositories in server/src/modules/blueprint/repositories.*

- **Injectable** `BlueprintTemplateRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing blueprint template repository logic.
- **Injectable** `BlueprintHistoryRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing blueprint history repository logic.
- **Injectable** `BlueprintSnapshotRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing blueprint snapshot repository logic.
- **Injectable** `BlueprintCommentRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing blueprint comment repository logic.

### `server/src/modules/blueprint/repositories/blueprint.repository.interface.ts`
*Database repository managing blueprint.repository.interface persistence.*

- **Interface** `IBlueprintRepository` extends `BaseRepository<Blueprint>` - Interface defining structure for blueprint repository.

### `server/src/modules/blueprint/repositories/cached-blueprint.repository.ts`
*Database repository managing cached-blueprint.repository persistence.*

- **Injectable** `CachedBlueprintRepository` implements `IBlueprintRepository` (deps: MongoBlueprintRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached blueprint repository logic.

### `server/src/modules/blueprint/repositories/mongo-blueprint.repository.ts`
*Database repository managing mongo-blueprint.repository persistence.*

- **Injectable** `MongoBlueprintRepository` implements `IBlueprintRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo blueprint repository logic.

### `server/src/modules/blueprint/schemas/blueprint-comment.schema.ts`
*Data schema and persistence model for blueprint-comment.schema.*

- **Mongoose Schema** `BlueprintComment` (collection: `blueprint_comments` (indexes: projectId, nodeId)) - Class implementing blueprint comment.
- **Type** `BlueprintCommentDocument` - Type alias for blueprint comment document.
- **Zod Schema** `BlueprintCommentSchema` -> `BlueprintComment` - Zod schema validating blueprint comment.

### `server/src/modules/blueprint/schemas/blueprint-history.schema.ts`
*Data schema and persistence model for blueprint-history.schema.*

- **Mongoose Schema** `BlueprintHistory` (collection: `blueprint_history` (indexes: projectId)) - Class implementing blueprint history.
- **Type** `BlueprintHistoryDocument` - Type alias for blueprint history document.
- **Zod Schema** `BlueprintHistorySchema` -> `BlueprintHistory` - Zod schema validating blueprint history.

### `server/src/modules/blueprint/schemas/blueprint-snapshot.schema.ts`
*Data schema and persistence model for blueprint-snapshot.schema.*

- **Mongoose Schema** `BlueprintSnapshot` (collection: `blueprint_snapshots` (indexes: projectId)) - Class implementing blueprint snapshot.
- **Type** `BlueprintSnapshotDocument` - Type alias for blueprint snapshot document.
- **Zod Schema** `BlueprintSnapshotSchema` -> `BlueprintSnapshot` - Zod schema validating blueprint snapshot.

### `server/src/modules/blueprint/schemas/blueprint-template.schema.ts`
*Data schema and persistence model for blueprint-template.schema.*

- **Mongoose Schema** `BlueprintTemplate` (collection: `blueprint_templates` (indexes: category, visibility, institutionId)) - Class implementing blueprint template.
- **Type** `BlueprintTemplateDocument` - Type alias for blueprint template document.
- **Zod Schema** `BlueprintTemplateSchema` -> `BlueprintTemplate` - Zod schema validating blueprint template.

### `server/src/modules/blueprint/schemas/blueprint.schema.ts`
*Data schema and persistence model for blueprint.schema.*

- **Mongoose Schema** `BlueprintNodeSchemaClass` (collection: `blueprintnodeschemaclass`) - Class implementing blueprint node schema class.
- **Mongoose Schema** `BlueprintEdgeSchemaClass` (collection: `blueprintedgeschemaclass`) - Class implementing blueprint edge schema class.
- **Mongoose Schema** `Blueprint` (collection: `blueprints` (indexes: projectId)) - Class implementing blueprint.
- **Type** `BlueprintDocument` - Type alias for blueprint document.
- **Zod Schema** `BlueprintSchema` -> `Blueprint` - Zod schema validating blueprint.

### `server/src/modules/blueprint/services/blueprint-ai.service.ts`
*Service generating intelligent read-only whole-blueprint AI assistance.*

- **Injectable** `BlueprintAiService` (deps: BlueprintService) - Service providing whole-blueprint AI assistant chat with compact context summarization.

### `server/src/modules/blueprint/services/blueprint.service.ts`
*Domain service orchestrating blueprint.service business logic.*

- **Injectable** `BlueprintService` (deps: CachedBlueprintRepository, CachedProjectRepository, OperationService, CompletionService, ReadinessService, ImpactAnalyzerService, RecommendationsService, BlueprintHistoryRepository, BlueprintSnapshotRepository, BlueprintCommentRepository, EventBus, PoolResolverService, GateChain) - Injectable service providing blueprint service logic.

### `server/src/modules/blueprint/services/completion.service.ts`
*Domain service orchestrating completion.service business logic.*

- **Injectable** `CompletionService` (deps: NodeTypeRegistry) - Injectable service providing completion service logic.
- **Interface** `NodeStatusChangeEvent` - Interface defining structure for node status change event.

### `server/src/modules/blueprint/services/constraint-resolver.service.ts`
*Domain service orchestrating constraint-resolver.service business logic.*

- **Injectable** `ConstraintResolverService` - Injectable service providing constraint resolver service logic.

### `server/src/modules/blueprint/services/graph-from-institution.builder.ts`
*Domain service orchestrating graph-from-institution.builder business logic.*

- **Injectable** `GraphFromInstitutionBuilder` (deps: CompletionService) - Injectable service providing graph from institution builder logic.
- **Interface** `StructureBuildInput` - Interface defining structure for structure build input.

### `server/src/modules/blueprint/services/impact-analyzer.service.ts`
*Domain service orchestrating impact-analyzer.service business logic.*

- **Injectable** `ImpactAnalyzerService` - Injectable service providing impact analyzer service logic.

### `server/src/modules/blueprint/services/operation.service.ts`
*Domain service orchestrating operation.service business logic.*

- **Injectable** `OperationService` (deps: GateChain, CompletionService) - Injectable service providing operation service logic.
- **Interface** `ApplyBatchResult` - Interface defining structure for apply batch result.

### `server/src/modules/blueprint/services/pool-resolver.service.ts`
*Service resolving hierarchical resource pools and where-used references for blueprint nodes.*

- **Injectable** `PoolResolverService` (deps: @Inject(FACULTY_REPOSITORY), @Inject(SUBJECT_REPOSITORY), @Inject(ROOM_REPOSITORY), CachedBlueprintRepository | undefined) - Injectable service resolving effective resource pools with inheritance rules.
- **Interface** `WhereUsedResult` - Result item representing a node where a library resource is referenced.

### `server/src/modules/blueprint/services/readiness.service.ts`
*Domain service orchestrating readiness.service business logic.*

- **Injectable** `ReadinessService` - Injectable service providing readiness service logic.

### `server/src/modules/blueprint/services/recommendations.service.ts`
*Domain service orchestrating recommendations.service business logic.*

- **Class** `FacultyRecommender` implements `IRecommenderStrategy` - Class implementing faculty recommender.
- **Class** `RoomRecommender` implements `IRecommenderStrategy` - Class implementing room recommender.
- **Class** `MissingConnectionDetector` implements `IRecommenderStrategy` - Class implementing missing connection detector.
- **Class** `UnusedResourceDetector` implements `IRecommenderStrategy` - Class implementing unused resource detector.
- **Injectable** `RecommendationsService` - Injectable service providing recommendations service logic.
- **Interface** `IRecommenderStrategy` - Interface defining structure for recommender strategy.

### `server/src/modules/blueprint/services/template.service.ts`
*Domain service orchestrating template.service business logic.*

- **Injectable** `TemplateService` implements `OnModuleInit` (deps: BlueprintTemplateRepository, CachedBlueprintRepository, CachedProjectRepository, OperationService) - Injectable service providing template service logic.

