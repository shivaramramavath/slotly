# Server Builds Module Code Map

### `server/src/modules/builds/builds.module.ts`
*(no description)*

- **Class** `BuildsModule`

### `server/src/modules/builds/controllers/builds.controller.ts`
*(no description)*

- **Controller** `BuildsController` (base: `/`)
  - `POST /projects/:projectId/builds` -> `createBuild()` [perm: 'PROJECT_MANAGE']
  - `GET /projects/:projectId/builds/current` -> `getCurrentBuild()` [perm: 'PROJECT_READ']
  - `POST /projects/:projectId/builds/cancel` -> `cancelBuildPost()` [perm: 'PROJECT_MANAGE']
  - `DELETE /projects/:projectId/builds/current` -> `cancelBuildDelete()` [perm: 'PROJECT_MANAGE']
  - `GET /projects/:projectId/versions` -> `getProjectVersions()` [perm: 'PROJECT_READ']
  - `GET /versions/:versionId` -> `getVersion()` [perm: 'PROJECT_READ']

### `server/src/modules/builds/gateways/builds.gateway.ts`
*(no description)*

- **Gateway** `BuildsGateway` (namespace: `/builds`)
  - `/builds: build:join` -> `handleJoin()`
  - `/builds: build:leave` -> `handleLeave()`
- **Interface** `SocketUserData`
- **Interface** `SocketData`
- **Type** `AuthenticatedSocket`

### `server/src/modules/builds/repositories/cached-schedule-version.repository.ts`
*(no description)*

- **Injectable** `CachedScheduleVersionRepository` implements `IScheduleVersionRepository` (deps: MongoScheduleVersionRepository, @Inject(CACHE_SERVICE))

### `server/src/modules/builds/repositories/mongo-schedule-version.repository.ts`
*(no description)*

- **Injectable** `MongoScheduleVersionRepository` implements `IScheduleVersionRepository` (deps: ObjectId; }> & { __v: number; }>)

### `server/src/modules/builds/repositories/schedule-version.repository.interface.ts`
*(no description)*

- **Interface** `IScheduleVersionRepository`
- **Const** `SCHEDULE_VERSION_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/builds/schemas/schedule-version.schema.ts`
*(no description)*

- **Mongoose Schema** `ScheduleVersion` (collection: `schedule_versions` (indexes: projectId, status))
- **Type** `ScheduleVersionDocument`
- **Zod Schema** `ScheduleVersionSchema` -> `ScheduleVersion`

### `server/src/modules/builds/services/build.facade.ts`
*(no description)*

- **Injectable** `BuildFacade` (deps: WriteBehindService, @Inject(forwardRef(() => BlueprintService)), ReadinessService, @Inject(forwardRef(() => ProjectsService)), EngineValidationService, @Inject(SCHEDULE_VERSION_REPOSITORY), EventBus, AuditService)

### `server/src/modules/builds/services/builds.service.ts`
*(no description)*

- **Injectable** `BuildsService` (deps: BuildFacade, BuildsGateway, @Inject(CACHE_SERVICE), @Inject(SCHEDULE_VERSION_REPOSITORY))
- **Const** `BUILDS_QUEUE`: `"builds"`

