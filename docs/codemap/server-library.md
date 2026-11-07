# Server Library Module Code Map

### `server/src/modules/library/controllers/library.controller.ts`
*HTTP controller handling library.controller endpoints.*

- **Controller** `LibraryController` (base: `/library`) - Controller handling library controller HTTP endpoints.
  - `GET /library/faculty` -> `getFacultyList()` [perm: 'FACULTY_READ']
  - `GET /library/faculty/:id` -> `getFacultyById()` [perm: 'FACULTY_READ']
  - `POST /library/faculty` -> `createFaculty()` [perm: 'FACULTY_MANAGE']
  - `PATCH /library/faculty/:id` -> `updateFaculty()` [perm: 'FACULTY_MANAGE']
  - `PATCH /library/faculty/:id/archive` -> `archiveFaculty()` [perm: 'FACULTY_MANAGE']
  - `DELETE /library/faculty/:id` -> `deleteFaculty()` [perm: 'FACULTY_MANAGE']
  - `GET /library/faculty/:id/workload` -> `getFacultyWorkload()` [perm: 'FACULTY_READ']
  - `GET /library/subjects` -> `getSubjectList()` [perm: 'SUBJECT_READ']
  - `GET /library/subjects/:id` -> `getSubjectById()` [perm: 'SUBJECT_READ']
  - `POST /library/subjects` -> `createSubject()` [perm: 'SUBJECT_MANAGE']
  - `PATCH /library/subjects/:id` -> `updateSubject()` [perm: 'SUBJECT_MANAGE']
  - `PATCH /library/subjects/:id/archive` -> `archiveSubject()` [perm: 'SUBJECT_MANAGE']
  - `DELETE /library/subjects/:id` -> `deleteSubject()` [perm: 'SUBJECT_MANAGE']
  - `GET /library/elective-groups` -> `getElectiveGroups()` [perm: 'SUBJECT_READ']
  - `POST /library/elective-groups` -> `createElectiveGroup()` [perm: 'SUBJECT_MANAGE']
  - `PATCH /library/elective-groups/:id` -> `updateElectiveGroup()` [perm: 'SUBJECT_MANAGE']
  - `DELETE /library/elective-groups/:id` -> `deleteElectiveGroup()` [perm: 'SUBJECT_MANAGE']
  - `GET /library/rooms` -> `getRoomList()` [perm: 'ROOM_READ']
  - `GET /library/rooms/:id` -> `getRoomById()` [perm: 'ROOM_READ']
  - `POST /library/rooms` -> `createRoom()` [perm: 'ROOM_MANAGE']
  - `PATCH /library/rooms/:id` -> `updateRoom()` [perm: 'ROOM_MANAGE']
  - `PATCH /library/rooms/:id/archive` -> `archiveRoom()` [perm: 'ROOM_MANAGE']
  - `DELETE /library/rooms/:id` -> `deleteRoom()` [perm: 'ROOM_MANAGE']
  - `POST /library/match/rooms` -> `matchRooms()` [perm: 'ROOM_READ']
  - `POST /library/match/faculty` -> `qualifyFaculty()` [perm: 'FACULTY_READ']
  - `POST /library/import/:entity/preview` -> `previewImport()` [perm: 'STRUCTURE_MANAGE']
  - `POST /library/import/:entity` -> `executeImport()` [perm: 'STRUCTURE_MANAGE']
  - `GET /library/export/:entity` -> `exportLibrary()` [perm: 'TIMETABLE_EXPORT']

### `server/src/modules/library/library.module.ts`
*Core implementation for library.module in server/src/modules/library.*

- **Class** `LibraryModule` - Class implementing library module.

### `server/src/modules/library/repositories/elective-group.repository.ts`
*Database repository managing elective-group.repository persistence.*

- **Injectable** `MongoElectiveGroupRepository` implements `ElectiveGroupRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo elective group repository logic.
- **Injectable** `CachedElectiveGroupRepository` implements `ElectiveGroupRepository` (deps: MongoElectiveGroupRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached elective group repository logic.
- **Interface** `ElectiveGroupRepository` extends `BaseRepository<ElectiveGroup>` - Interface defining structure for elective group repository.
- **Const** `ELECTIVE_GROUP_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing elective group repository.

### `server/src/modules/library/repositories/faculty.repository.ts`
*Database repository managing faculty.repository persistence.*

- **Injectable** `MongoFacultyRepository` implements `FacultyRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo faculty repository logic.
- **Injectable** `CachedFacultyRepository` implements `FacultyRepository` (deps: MongoFacultyRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached faculty repository logic.
- **Interface** `FacultyFilterOptions` - Interface defining structure for faculty filter options.
- **Interface** `FacultyRepository` extends `BaseRepository<Faculty>` - Interface defining structure for faculty repository.
- **Const** `FACULTY_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing faculty repository.

### `server/src/modules/library/repositories/room.repository.ts`
*Database repository managing room.repository persistence.*

