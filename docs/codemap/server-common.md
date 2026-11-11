# Server Common & Infrastructure Code Map

### `server/src/app.controller.ts`
*HTTP controller handling app.controller endpoints.*

- **Controller** `AppController` (base: `/`) - Controller handling app controller HTTP endpoints.
  - `GET /` -> `getHello()`
  - `GET /health` -> `getHealth()`

### `server/src/app.module.ts`
*Core implementation for app.module in Projects/slotly/server/src.*

- **Class** `AppModule` implements `NestModule` - Class implementing app module.

### `server/src/app.service.ts`
*Domain service orchestrating app.service business logic.*

- **Injectable** `AppService` - Injectable service providing app service logic.

### `server/src/common/audit/audit-log.schema.ts`
*Data schema and persistence model for audit-log.schema.*

- **Mongoose Schema** `AuditLog` (collection: `audit_logs` (indexes: action, actorId, targetType, targetId, timestamp)) - Class implementing audit log.
- **Type** `AuditLogDocument` - Type alias for audit log document.
- **Zod Schema** `AuditLogSchema` -> `AuditLog` - Zod schema validating audit log.

### `server/src/common/audit/audit.module.ts`
*Core implementation for audit.module in server/src/common/audit.*

- **Class** `AuditModule` - Class implementing audit module.

### `server/src/common/audit/audit.processor.ts`
*Queue processor handling background jobs for audit.processor.*

- **Queue Processor** `AuditProcessor` (queue: `audit`) - BullMQ queue processor for audit processor jobs.
  - `audit: *` -> `AuditProcessor.process()`

### `server/src/common/audit/audit.service.ts`
*Domain service orchestrating audit logging, querying, and user security events.*

- **Injectable** `AuditService` (deps: ConnectionOptions> | undefined, ObjectId; }> & { __v: number; }> | undefined) - Injectable service providing audit service logic.
- **Interface** `AuditPayload` - Interface defining structure for audit payload.

### `server/src/common/cache/base/base-cache-list.ts`
*Base list cache implementation supporting atomic updates, single-flight loading, and corruption resilience.*

- **Class** `BaseCacheList` implements `IListCache<T>` - Base cache class managing list-based collections.

### `server/src/common/cache/base/base-cache-object.ts`
*Base object cache implementation supporting partial field updates, date revival, and single-flight loading.*

- **Class** `BaseCacheObject` - Base cache class managing structured object storage with corruption resilience.

### `server/src/common/cache/base/base.cache.ts`
*Abstract base cache class providing key construction, TTL jitter, and unified error handling.*

- **Class** `BaseCache` - Abstract base cache class providing key construction, TTL jitter, and unified error handling.

### `server/src/common/cache/base/cache-repository.ts`
*Abstract entity cache-aside repository with negative caching, size capping, and single-flight protection.*

- **Class** `CacheRepository` implements `ICacheReader<T, TId>, ICacheWriter<T, TId>` - Abstract entity cache-aside repository with negative caching, size capping, and single-flight protection.

### `server/src/common/cache/base/index.ts`
*Public exports for base cache classes.*

*(No public exports)*

### `server/src/common/cache/cache.interface.ts`
*Core implementation for cache.interface in server/src/common/cache.*

