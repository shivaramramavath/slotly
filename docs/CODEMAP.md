# Slotly Code Map

## How to use this map

1. Search the "Reuse first" table before writing any new class, function, hook, or component.
2. If adding a new capability, check "Extension points" to extend existing registries instead of branching logic.
3. Review "Gotchas" to avoid common pitfalls with auth tokens, caching, write-behind, and React 19 rendering.
4. For exhaustive per-package symbol references, jump to the generated maps linked below.
5. Keep this file updated: run `pnpm codemap` before committing changes and verify with `pnpm codemap:check`.

## Repository Layout

- `client/`: Next.js 16 App Router frontend with React 19, Tailwind v4, `@xyflow/react`, and Zustand stores.
- `client/src/app/`: Next.js route handlers, page layouts, loading boundaries, and error screens.
- `client/src/components/`: Shared UI component primitives (`ui/`) and global application shell layouts (`layouts/`).
- `client/src/features/auth/`: User authentication, sessions, OTP verification, and role-based access helpers.
- `client/src/features/blueprint/`: React Flow visual canvas, node components, toolbar, and collaborative websocket hooks.
- `client/src/features/builds/`: Timetable generation solver interface, progress feeds, and candidate comparison.
- `client/src/features/institution/`: Institutional hierarchy management (departments, programs, years, sections, batches).
- `client/src/features/library/`: Resource catalogs for faculty workloads, subjects, elective groups, and room facilities.
- `client/src/features/projects/`: Project lifecycle management, term parameters, and timetable settings.
- `client/src/lib/`: Low-level browser utilities, class name merging (`cn`), and typed `apiClient`.
- `server/`: NestJS backend application with MongoDB Mongoose repositories, Redis caching, and BullMQ queues.
- `server/src/common/`: Cross-cutting concerns: audit logging, Redis caching, database base classes, events, RBAC, and queues.
- `server/src/modules/auth/`: Authentication workflows, session rotation, TOTP MFA, password policies, and rate limiting.
- `server/src/modules/blueprint/`: Blueprint graph domain, gate checks, completion rules, and real-time WebSocket gateway.
- `server/src/modules/builds/`: Generation build orchestration facade, BullMQ build worker, and schedule version persistence.
- `server/src/modules/engine/`: Pure TypeScript constraint engine, hard/soft scoring validators, and timetable solver.
- `server/src/modules/institutions/`: Organizational structure tree management, calendar dates, and working days config.
- `server/src/modules/library/`: Faculty, subject, elective group, and room domain services with qualification strategies.
- `packages/contracts/`: Shared Zod schemas, TypeScript DTO types, permission registries, and socket event constants.
- `docs/`: Product feature specifications, API routes, gating rules, codemaps, and progress logs.
- `scripts/`: Development and maintenance automation tooling, including the code map generator.

<!-- MANUAL:START -->