- **Injectable** `MongoRoomRepository` implements `RoomRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo room repository logic.
- **Injectable** `CachedRoomRepository` implements `RoomRepository` (deps: MongoRoomRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached room repository logic.
- **Interface** `RoomFilterOptions` - Interface defining structure for room filter options.
- **Interface** `RoomRepository` extends `BaseRepository<Room>` - Interface defining structure for room repository.
- **Const** `ROOM_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing room repository.

### `server/src/modules/library/repositories/subject.repository.ts`
*Database repository managing subject.repository persistence.*

- **Injectable** `MongoSubjectRepository` implements `SubjectRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo subject repository logic.
- **Injectable** `CachedSubjectRepository` implements `SubjectRepository` (deps: MongoSubjectRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached subject repository logic.
- **Interface** `SubjectFilterOptions` - Interface defining structure for subject filter options.
- **Interface** `SubjectRepository` extends `BaseRepository<Subject>` - Interface defining structure for subject repository.
- **Const** `SUBJECT_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing subject repository.

### `server/src/modules/library/schemas/elective-group.schema.ts`
*Data schema and persistence model for elective-group.schema.*

- **Mongoose Schema** `ElectiveGroup` (collection: `elective_groups` (indexes: institutionId, isDeleted)) - Class implementing elective group.
- **Type** `ElectiveGroupDocument` - Type alias for elective group document.
- **Zod Schema** `ElectiveGroupSchema` -> `ElectiveGroup` - Zod schema validating elective group.

### `server/src/modules/library/schemas/faculty.schema.ts`
*Data schema and persistence model for faculty.schema.*

- **Mongoose Schema** `Faculty` (collection: `faculties` (indexes: institutionId, departmentId, archived, isDeleted)) - Class implementing faculty.
- **Type** `FacultyDocument` - Type alias for faculty document.
- **Zod Schema** `FacultySchema` -> `Faculty` - Zod schema validating faculty.

### `server/src/modules/library/schemas/room.schema.ts`
*Data schema and persistence model for room.schema.*

- **Mongoose Schema** `Room` (collection: `rooms` (indexes: institutionId, archived, isDeleted)) - Class implementing room.
- **Type** `RoomDocument` - Type alias for room document.
- **Zod Schema** `RoomSchema` -> `Room` - Zod schema validating room.

### `server/src/modules/library/schemas/subject.schema.ts`
*Data schema and persistence model for subject.schema.*

- **Mongoose Schema** `Subject` (collection: `subjects` (indexes: institutionId, departmentId, archived, isDeleted)) - Class implementing subject.
- **Type** `SubjectDocument` - Type alias for subject document.
- **Zod Schema** `SubjectSchema` -> `Subject` - Zod schema validating subject.

### `server/src/modules/library/services/faculty-workload.service.ts`
*Domain service orchestrating faculty-workload.service business logic.*

- **Injectable** `FacultyWorkloadService` - Injectable service providing faculty workload service logic.

### `server/src/modules/library/services/library-import.service.ts`
*Domain service orchestrating library-import.service business logic.*

- **Injectable** `LibraryImportService` - Injectable service providing library import service logic.

### `server/src/modules/library/services/library.service.ts`
*Domain service orchestrating library.service business logic.*

- **Injectable** `LibraryService` (deps: @Inject(FACULTY_REPOSITORY), @Inject(SUBJECT_REPOSITORY), @Inject(ELECTIVE_GROUP_REPOSITORY), @Inject(ROOM_REPOSITORY), @Inject(ROOM_MATCHER), @Inject(FACULTY_QUALIFIER), FacultyWorkloadService, LibraryImportService, EventBus, AuditService) - Injectable service providing library service logic.

### `server/src/modules/library/strategies/faculty-qualifier.strategy.ts`
*Strategy implementation for faculty-qualifier.strategy.*

- **Injectable** `StandardFacultyQualifier` implements `IFacultyQualifier` - Injectable service providing standard faculty qualifier logic.
- **Interface** `IFacultyQualifier` - Interface defining structure for faculty qualifier.
- **Const** `FACULTY_QUALIFIER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing faculty qualifier.

### `server/src/modules/library/strategies/file-parser.strategy.ts`
*Strategy implementation for file-parser.strategy.*

- **Class** `CsvFileParserStrategy` implements `IFileParser` - Class implementing csv file parser strategy.
- **Class** `ExcelFileParserStrategy` implements `IFileParser` - Class implementing excel file parser strategy.
- **Interface** `IFileParser` - Interface defining structure for file parser.

### `server/src/modules/library/strategies/room-matcher.strategy.ts`
*Strategy implementation for room-matcher.strategy.*

- **Injectable** `StandardRoomMatcher` implements `IRoomMatcher` - Injectable service providing standard room matcher logic.
- **Interface** `IRoomMatcher` - Interface defining structure for room matcher.
- **Const** `ROOM_MATCHER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing room matcher.