- **Interface** `CacheService` - Interface defining structure for cache service.
- **Const** `CACHE_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing cache service.

### `server/src/common/cache/cache.module.ts`
*Core implementation for cache.module in server/src/common/cache.*

- **Class** `CacheModule` - Global cache module exporting CacheService, Redis client, serializers, factories, and metrics.

### `server/src/common/cache/factories/cache-key.factory.ts`
*Factory creating standardized cache key prefixes, tenant-scoped keys, and namespace counters.*

- **Injectable** `CacheKeyFactory` implements `ICacheKeyFactory` (deps: @Inject(cacheConfig.KEY)) - Factory generating scoped keys and versioned namespace keys.

### `server/src/common/cache/in-memory-cache.service.ts`
*Domain service orchestrating in-memory-cache.service business logic.*

- **Injectable** `InMemoryCacheService` implements `CacheService` - Injectable service providing in memory cache service logic.

### `server/src/common/cache/index.ts`
*Public exports for server cache module, interfaces, base classes, and serializers.*

*(No public exports)*

### `server/src/common/cache/interfaces/cache-key-factory.interface.ts`
*Interface defining standard key generation and namespace versioning strategy.*

- **Interface** `ICacheKeyFactory` - Interface defining standard key generation and namespace versioning strategy.

### `server/src/common/cache/interfaces/cache-metrics.interface.ts`
*Interface defining telemetry and metrics tracking for cache hits, misses, and errors.*

- **Interface** `ICacheMetrics` - Interface defining telemetry and metrics tracking for cache hits, misses, and errors.

### `server/src/common/cache/interfaces/cache-reader.interface.ts`
*Interface defining contract for cache reading and cache-aside loading.*

- **Interface** `ICacheReader` - Interface defining contract for cache reading and cache-aside loading.

### `server/src/common/cache/interfaces/cache-serializer.interface.ts`
*Interface defining serialization strategy for cached values and reviving dates.*

- **Interface** `ICacheSerializer` - Interface defining serialization strategy for cached values and reviving dates.

### `server/src/common/cache/interfaces/cache-writer.interface.ts`
*Interface defining contract for cache writing, updating, and invalidation.*

- **Interface** `ICacheWriter` - Interface defining contract for cache writing, updating, and invalidation.

### `server/src/common/cache/interfaces/index.ts`
*Public exports for cache interfaces and injection tokens.*

*(No public exports)*

### `server/src/common/cache/interfaces/list-cache.interface.ts`
*Interface defining contract for managing list-based cached collections.*

- **Interface** `IListCache` - Interface defining contract for managing list-based cached collections.

### `server/src/common/cache/interfaces/tokens.ts`
*Injection tokens for cache layer infrastructure and swappable strategies.*

- **Const** `REDIS_CLIENT`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Injection token for Redis client instance.
- **Const** `CACHE_SERIALIZER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Injection token for cache serializer implementation.
- **Const** `CACHE_METRICS`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Injection token for cache metrics reporter.
- **Const** `CACHE_KEY_FACTORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Injection token for cache key and namespace builder factory.

### `server/src/common/cache/metrics/cache-metrics.service.ts`
*Telemetry service recording hit, miss, negative-hit, error, and write-behind metrics.*

- **Injectable** `CacheMetricsService` implements `ICacheMetrics` (deps: PrometheusMetricsService | undefined) - In-memory and Prometheus telemetry service tracking cache efficiency and errors.

### `server/src/common/cache/redis-cache.service.ts`
*Domain service orchestrating redis-cache.service business logic.*

- **Injectable** `RedisCacheService` implements `CacheService, OnModuleDestroy` (deps: @Inject(redisConfig.KEY), @Inject(cacheConfig.KEY)) - Injectable service providing redis cache service logic.

### `server/src/common/cache/serializers/json-cache.serializer.ts`
*JSON serializer implementation reviving Date objects and rejecting invalid types.*

- **Class** `DeserializationException` - Custom exception thrown when cache data cannot be deserialized cleanly.
- **Injectable** `JsonCacheSerializer` implements `ICacheSerializer` - JSON serializer reviving ISO timestamp strings to Date instances.

### `server/src/common/concurrency/revision.helper.ts`
*Core implementation for revision.helper in server/src/common/concurrency.*

- **Class** `RevisionConflictException` - Class implementing revision conflict exception.
- **Class** `RevisionHelper` - Class implementing revision helper.

### `server/src/common/database/base.repository.ts`
*Database repository managing base.repository persistence.*

- **Interface** `BaseRepository` - Interface defining structure for base repository.

### `server/src/common/database/cached.repository.ts`
*Database repository managing cached.repository persistence.*

- **Class** `CachedRepository` implements `BaseRepository<T>` - Class implementing cached repository.

### `server/src/common/database/database.module.ts`
*Core implementation for database.module in server/src/common/database.*

- **Class** `DatabaseModule` - Database module exporting TransactionHelper.

### `server/src/common/database/mongo-base.repository.ts`
*Database repository managing mongo-base.repository persistence.*

- **Class** `MongoBaseRepository` implements `BaseRepository<T>` - Class implementing mongo base repository.

### `server/src/common/database/transaction.helper.ts`
*Core implementation for transaction.helper in server/src/common/database.*

- **Injectable** `TransactionHelper` (deps: Connection) - Injectable service providing transaction helper logic.

### `server/src/common/email/brevo-email.sender.ts`
*Core implementation for brevo-email.sender in server/src/common/email.*

- **Injectable** `BrevoEmailSender` implements `IEmailSender` (deps: EmailTemplateRenderer, @Inject(emailConfig.KEY), @Inject(BREVO_CONFIG)) - Injectable service providing brevo email sender logic.
- **Interface** `BrevoConfig` - Interface defining structure for brevo config.
- **Const** `BREVO_CONFIG`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing brevo config.

### `server/src/common/email/email-template.renderer.ts`
*Core implementation for email-template.renderer in server/src/common/email.*

- **Injectable** `EmailTemplateRenderer` (deps: @Inject(appConfig.KEY)) - Injectable service providing email template renderer logic.
- **Interface** `RenderedEmail` - Interface defining structure for rendered email.

### `server/src/common/email/email.interface.ts`
*Core implementation for email.interface in server/src/common/email.*

- **Interface** `EmailRecipient` - Interface defining structure for email recipient.
- **Interface** `EmailMessage` - Interface defining structure for email message.
- **Interface** `EmailSendResult` - Interface defining structure for email send result.
- **Interface** `IEmailSender` - Interface defining structure for email sender.
- **Const** `EMAIL_SENDER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing email sender.
- **Const** `NOTIFICATIONS_QUEUE`: `"notifications"` - Constant representing notifications queue.