## Reuse First
<<<<<<< HEAD
| Task in plain words | Thing to use | File path |
| :--- | :--- | :--- |
| Cache reads with TTL & tags | `CacheService` | `server/src/common/cache/cache.interface.ts` |
| Concrete Redis cache & tags | `RedisCacheService` | `server/src/common/cache/redis-cache.service.ts` |
| Generic MongoDB CRUD repository | `MongoBaseRepository` | `server/src/common/database/mongo-base.repository.ts` |
| Cache-aside repository decorator | `CachedRepository` | `server/src/common/database/cached.repository.ts` |
| Multi-document DB transactions | `TransactionHelper` | `server/src/common/database/transaction.helper.ts` |
| Asynchronous non-critical writes | `WriteBehindService` | `server/src/common/queue/write-behind.service.ts` |
| Structural audit logging | `AuditService` | `server/src/common/audit/audit.service.ts` |
| Domain event publish / subscribe | `EventBus` | `server/src/common/events/event-bus.service.ts` |
| Optimistic concurrency revision check | `RevisionHelper`, `RevisionConflictException` | `server/src/common/concurrency/revision.helper.ts` |
| Controller request Zod validation | `ZodValidationPipe` | `server/src/common/pipes/zod-validation.pipe.ts` |
| Server route permission guards | `RequirePermissions`, `PermissionsGuard` | `server/src/common/rbac/permissions.guard.ts` |
| Client permission checking hook | `usePermission` | `client/src/features/auth/hooks/use-permission.ts` |
| Conditional JSX by permission | `Can` | `client/src/features/auth/components/can.tsx` |
| Server step-up auth challenge guard | `StepUpGuard` | `server/src/modules/auth/guards/step-up.guard.ts` |
| Client step-up password modal | `StepUpDialog` | `client/src/features/auth/components/step-up-dialog.tsx` |
| Redis sliding-window rate limiting | `RedisThrottlerService` | `server/src/modules/auth/services/throttler.service.ts` |
| Matching rooms for subject criteria | `ROOM_MATCHER`, `StandardRoomMatcher` | `server/src/modules/library/strategies/room-matcher.strategy.ts` |
| Checking faculty teaching qualifications | `FACULTY_QUALIFIER`, `StandardFacultyQualifier` | `server/src/modules/library/strategies/faculty-qualifier.strategy.ts` |
| Import spreadsheet data parsing | `CsvFileParserStrategy`, `ExcelFileParserStrategy` | `server/src/modules/library/strategies/file-parser.strategy.ts` |
| Blueprint node completeness checks | `CompletionService`, `CompletionRuleStrategy` | `server/src/modules/blueprint/services/completion.service.ts` |
| Concrete node completion rules | `InstitutionCompletionRule`, `SectionCompletionRule` | `server/src/modules/blueprint/model/rules/blueprint-completion.rules.ts` |
| Sequential graph mutation gates | `GateChain` | `server/src/modules/blueprint/gates/gate-chain.ts` |
| Batch topological graph mutations | `OperationService` | `server/src/modules/blueprint/services/operation.service.ts` |
| Downstream deletion ripple impact | `ImpactAnalyzerService` | `server/src/modules/blueprint/services/impact-analyzer.service.ts` |
| Hierarchical constraint inheritance | `ConstraintResolverService` | `server/src/modules/blueprint/services/constraint-resolver.service.ts` |
| Timetable schedule validation | `ValidationService` | `packages/engine/src/validation.service.ts` |
| Constraint registry for engine | `ConstraintRegistry` | `packages/engine/src/constraint.registry.ts` |
| Conflict resolution suggestion rules | `SuggestionStrategy` | `packages/engine/src/suggestion.strategy.ts` |
| Timetable solver build orchestration | `BuildFacade` | `server/src/modules/builds/services/build.facade.ts` |
| Typed client HTTP API client | `apiClient` | `client/src/lib/api-client.ts` |
| Toast feedback notifications | `toast` | `client/src/components/ui/toast.tsx` |
| Destructive action confirmation | `ConfirmDialog` | `client/src/components/ui/confirm-dialog.tsx` |
| Loading placeholder skeletons | `Skeleton` | `client/src/components/ui/skeleton.tsx` |
| Weekly period availability grid | `AvailabilityGrid` | `client/src/features/library/components/availability-grid.tsx` |
| Faculty teaching workload bar | `WorkloadBar` | `client/src/features/library/components/workload-bar.tsx` |
| Timetable schedule conflict summary | `ConflictCard` | `client/src/features/blueprint/components/validation/conflict-card.tsx` |
| Blueprint visual canvas state | `useBlueprintStore` | `client/src/features/blueprint/store/blueprint.store.ts` |
| Blueprint real-time WebSocket sync | `useBlueprintSocket` | `client/src/features/blueprint/hooks/use-blueprint-socket.ts` |
| Blueprint undo / redo commands | `useBlueprintCommands` | `client/src/features/blueprint/hooks/use-blueprint-commands.ts` |
| Automatic Dagre graph auto-layout | `useBlueprintLayout` | `client/src/features/blueprint/hooks/use-blueprint-layout.ts` |
| Real-time build progress socket | `BuildsSocketService` | `client/src/features/builds/services/builds-socket.service.ts` |
| Namespaced environment configuration | `AppConfigModule`, `appConfig` | `server/src/config/index.ts` |

