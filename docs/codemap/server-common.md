# Server Common & Infrastructure Code Map

### `server/src/common/audit/audit-log.schema.ts`
*(no description)*

- **Mongoose Schema** `AuditLog` (collection: `audit_logs` (indexes: action, actorId, targetType, targetId, timestamp))
- **Type** `AuditLogDocument`
- **Zod Schema** `AuditLogSchema` -> `AuditLog`

### `server/src/common/audit/audit.module.ts`
*(no description)*

- **Class** `AuditModule`

### `server/src/common/audit/audit.service.ts`
*(no description)*

- **Injectable** `AuditService` (deps: ConnectionOptions> | undefined, ObjectId; }> & { __v: number; }> | undefined)
- **Interface** `AuditPayload`

### `server/src/common/cache/cache.interface.ts`
*(no description)*

- **Interface** `CacheService`
- **Const** `CACHE_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/common/cache/cache.module.ts`
*(no description)*

- **Class** `CacheModule`

### `server/src/common/cache/in-memory-cache.service.ts`
*(no description)*

- **Injectable** `InMemoryCacheService` implements `CacheService`

### `server/src/common/cache/index.ts`
*(no description)*

*(No public exports)*

### `server/src/common/cache/redis-cache.service.ts`
*(no description)*

- **Injectable** `RedisCacheService` implements `CacheService, OnModuleDestroy` (deps: ConfigService<Record<string | symbol, unknown>, false>)

### `server/src/common/concurrency/revision.helper.ts`
*(no description)*

- **Class** `RevisionConflictException`
- **Class** `RevisionHelper`

### `server/src/common/database/base.repository.ts`
*(no description)*

- **Interface** `BaseRepository`

### `server/src/common/database/cached.repository.ts`
*(no description)*

- **Class** `CachedRepository` implements `BaseRepository<T>`

### `server/src/common/database/mongo-base.repository.ts`
*(no description)*

- **Class** `MongoBaseRepository` implements `BaseRepository<T>`

### `server/src/common/database/transaction.helper.ts`
*(no description)*

- **Injectable** `TransactionHelper` (deps: Connection)

### `server/src/common/email/brevo-email.sender.ts`
*(no description)*

- **Injectable** `BrevoEmailSender` implements `IEmailSender` (deps: EmailTemplateRenderer, BrevoConfig | undefined)
- **Interface** `BrevoConfig`
- **Const** `BREVO_CONFIG`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/common/email/email-template.renderer.ts`
*(no description)*

- **Injectable** `EmailTemplateRenderer`
- **Interface** `RenderedEmail`

### `server/src/common/email/email.interface.ts`
*(no description)*

- **Interface** `EmailRecipient`
- **Interface** `EmailMessage`
- **Interface** `EmailSendResult`
- **Interface** `IEmailSender`
- **Const** `EMAIL_SENDER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`
- **Const** `NOTIFICATIONS_QUEUE`: `"notifications"`

### `server/src/common/email/email.module.ts`
*(no description)*

- **Class** `EmailModule`

### `server/src/common/email/email.processor.ts`
*(no description)*

- **Queue Processor** `EmailProcessor` (queue: `NOTIFICATIONS_QUEUE`)
  - `NOTIFICATIONS_QUEUE: *` -> `EmailProcessor.process()`

### `server/src/common/email/email.service.ts`
*(no description)*

- **Injectable** `EmailService` (deps: @Inject(EMAIL_SENDER), ConnectionOptions> | undefined)

### `server/src/common/email/index.ts`
*(no description)*

*(No public exports)*

### `server/src/common/events/event-bus.service.ts`
*(no description)*

- **Injectable** `EventBus`
- **Type** `EventHandler`

### `server/src/common/events/events.module.ts`
*(no description)*

- **Class** `EventsModule`

### `server/src/common/events/index.ts`
*(no description)*

*(No public exports)*

### `server/src/common/filters/global-exception.filter.ts`
*(no description)*

- **Class** `GlobalExceptionFilter` implements `ExceptionFilter`

### `server/src/common/interceptors/logging.interceptor.ts`
*(no description)*

- **Injectable** `LoggingInterceptor` implements `NestInterceptor`

### `server/src/common/middleware/request-id.middleware.ts`
*(no description)*

- **Injectable** `RequestIdMiddleware` implements `NestMiddleware`
- **Interface** `RequestWithId` extends `Request`

### `server/src/common/monitoring/metrics.interceptor.ts`
*(no description)*

- **Injectable** `MetricsService`
- **Injectable** `MetricsInterceptor` implements `NestInterceptor` (deps: MetricsService)
- **Interface** `RouteMetrics`

### `server/src/common/pipes/zod-validation.pipe.ts`
*(no description)*

- **Injectable** `ZodValidationPipe` implements `PipeTransform` (deps: ZodTypeDef, any> | undefined)

### `server/src/common/queue/queue.module.ts`
*(no description)*

- **Class** `AppQueueModule`

### `server/src/common/queue/write-behind.service.ts`
*(no description)*

- **Injectable** `WriteBehindService` implements `OnModuleDestroy` (deps: @Inject(CACHE_SERVICE), ConnectionOptions> | undefined)
- **Interface** `WriteBehindJob`
- **Const** `WRITE_BEHIND_QUEUE`: `"write-behind"`

### `server/src/common/rbac/access-policy.interface.ts`
*(no description)*

- **Interface** `AccessSubject`
- **Interface** `AccessResource`
- **Interface** `AccessPolicy`
- **Const** `ACCESS_POLICY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/common/rbac/permissions.guard.ts`
*(no description)*

- **Injectable** `StandardAccessPolicy` implements `AccessPolicy`
- **Injectable** `PermissionsGuard` implements `CanActivate` (deps: Reflector, @Inject(ACCESS_POLICY))
- **Interface** `RequestWithSubject`

### `server/src/common/rbac/roles.decorator.ts`
*(no description)*

- **Const** `ROLES_KEY`: `"roles"`
- **Component** `Roles(roles: ("SUPER_ADMIN" | "ADMIN" | "DESIGNER" | "FACULTY" | "STUDENT")[])`
- **Const** `PERMISSIONS_KEY`: `"permissions"`
- **Component** `RequirePermissions(permissions: ("INSTITUTION_READ" | "INSTITUTION_MANAGE" | "DEPARTMENT_READ" | "DEPARTMENT_MANAGE" | "STRUCTURE_READ" | "STRUCTURE_MANAGE" | "FACULTY_READ" | "FACULTY_MANAGE" | "ROOM_READ" | "ROOM_MANAGE" | "SUBJECT_READ" | "SUBJECT_MANAGE" | "PROJECT_CREATE" | "PROJECT_READ" | "PROJECT_MANAGE" | "PROJECT_DELETE" | "PROJECT_ARCHIVE" | "BLUEPRINT_READ" | "BLUEPRINT_EDIT" | "BLUEPRINT_BUILD" | "BLUEPRINT_TEMPLATE_MANAGE" | "TIMETABLE_READ" | "TIMETABLE_EDIT" | "TIMETABLE_APPROVE" | "TIMETABLE_PUBLISH" | "TIMETABLE_EXPORT" | "USER_MANAGE" | "AUDIT_READ")[])`

### `server/src/common/rbac/roles.guard.ts`
*(no description)*

- **Injectable** `RolesGuard` implements `CanActivate` (deps: Reflector)
- **Interface** `AuthenticatedUser`