### `server/src/common/email/email.module.ts`
*Core implementation for email.module in server/src/common/email.*

- **Class** `EmailModule` - Class implementing email module.

### `server/src/common/email/email.processor.ts`
*Queue processor handling background jobs for email.processor.*

- **Queue Processor** `EmailProcessor` (queue: `NOTIFICATIONS_QUEUE`) - BullMQ queue processor for email processor jobs.
  - `NOTIFICATIONS_QUEUE: *` -> `EmailProcessor.process()`

### `server/src/common/email/email.service.ts`
*Domain service orchestrating email.service business logic.*

- **Injectable** `EmailService` (deps: @Inject(EMAIL_SENDER), ConnectionOptions> | undefined) - Injectable service providing email service logic.

### `server/src/common/email/index.ts`
*Core implementation for index in server/src/common/email.*

*(No public exports)*

### `server/src/common/email/log-email.sender.ts`
*Log-based email sender implementation for development and testing environments.*

- **Injectable** `LogEmailSender` implements `IEmailSender` - Injectable email sender logging sanitized email messages without secrets.

### `server/src/common/events/event-bus.service.ts`
*Domain service orchestrating event-bus.service business logic.*

- **Injectable** `EventBus` - Injectable service providing event bus logic.
- **Type** `EventHandler` - Type alias for event handler.

### `server/src/common/events/events.module.ts`
*Core implementation for events.module in server/src/common/events.*

- **Class** `EventsModule` - Class implementing events module.

### `server/src/common/events/index.ts`
*Core implementation for index in server/src/common/events.*

*(No public exports)*

### `server/src/common/filters/global-exception.filter.ts`
*Core implementation for global-exception.filter in server/src/common/filters.*

- **Class** `GlobalExceptionFilter` implements `ExceptionFilter` - Class implementing global exception filter.

### `server/src/common/interceptors/logging.interceptor.ts`
*Core implementation for logging.interceptor in server/src/common/interceptors.*

- **Injectable** `LoggingInterceptor` implements `NestInterceptor` - Injectable service providing logging interceptor logic.

### `server/src/common/middleware/request-id.middleware.ts`
*Core implementation for request-id.middleware in server/src/common/middleware.*

- **Injectable** `RequestIdMiddleware` implements `NestMiddleware` - Injectable service providing request id middleware logic.
- **Interface** `RequestWithId` extends `Request` - Interface defining structure for request with id.

### `server/src/common/monitoring/metrics.interceptor.ts`
*Core implementation for metrics.interceptor in server/src/common/monitoring.*

- **Injectable** `MetricsService` - Injectable service providing metrics service logic.
- **Injectable** `MetricsInterceptor` implements `NestInterceptor` (deps: MetricsService) - Injectable service providing metrics interceptor logic.
- **Interface** `RouteMetrics` - Interface defining structure for route metrics.

### `server/src/common/pipes/zod-validation.pipe.ts`
*Core implementation for zod-validation.pipe in server/src/common/pipes.*