## Extension Points
| Registry / Strategy family | Where it lives | Interface to implement | Test to copy |
| :--- | :--- | :--- | :--- |
| Node Types | `server/src/modules/blueprint/model/node-type.registry.ts` | `NodeTypeDefinition` | `server/src/modules/blueprint/tests/completion-rules.spec.ts` |
| Node Completion Rules | `server/src/modules/blueprint/model/rules/blueprint-completion.rules.ts` | `CompletionRuleStrategy` | `server/src/modules/blueprint/tests/completion-rules.spec.ts` |
| Blueprint Creation Gates | `server/src/modules/blueprint/gates/blueprint-gates.ts` | `IGate` | `server/src/modules/blueprint/tests/gates.spec.ts` |
| Scheduling Constraints | `packages/engine/src/constraints/` | `IConstraint` | `server/src/modules/engine/tests/constraints-hard.spec.ts` |
| Blueprint Recommenders | `server/src/modules/blueprint/services/recommendations.service.ts` | `IRecommenderStrategy` | `server/src/modules/blueprint/tests/gates.spec.ts` |
| File Parsers | `server/src/modules/library/strategies/file-parser.strategy.ts` | `IFileParser` | `server/src/modules/library/tests/file-parser.spec.ts` |
| Room Matchers | `server/src/modules/library/strategies/room-matcher.strategy.ts` | `IRoomMatcher` | `server/src/modules/library/tests/room-matcher.spec.ts` |
| Faculty Qualifiers | `server/src/modules/library/strategies/faculty-qualifier.strategy.ts` | `IFacultyQualifier` | `server/src/modules/library/tests/faculty-qualifier.spec.ts` |
| Configuration Namespaces | `server/src/config/` | `validateEnv` | `server/src/config/tests/config-factories.spec.ts` |
=======

| Task in plain words                      | Thing to use                                         | File path                                                                |
| :--------------------------------------- | :--------------------------------------------------- | :----------------------------------------------------------------------- |
| Cache reads with TTL & tags              | `CacheService`                                       | `server/src/common/cache/cache.interface.ts`                             |
| Concrete Redis cache & tags              | `RedisCacheService`                                  | `server/src/common/cache/redis-cache.service.ts`                         |
| Generic MongoDB CRUD repository          | `MongoBaseRepository`                                | `server/src/common/database/mongo-base.repository.ts`                    |
| Cache-aside repository decorator         | `CachedRepository`                                   | `server/src/common/database/cached.repository.ts`                        |
| Multi-document DB transactions           | `TransactionHelper`                                  | `server/src/common/database/transaction.helper.ts`                       |
| Asynchronous non-critical writes         | `WriteBehindService`                                 | `server/src/common/queue/write-behind.service.ts`                        |
| Structural audit logging                 | `AuditService`                                       | `server/src/common/audit/audit.service.ts`                               |
| Domain event publish / subscribe         | `EventBus`                                           | `server/src/common/events/event-bus.service.ts`                          |
| Optimistic concurrency revision check    | `RevisionHelper`, `RevisionConflictException`        | `server/src/common/concurrency/revision.helper.ts`                       |
| Controller request Zod validation        | `ZodValidationPipe`                                  | `server/src/common/pipes/zod-validation.pipe.ts`                         |
| Server route permission guards           | `RequirePermissions`, `PermissionsGuard`             | `server/src/common/rbac/permissions.guard.ts`                            |
| Client permission checking hook          | `usePermission`                                      | `client/src/features/auth/hooks/use-permission.ts`                       |
| Conditional JSX by permission            | `Can`                                                | `client/src/features/auth/components/can.tsx`                            |
| Server step-up auth challenge guard      | `StepUpGuard`                                        | `server/src/modules/auth/guards/step-up.guard.ts`                        |
| Client step-up password modal            | `StepUpDialog`                                       | `client/src/features/auth/components/step-up-dialog.tsx`                 |
| Redis sliding-window rate limiting       | `RedisThrottlerService`                              | `server/src/modules/auth/services/throttler.service.ts`                  |
| Matching rooms for subject criteria      | `ROOM_MATCHER`, `StandardRoomMatcher`                | `server/src/modules/library/strategies/room-matcher.strategy.ts`         |
| Checking faculty teaching qualifications | `FACULTY_QUALIFIER`, `StandardFacultyQualifier`      | `server/src/modules/library/strategies/faculty-qualifier.strategy.ts`    |
| Import spreadsheet data parsing          | `CsvFileParserStrategy`, `ExcelFileParserStrategy`   | `server/src/modules/library/strategies/file-parser.strategy.ts`          |
| Blueprint node completeness checks       | `CompletionService`, `CompletionRuleStrategy`        | `server/src/modules/blueprint/services/completion.service.ts`            |
| Concrete node completion rules           | `InstitutionCompletionRule`, `SectionCompletionRule` | `server/src/modules/blueprint/model/rules/blueprint-completion.rules.ts` |
| Sequential graph mutation gates          | `GateChain`                                          | `server/src/modules/blueprint/gates/gate-chain.ts`                       |
| Batch topological graph mutations        | `OperationService`                                   | `server/src/modules/blueprint/services/operation.service.ts`             |
| Downstream deletion ripple impact        | `ImpactAnalyzerService`                              | `server/src/modules/blueprint/services/impact-analyzer.service.ts`       |
| Hierarchical constraint inheritance      | `ConstraintResolverService`                          | `server/src/modules/blueprint/services/constraint-resolver.service.ts`   |
| Timetable schedule validation            | `ValidationService`                                  | `server/src/modules/engine/core/validation.service.ts`                   |
| Constraint registry for engine           | `ConstraintRegistry`                                 | `server/src/modules/engine/core/constraint.registry.ts`                  |
| Conflict resolution suggestion rules     | `SuggestionStrategy`                                 | `server/src/modules/engine/core/suggestion.strategy.ts`                  |
| Timetable solver build orchestration     | `BuildFacade`                                        | `server/src/modules/builds/services/build.facade.ts`                     |
| Typed client HTTP API client             | `apiClient`                                          | `client/src/lib/api-client.ts`                                           |
| Toast feedback notifications             | `toast`                                              | `client/src/components/ui/toast.tsx`                                     |
| Destructive action confirmation          | `ConfirmDialog`                                      | `client/src/components/ui/confirm-dialog.tsx`                            |
| Loading placeholder skeletons            | `Skeleton`                                           | `client/src/components/ui/skeleton.tsx`                                  |
| Weekly period availability grid          | `AvailabilityGrid`                                   | `client/src/features/library/components/availability-grid.tsx`           |
| Faculty teaching workload bar            | `WorkloadBar`                                        | `client/src/features/library/components/workload-bar.tsx`                |
| Timetable schedule conflict summary      | `ConflictCard`                                       | `client/src/features/blueprint/components/validation/conflict-card.tsx`  |
| Blueprint visual canvas state            | `useBlueprintStore`                                  | `client/src/features/blueprint/store/blueprint.store.ts`                 |
| Blueprint real-time WebSocket sync       | `useBlueprintSocket`                                 | `client/src/features/blueprint/hooks/use-blueprint-socket.ts`            |
| Blueprint undo / redo commands           | `useBlueprintCommands`                               | `client/src/features/blueprint/hooks/use-blueprint-commands.ts`          |
| Automatic Dagre graph auto-layout        | `useBlueprintLayout`                                 | `client/src/features/blueprint/hooks/use-blueprint-layout.ts`            |
| Real-time build progress socket          | `BuildsSocketService`                                | `client/src/features/builds/services/builds-socket.service.ts`           |

