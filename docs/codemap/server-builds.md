# Server Builds Module Code Map

### `server/src/modules/builds/builds.module.ts`
*Core implementation for builds.module in server/src/modules/builds.*

- **Class** `BuildsModule` - Class implementing builds module.

### `server/src/modules/builds/controllers/builds.controller.ts`
*HTTP controller handling timetable builds execution, polling, and cancellation.*

- **Controller** `BuildsController` (base: `/`) - Controller handling builds controller HTTP endpoints.
  - `POST /projects/:projectId/builds` -> `createBuild()` [perm: 'PROJECT_MANAGE']
  - `GET /projects/:projectId/builds` -> `getProjectBuilds()` [perm: 'PROJECT_READ']
  - `GET /projects/:projectId/builds/current` -> `getCurrentBuild()` [perm: 'PROJECT_READ']
  - `POST /projects/:projectId/builds/cancel` -> `cancelBuildPost()` [perm: 'PROJECT_MANAGE']
  - `DELETE /projects/:projectId/builds/current` -> `cancelBuildDelete()` [perm: 'PROJECT_MANAGE']

### `server/src/modules/builds/gateways/builds.gateway.ts`
*WebSocket gateway managing real-time events for builds.gateway.*

- **Gateway** `BuildsGateway` (namespace: `/builds`) - WebSocket gateway handling builds gateway real-time events.
  - `/builds: build:join` -> `handleJoin()`
  - `/builds: build:leave` -> `handleLeave()`
- **Interface** `SocketUserData` - Interface defining structure for socket user data.
- **Interface** `SocketData` - Interface defining structure for socket data.
- **Type** `AuthenticatedSocket` - Type alias for authenticated socket.

### `server/src/modules/builds/repositories/cached-schedule-version.repository.ts`
*Database repository managing cached-schedule-version.repository persistence.*

- **Injectable** `CachedScheduleVersionRepository` implements `IScheduleVersionRepository` (deps: MongoScheduleVersionRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached schedule version repository logic.

### `server/src/modules/builds/repositories/mongo-schedule-version.repository.ts`
*Database repository managing mongo-schedule-version.repository persistence.*

- **Injectable** `MongoScheduleVersionRepository` implements `IScheduleVersionRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo schedule version repository logic.

### `server/src/modules/builds/repositories/schedule-version.repository.interface.ts`
*Database repository managing schedule-version.repository.interface persistence.*

- **Interface** `IScheduleVersionRepository` - Interface defining structure for schedule version repository.
- **Const** `SCHEDULE_VERSION_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing schedule version repository.

### `server/src/modules/builds/schemas/schedule-version.schema.ts`
*Data schema and persistence model for schedule-version.schema.*

- **Mongoose Schema** `ScheduleVersion` (collection: `schedule_versions` (indexes: projectId, status)) - Class implementing schedule version.
- **Type** `ScheduleVersionDocument` - Type alias for schedule version document.
- **Zod Schema** `ScheduleVersionSchema` -> `ScheduleVersion` - Zod schema validating schedule version.

### `server/src/modules/builds/services/build.facade.ts`
*Domain service orchestrating build.facade business logic.*

- **Injectable** `BuildFacade` (deps: WriteBehindService, @Inject(forwardRef(() => BlueprintService)), ReadinessService, @Inject(forwardRef(() => ProjectsService)), EngineValidationService, @Inject(SCHEDULE_VERSION_REPOSITORY), EventBus, AuditService, ScheduleEntryRepository | undefined, ScheduleOccupancyRepository | undefined, TransactionHelper | undefined) - Injectable service providing build facade logic.

### `server/src/modules/builds/services/builds.service.ts`
*Domain service orchestrating builds.service business logic.*

- **Injectable** `BuildsService` (deps: BuildFacade, BuildsGateway, @Inject(CACHE_SERVICE), @Inject(SCHEDULE_VERSION_REPOSITORY)) - Injectable service providing builds service logic.
- **Const** `BUILDS_QUEUE`: `"builds"` - Constant representing builds queue.