- **Injectable** `ZodValidationPipe` implements `PipeTransform` (deps: ZodTypeDef, any> | undefined) - Injectable service providing zod validation pipe logic.

### `server/src/common/queue/queue.module.ts`
*Core implementation for queue.module in server/src/common/queue.*

- **Class** `AppQueueModule` - Class implementing app queue module.

### `server/src/common/queue/write-behind.service.ts`
*Domain service orchestrating write-behind.service business logic.*

- **Injectable** `WriteBehindService` implements `OnModuleDestroy` (deps: @Inject(CACHE_SERVICE), ConnectionOptions> | undefined) - Injectable service providing write behind service logic.
- **Interface** `WriteBehindJob` - Interface defining structure for write behind job.
- **Const** `WRITE_BEHIND_QUEUE`: `"write-behind"` - Constant representing write behind queue.

### `server/src/common/queue/write-behind/index.ts`
*Public exports for write-behind queue publisher, processor, and defaults.*

*(No public exports)*

### `server/src/common/queue/write-behind/write-behind.defaults.ts`
*Default retry, backoff, and dead-letter retention policies for write-behind jobs.*

- **Const** `WRITE_BEHIND_JOB_DEFAULTS`: `{ attempts: number; backoff: { type: "exponenti...` - Standard defaults for BullMQ write-behind job options.

### `server/src/common/queue/write-behind/write-behind.processor.ts`
*Abstract BullMQ worker processor for write-behind jobs with revision checking, audit logging, and event dispatch.*

- **Class** `WriteBehindProcessor` - Abstract queue processor dispatching write-behind jobs by name and maintaining audit and event states.

### `server/src/common/queue/write-behind/write-behind.publisher.ts`
*Abstract publisher for write-behind persistence jobs with durable cache write and rollback contract.*

- **Class** `WriteBehindPublisher` - Abstract write-behind publisher enforcing durable enqueue-or-fail cache rollback contracts.

### `server/src/common/queue/write-behind/write-behind.types.ts`
*Type definitions for write-behind persistence payloads and statuses.*

- **Interface** `WriteBehindJobPayload` - Interface defining structure for typed write-behind job data.
- **Type** `PersistenceStatus` - Persistence lifecycle status for write-behind updates.

### `server/src/common/rbac/access-policy.interface.ts`
*Core implementation for access-policy.interface in server/src/common/rbac.*