## Extension Points

| Registry / Strategy family | Where it lives                                                           | Interface to implement   | Test to copy                                                  |
| :------------------------- | :----------------------------------------------------------------------- | :----------------------- | :------------------------------------------------------------ |
| Node Types                 | `server/src/modules/blueprint/model/node-type.registry.ts`               | `NodeTypeDefinition`     | `server/src/modules/blueprint/tests/completion-rules.spec.ts` |
| Node Completion Rules      | `server/src/modules/blueprint/model/rules/blueprint-completion.rules.ts` | `CompletionRuleStrategy` | `server/src/modules/blueprint/tests/completion-rules.spec.ts` |
| Blueprint Creation Gates   | `server/src/modules/blueprint/gates/blueprint-gates.ts`                  | `IGate`                  | `server/src/modules/blueprint/tests/gates.spec.ts`            |
| Scheduling Constraints     | `packages/engine/src/constraints/`                            | `IConstraint`            | `server/src/modules/engine/tests/constraints-hard.spec.ts`    |
| Blueprint Recommenders     | `server/src/modules/blueprint/services/recommendations.service.ts`       | `IRecommenderStrategy`   | `server/src/modules/blueprint/tests/gates.spec.ts`            |
| File Parsers               | `server/src/modules/library/strategies/file-parser.strategy.ts`          | `IFileParser`            | `server/src/modules/library/tests/file-parser.spec.ts`        |
| Room Matchers              | `server/src/modules/library/strategies/room-matcher.strategy.ts`         | `IRoomMatcher`           | `server/src/modules/library/tests/room-matcher.spec.ts`       |
| Faculty Qualifiers         | `server/src/modules/library/strategies/faculty-qualifier.strategy.ts`    | `IFacultyQualifier`      | `server/src/modules/library/tests/faculty-qualifier.spec.ts`  |
>>>>>>> feat/protected-routes-and-refresh

