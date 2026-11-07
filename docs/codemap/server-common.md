# Server Common & Infrastructure Code Map

### `server/src/common/audit/audit-log.schema.ts`
*Data schema and persistence model for audit-log.schema.*

- **Mongoose Schema** `AuditLog` (collection: `audit_logs` (indexes: action, actorId, targetType, targetId, timestamp)) - Class implementing audit log.
- **Type** `AuditLogDocument` - Type alias for audit log document.
- **Zod Schema** `AuditLogSchema` -> `AuditLog` - Zod schema validating audit log.

### `server/src/common/audit/audit.module.ts`
*Core implementation for audit.module in server/src/common/audit.*

- **Class** `AuditModule` - Class implementing audit module.

### `server/src/common/audit/audit.service.ts`
*Domain service orchestrating audit.service business logic.*

- **Injectable** `AuditService` (deps: ConnectionOptions> | undefined, ObjectId; }> & { __v: number; }> | undefined) - Injectable service providing audit service logic.
- **Interface** `AuditPayload` - Interface defining structure for audit payload.

### `server/src/common/cache/cache.interface.ts`
*Core implementation for cache.interface in server/src/common/cache.*

- **Interface** `CacheService` - Interface defining structure for cache service.
- **Const** `CACHE_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing cache service.

### `server/src/common/cache/cache.module.ts`
*Core implementation for cache.module in server/src/common/cache.*

- **Class** `CacheModule` - Class implementing cache module.

### `server/src/common/cache/in-memory-cache.service.ts`
*Domain service orchestrating in-memory-cache.service business logic.*

- **Injectable** `InMemoryCacheService` implements `CacheService` - Injectable service providing in memory cache service logic.

### `server/src/common/cache/index.ts`
*Core implementation for index in server/src/common/cache.*

*(No public exports)*

### `server/src/common/cache/redis-cache.service.ts`
*Domain service orchestrating redis-cache.service business logic.*

- **Injectable** `RedisCacheService` implements `CacheService, OnModuleDestroy` (deps: ConfigService<Record<string | symbol, unknown>, false>) - Injectable service providing redis cache service logic.

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

### `server/src/common/database/mongo-base.repository.ts`
*Database repository managing mongo-base.repository persistence.*

- **Class** `MongoBaseRepository` implements `BaseRepository<T>` - Class implementing mongo base repository.

### `server/src/common/database/transaction.helper.ts`
*Core implementation for transaction.helper in server/src/common/database.*

- **Injectable** `TransactionHelper` (deps: Connection) - Injectable service providing transaction helper logic.

### `server/src/common/email/brevo-email.sender.ts`
*Core implementation for brevo-email.sender in server/src/common/email.*

- **Injectable** `BrevoEmailSender` implements `IEmailSender` (deps: EmailTemplateRenderer, BrevoConfig | undefined) - Injectable service providing brevo email sender logic.
- **Interface** `BrevoConfig` - Interface defining structure for brevo config.
- **Const** `BREVO_CONFIG`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing brevo config.

### `server/src/common/email/email-template.renderer.ts`
*Core implementation for email-template.renderer in server/src/common/email.*

- **Injectable** `EmailTemplateRenderer` - Injectable service providing email template renderer logic.
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
- **Component** `RequirePermissions(permissions: ("INSTITUTION_READ" | "INSTITUTION_MANAGE" | "DEPARTMENT_READ" | "DEPARTMENT_MANAGE" | "STRUCTURE_READ" | "STRUCTURE_MANAGE" | "FACULTY_READ" | "FACULTY_MANAGE" | "ROOM_READ" | "ROOM_MANAGE" | "SUBJECT_READ" | "SUBJECT_MANAGE" | "PROJECT_CREATE" | "PROJECT_READ" | "PROJECT_MANAGE" | "PROJECT_DELETE" | "PROJECT_ARCHIVE" | "BLUEPRINT_READ" | "BLUEPRINT_EDIT" | "BLUEPRINT_BUILD" | "BLUEPRINT_TEMPLATE_MANAGE" | "TIMETABLE_READ" | "TIMETABLE_EDIT" | "TIMETABLE_APPROVE" | "TIMETABLE_PUBLISH" | "TIMETABLE_EXPORT" | "USER_MANAGE" | "AUDIT_READ")[])` - React component rendering require permissions.

### `server/src/common/rbac/roles.guard.ts`
*Route guard controlling access for roles.guard.*

- **Injectable** `RolesGuard` implements `CanActivate` (deps: Reflector) - Injectable service providing roles guard logic.
- **Interface** `AuthenticatedUser` - Interface defining structure for authenticated user.