- **Interface** `AccessSubject` - Interface defining structure for access subject.
- **Interface** `AccessResource` - Interface defining structure for access resource.
- **Interface** `AccessPolicy` - Interface defining structure for access policy.
- **Const** `ACCESS_POLICY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing access policy.

### `server/src/common/rbac/permissions.guard.ts`
*Route guard controlling access for permissions.guard.*

- **Injectable** `StandardAccessPolicy` implements `AccessPolicy` - Injectable service providing standard access policy logic.
- **Injectable** `PermissionsGuard` implements `CanActivate` (deps: Reflector, @Inject(ACCESS_POLICY)) - Injectable service providing permissions guard logic.
- **Interface** `RequestWithSubject` - Interface defining structure for request with subject.

### `server/src/common/rbac/roles.decorator.ts`
*Core implementation for roles.decorator in server/src/common/rbac.*

- **Const** `ROLES_KEY`: `"roles"` - Constant representing roles key.
- **Component** `Roles(roles: ("SUPER_ADMIN" | "ADMIN" | "DESIGNER" | "FACULTY" | "STUDENT")[])` - React component rendering roles.
- **Const** `PERMISSIONS_KEY`: `"permissions"` - Constant representing permissions key.
- **Component** `RequirePermissions(permissions: ("INSTITUTION_READ" | "INSTITUTION_MANAGE" | "DEPARTMENT_READ" | "DEPARTMENT_MANAGE" | "STRUCTURE_READ" | "STRUCTURE_MANAGE" | "FACULTY_READ" | "FACULTY_MANAGE" | "ROOM_READ" | "ROOM_MANAGE" | "SUBJECT_READ" | "SUBJECT_MANAGE" | "PROJECT_CREATE" | "PROJECT_READ" | "PROJECT_MANAGE" | "PROJECT_DELETE" | "PROJECT_ARCHIVE" | "BLUEPRINT_READ" | "BLUEPRINT_EDIT" | "BLUEPRINT_BUILD" | "BLUEPRINT_TEMPLATE_MANAGE" | "TIMETABLE_READ" | "TIMETABLE_EDIT" | "TIMETABLE_APPROVE" | "TIMETABLE_PUBLISH" | "TIMETABLE_EXPORT" | "USER_MANAGE" | "AUDIT_READ" | "TIMETABLE_SHARE" | "ANNOUNCEMENT_CREATE" | "ANALYTICS_READ" | "FEEDBACK_SUBMIT" | "FEEDBACK_MANAGE" | "SYSTEM_MONITOR")[])` - React component rendering require permissions.

### `server/src/common/rbac/roles.guard.ts`
*Route guard controlling access for roles.guard.*

- **Injectable** `RolesGuard` implements `CanActivate` (deps: Reflector) - Injectable service providing roles guard logic.
- **Interface** `AuthenticatedUser` - Interface defining structure for authenticated user.

### `server/src/config/app.config.ts`
*Configuration factory for application-level settings.*

- **Type** `AppConfig` - Inferred TypeScript type for app namespace configuration.
- **Const** `appConfig`: `(() => { port: number; nodeEnv: "development" |...` - Application namespace configuration factory.

### `server/src/config/auth.config.ts`
*Configuration factory for authentication policies, throttling, OTP, and Argon2 parameters.*

- **Type** `AuthConfig` - Inferred TypeScript type for auth namespace configuration.
- **Const** `authConfig`: `(() => { nodeEnv: "development" | "production" ...` - Authentication namespace configuration factory.

### `server/src/config/blueprint.config.ts`
*Configuration factory for Blueprint v2 feature flags and behavior.*

- **Type** `BlueprintConfig` - Inferred TypeScript type for blueprint namespace configuration.
- **Const** `blueprintConfig`: `(() => { v2Enabled: boolean; }) & import("E:/Sh...` - Blueprint namespace configuration factory.

### `server/src/config/cache.config.ts`
*Configuration factory for cache TTLs, eviction policies, and size thresholds.*

- **Type** `CacheConfig` - Inferred TypeScript type for cache namespace configuration.
- **Const** `cacheConfig`: `(() => { defaultTtl: number; negativeTtl: numbe...` - Cache namespace configuration factory.

### `server/src/config/config.module.ts`
*Core configuration module wrapping NestJS ConfigModule with all namespaces and validation schema.*

- **Class** `AppConfigModule` - Global application configuration module wrapping NestJS ConfigModule.

### `server/src/config/database.config.ts`
*Configuration factory for MongoDB database settings. Transactions require a replica set (e.g. rs0).*

- **Type** `DatabaseConfig` - Inferred TypeScript type for database namespace configuration.
- **Const** `databaseConfig`: `(() => { uri: string; options: { serverSelectio...` - Database namespace configuration factory. Note: Transactions require MongoDB replica set.

### `server/src/config/defaults.ts`
*Central default configuration constants used across Joi validation and config factories.*

- **Const** `DEFAULT_CONFIG`: `{ app: { port: number; nodeEnv: "development"; ...` - Default application configuration constants.

### `server/src/config/email.config.ts`
*Configuration factory for email delivery (Brevo or Log driver).*

- **Type** `EmailConfig` - Inferred TypeScript type for email namespace configuration.
- **Const** `emailConfig`: `(() => { driver: "log" | "brevo"; apiKey: strin...` - Email namespace configuration factory. Supports 'brevo' and 'log' drivers.

### `server/src/config/env.validation.ts`
*Joi validation schema and legacy environment variable validation logic.*

- **Function** `checkLegacyVariables(env: Record<string, unknown>)`: `void` - Function checking for legacy environment variables and failing with descriptive messages.
- **Function** `validateEnv(config: Record<string, unknown>)`: `Record<string, unknown>` - Function performing validation of raw environment objects.
- **Zod Schema** `envValidationSchema` -> `envValidation` - Joi schema defining environment variable validation constraints.

### `server/src/config/groq.config.ts`
*Configuration factory for Groq AI LLM integration.*

- **Type** `GroqConfig` - Inferred TypeScript type for groq namespace configuration.
- **Const** `groqConfig`: `(() => { apiKey: string; model: string; request...` - Groq AI namespace configuration factory.

### `server/src/config/index.ts`
*Barrel export file for all configuration factories, types, modules, and validation schemas.*

*(No public exports)*

### `server/src/config/jwt.config.ts`
*Configuration factory for JWT authentication token settings.*

- **Type** `JwtConfig` - Inferred TypeScript type for jwt namespace configuration.
- **Const** `jwtConfig`: `(() => { access: { secret: string; expiresIn: s...` - JWT namespace configuration factory. Note: Password reset tokens are one-time tokens stored in Redis.

### `server/src/config/oauth.config.ts`
*Configuration factory for OAuth social login providers (Google, GitHub).*

- **Type** `OAuthConfig` - Inferred TypeScript type for oauth namespace configuration.
- **Const** `oauthConfig`: `(() => { callbackBaseUrl: string; google: { cli...` - OAuth namespace configuration factory. Providers are enabled only when both clientId and clientSecret are set.

### `server/src/config/queue.config.ts`
*Configuration factory for BullMQ job queue parameters and worker concurrency.*

- **Type** `QueueConfig` - Inferred TypeScript type for queue namespace configuration.
- **Const** `queueConfig`: `(() => { prefix: string; attempts: number; back...` - Queue namespace configuration factory.

### `server/src/config/redis.config.ts`
*Configuration factory for Redis connection settings.*

- **Type** `RedisConfig` - Inferred TypeScript type for redis namespace configuration.
- **Const** `redisConfig`: `(() => { host: string; port: number; password: ...` - Redis namespace configuration factory.

### `server/src/config/session.config.ts`
*Configuration factory for user sessions and refresh token cookie settings.*

- **Type** `SessionConfig` - Inferred TypeScript type for session namespace configuration.
- **Const** `sessionConfig`: `(() => { ttl: number; maxLifetime: number; cook...` - Session namespace configuration factory.

### `server/src/main.ts`
*Core bootstrap implementation for the Slotly backend server.*

*(No public exports)*

### `server/src/modules/projects/controllers/projects.controller.ts`
*HTTP controller handling projects.controller endpoints.*

- **Controller** `ProjectsController` (base: `/projects`) - Controller handling projects controller HTTP endpoints.
  - `POST /projects` -> `create()` [perm: 'PROJECT_CREATE']
  - `GET /projects` -> `list()` [perm: 'PROJECT_READ']
  - `GET /projects/:projectId` -> `getById()` [perm: 'PROJECT_READ']
  - `PUT /projects/:projectId/pin` -> `pin()` [perm: 'PROJECT_READ']
  - `DELETE /projects/:projectId/pin` -> `unpin()` [perm: 'PROJECT_READ']
  - `PATCH /projects/:projectId` -> `update()` [perm: 'PROJECT_MANAGE']
  - `DELETE /projects/:projectId` -> `delete()` [perm: 'PROJECT_DELETE']
  - `POST /projects/:projectId/duplicate` -> `duplicate()` [perm: 'PROJECT_CREATE']
  - `POST /projects/:projectId/archive` -> `archive()` [perm: 'PROJECT_ARCHIVE']
  - `POST /projects/:projectId/restore` -> `restore()` [perm: 'PROJECT_ARCHIVE']

### `server/src/modules/projects/lifecycle/project-state.factory.ts`
*Core implementation for project-state.factory in server/src/modules/projects/lifecycle.*

- **Class** `DraftState` implements `IProjectState` - Class implementing draft state.
- **Class** `BuildingState` implements `IProjectState` - Class implementing building state.
- **Class** `ReadyState` implements `IProjectState` - Class implementing ready state.
- **Class** `PendingApprovalState` implements `IProjectState` - Class implementing pending approval state.
- **Class** `PublishedState` implements `IProjectState` - Class implementing published state.
- **Class** `ArchivedState` implements `IProjectState` - Class implementing archived state.
- **Class** `ProjectStateFactory` - Class implementing project state factory.

### `server/src/modules/projects/lifecycle/project-state.interface.ts`
*Core implementation for project-state.interface in server/src/modules/projects/lifecycle.*

- **Interface** `IProjectState` - Interface defining structure for project state.

### `server/src/modules/projects/projects.module.ts`
*Core implementation for projects.module in server/src/modules/projects.*

- **Class** `ProjectsModule` - Class implementing projects module.

### `server/src/modules/projects/repositories/cached-project.repository.ts`
*Database repository managing cached-project.repository persistence.*

- **Injectable** `CachedProjectRepository` implements `IProjectRepository` (deps: MongoProjectRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached project repository logic.

### `server/src/modules/projects/repositories/mongo-project.repository.ts`
*Database repository managing mongo-project.repository persistence.*

- **Injectable** `MongoProjectRepository` implements `IProjectRepository` (deps: ObjectId; }> & { __v: number; }>, ObjectId; }> & { __v: number; }>) - Injectable service providing mongo project repository logic.

### `server/src/modules/projects/repositories/project.repository.interface.ts`
*Database repository managing project.repository.interface persistence.*

- **Interface** `FindProjectsFilter` - Interface defining structure for find projects filter.
- **Interface** `IProjectRepository` extends `BaseRepository<Project>` - Interface defining structure for project repository.

### `server/src/modules/projects/schemas/project-pin.schema.ts`
*Data schema and persistence model for user pinned projects.*

- **Mongoose Schema** `ProjectPin` (collection: `project_pins` (indexes: userId, projectId)) - Class representing a user-pinned project entry.
- **Type** `ProjectPinDocument` - Type alias for ProjectPin document.
- **Zod Schema** `ProjectPinSchema` -> `ProjectPin` - Mongoose schema validating project pin entries.

### `server/src/modules/projects/schemas/project.schema.ts`
*Data schema and persistence model for project.schema.*

- **Mongoose Schema** `Project` (collection: `projects` (indexes: institutionId, ownerId, status)) - Class implementing project.
- **Type** `ProjectDocument` - Type alias for project document.
- **Zod Schema** `ProjectSchema` -> `Project` - Zod schema validating project.

### `server/src/modules/projects/services/projects.service.ts`
*Domain service orchestrating projects.service business logic.*

- **Injectable** `ProjectsService` (deps: CachedProjectRepository, CachedBlueprintRepository, TemplateService, GraphFromInstitutionBuilder, @Inject(INSTITUTIONS_SERVICE), AuditService, @Inject(INSTITUTION_REPOSITORY), @Inject(CACHE_SERVICE)) - Injectable service providing projects service logic.

### `server/src/modules/users/repositories/cached-user.repository.ts`
*Database repository managing cached-user.repository persistence.*

- **Injectable** `CachedUserRepository` implements `UserRepository` (deps: UserRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached user repository logic.

### `server/src/modules/users/repositories/user.repository.ts`
*Database repository managing user.repository persistence.*

- **Injectable** `MongoUserRepository` implements `UserRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo user repository logic.
- **Interface** `UserQueryOptions` - Query filter options for administrative user searches.
- **Interface** `UserRepository` extends `BaseRepository<User>` - Interface defining structure for user repository.
- **Const** `USER_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing user repository.

### `server/src/modules/users/schemas/user.schema.ts`
*Data schema and persistence model for user.schema.*

- **Mongoose Schema** `User` (collection: `users` (indexes: email, role, institutionId, departmentId, status)) - Class implementing user.
- **Interface** `DeviceRecord` - Interface defining structure for device record.
- **Type** `UserDocument` - Type alias for user document.
- **Zod Schema** `UserSchema` -> `User` - Zod schema validating user.

### `server/src/modules/users/users.controller.ts`
*HTTP controller handling users.controller endpoints.*

- **Controller** `UsersSecurityController` (base: `/users/me/security`) - Controller handling users security controller HTTP endpoints.
  - `GET /users/me/security` -> `getOverview()`
  - `GET /users/me/security/activity` -> `getActivity()`
  - `GET /users/me/security/devices` -> `getDevices()`
  - `DELETE /users/me/security/devices/:deviceId` -> `removeDevice()`
  - `GET /users/me/security/connections` -> `getConnections()`
  - `DELETE /users/me/security/connections/:provider` -> `unlinkConnection()` [guards: StepUpGuard]

### `server/src/modules/users/users.module.ts`
*Core implementation for users.module in server/src/modules/users.*

- **Class** `UsersModule` - Class implementing users module.

### `server/src/modules/users/users.service.ts`
*Domain service orchestrating users.service business logic.*

- **Injectable** `DefaultUsersService` implements `UsersService` (deps: @Inject(USER_REPOSITORY), @Inject(SESSIONS_SERVICE), ObjectId; }> & { __v: number; }>) - Injectable service providing default users service logic.
- **Interface** `UsersService` - Interface defining structure for users service.
- **Const** `USERS_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing users service.