## Conventions

- **File Names:** Kebab-case matching entity or role (for example `faculty.repository.ts`, `use-library-filters.ts`).
- **Dependency Injection:** Inject interfaces through symbol tokens (`CACHE_SERVICE`, `ROOM_MATCHER`, `EVENT_BUS`).
- **Cache Keys & Tags:** Cache keys use format `slotly:{entity}:{id}[:part]`; invalidate with tags (e.g. `library:{institutionId}`).
- **Write-Behind Coalescing:** BullMQ job IDs for non-critical writes use `${entity}:${id}` to merge rapid updates.
- **Client Architecture:** Logic in custom hooks, API calls in `services/`, feature state in Zustand stores, no raw `fetch` in components.
- **Design Tokens:** Strict monochrome (`#000`, `#0A0A0A`, `#111`, `#232323`, `#FAFAFA`, `#8A8A8A`) with accent yellow `#FACC15` for primary actions.

## Gotchas

1. **Access Tokens in Memory:** Access tokens are stored purely in memory and never written to localStorage or cookies.
2. **Write-Behind Consistency Barrier:** Before solver execution, `flushOrAwaitPendingWrites` must drain pending BullMQ jobs.
3. **Exact Optional Properties:** With `exactOptionalPropertyTypes: true`, omit keys rather than passing `{ field: undefined }`.
4. **React 19 Render-Phase State Sync:** Never invoke `setState` directly inside a `useEffect` to sync props/URL; adjust state during render.
5. **MongoDB Transactions:** Multi-document ACID transactions require MongoDB replica sets; dev standalone clusters use direct commits.
6. **Optimistic Revision Check:** Blueprint and schedule writes require a revision counter; stale writes return HTTP 409 conflict.
<<<<<<< HEAD
7. **Environment Variables:** Never access `process.env` directly outside `server/src/config/` and `server/src/main.ts`. Inject `@Inject(thatConfig.KEY) config: ConfigType<typeof thatConfig>` or use `ConfigModule.forFeature(thatConfig)`. Run `pnpm env:migrate` to update legacy `.env` files.
=======

>>>>>>> feat/protected-routes-and-refresh
<!-- MANUAL:END -->

## Generated Module Maps

<!-- GENERATED:START -->
| Module Map | Area | Line count |
| :--- | :--- | :--- |
| [contracts.md](docs/codemap/contracts.md) | Shared Contracts | 603 lines |
| [server-common.md](docs/codemap/server-common.md) | Server Common & Infrastructure | 449 lines |
| [server-auth.md](docs/codemap/server-auth.md) | Server Auth Module | 218 lines |
| [server-blueprint.md](docs/codemap/server-blueprint.md) | Server Blueprint Module | 267 lines |
| [server-builds.md](docs/codemap/server-builds.md) | Server Builds Module | 62 lines |
| [server-engine.md](docs/codemap/server-engine.md) | Engine Module & Library | 256 lines |
| [server-institutions.md](docs/codemap/server-institutions.md) | Server Institutions Module | 163 lines |
| [server-library.md](docs/codemap/server-library.md) | Server Library Module | 142 lines |
| [client-app.md](docs/codemap/client-app.md) | Client App Routes | 481 lines |
| [client-auth.md](docs/codemap/client-auth.md) | Client Auth Feature | 100 lines |
| [client-blueprint.md](docs/codemap/client-blueprint.md) | Client Blueprint Feature | 423 lines |
| [client-builds.md](docs/codemap/client-builds.md) | Client Builds Feature | 84 lines |
| [client-institution.md](docs/codemap/client-institution.md) | Client Institution Feature | 175 lines |
| [client-library.md](docs/codemap/client-library.md) | Client Library Feature | 176 lines |
| [client-projects.md](docs/codemap/client-projects.md) | Client Projects Feature | 146 lines |
| [client-shared.md](docs/codemap/client-shared.md) | Client Shared Components & Lib | 318 lines |
<!-- GENERATED:END -->
