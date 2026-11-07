# Server Library Module Code Map

### `server/src/modules/library/controllers/library.controller.ts`
*(no description)*

- **Controller** `LibraryController` (base: `/library`)
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
*(no description)*

- **Class** `LibraryModule`

### `server/src/modules/library/repositories/elective-group.repository.ts`
*(no description)*

- **Injectable** `MongoElectiveGroupRepository` implements `ElectiveGroupRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedElectiveGroupRepository` implements `ElectiveGroupRepository` (deps: MongoElectiveGroupRepository, @Inject(CACHE_SERVICE))
- **Interface** `ElectiveGroupRepository` extends `BaseRepository<ElectiveGroup>`
- **Const** `ELECTIVE_GROUP_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/library/repositories/faculty.repository.ts`
*(no description)*

- **Injectable** `MongoFacultyRepository` implements `FacultyRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedFacultyRepository` implements `FacultyRepository` (deps: MongoFacultyRepository, @Inject(CACHE_SERVICE))
- **Interface** `FacultyFilterOptions`
- **Interface** `FacultyRepository` extends `BaseRepository<Faculty>`
- **Const** `FACULTY_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/library/repositories/room.repository.ts`
*(no description)*

- **Injectable** `MongoRoomRepository` implements `RoomRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedRoomRepository` implements `RoomRepository` (deps: MongoRoomRepository, @Inject(CACHE_SERVICE))
- **Interface** `RoomFilterOptions`
- **Interface** `RoomRepository` extends `BaseRepository<Room>`
- **Const** `ROOM_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/library/repositories/subject.repository.ts`
*(no description)*

- **Injectable** `MongoSubjectRepository` implements `SubjectRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedSubjectRepository` implements `SubjectRepository` (deps: MongoSubjectRepository, @Inject(CACHE_SERVICE))
- **Interface** `SubjectFilterOptions`
- **Interface** `SubjectRepository` extends `BaseRepository<Subject>`
- **Const** `SUBJECT_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/library/schemas/elective-group.schema.ts`
*(no description)*

- **Mongoose Schema** `ElectiveGroup` (collection: `elective_groups` (indexes: institutionId, isDeleted))
- **Type** `ElectiveGroupDocument`
- **Zod Schema** `ElectiveGroupSchema` -> `ElectiveGroup`

### `server/src/modules/library/schemas/faculty.schema.ts`
*(no description)*

- **Mongoose Schema** `Faculty` (collection: `faculties` (indexes: institutionId, departmentId, archived, isDeleted))
- **Type** `FacultyDocument`
- **Zod Schema** `FacultySchema` -> `Faculty`

### `server/src/modules/library/schemas/room.schema.ts`
*(no description)*

- **Mongoose Schema** `Room` (collection: `rooms` (indexes: institutionId, archived, isDeleted))
- **Type** `RoomDocument`
- **Zod Schema** `RoomSchema` -> `Room`

### `server/src/modules/library/schemas/subject.schema.ts`
*(no description)*

- **Mongoose Schema** `Subject` (collection: `subjects` (indexes: institutionId, departmentId, archived, isDeleted))
- **Type** `SubjectDocument`
- **Zod Schema** `SubjectSchema` -> `Subject`

### `server/src/modules/library/services/faculty-workload.service.ts`
*(no description)*

- **Injectable** `FacultyWorkloadService`

### `server/src/modules/library/services/library-import.service.ts`
*(no description)*

- **Injectable** `LibraryImportService`

### `server/src/modules/library/services/library.service.ts`
*(no description)*

- **Injectable** `LibraryService` (deps: @Inject(FACULTY_REPOSITORY), @Inject(SUBJECT_REPOSITORY), @Inject(ELECTIVE_GROUP_REPOSITORY), @Inject(ROOM_REPOSITORY), @Inject(ROOM_MATCHER), @Inject(FACULTY_QUALIFIER), FacultyWorkloadService, LibraryImportService, EventBus, AuditService)

### `server/src/modules/library/strategies/faculty-qualifier.strategy.ts`
*(no description)*

- **Injectable** `StandardFacultyQualifier` implements `IFacultyQualifier`
- **Interface** `IFacultyQualifier`
- **Const** `FACULTY_QUALIFIER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/library/strategies/file-parser.strategy.ts`
*(no description)*

- **Class** `CsvFileParserStrategy` implements `IFileParser`
- **Class** `ExcelFileParserStrategy` implements `IFileParser`
- **Interface** `IFileParser`

### `server/src/modules/library/strategies/room-matcher.strategy.ts`
*(no description)*

- **Injectable** `StandardRoomMatcher` implements `IRoomMatcher`
- **Interface** `IRoomMatcher`
- **Const** `ROOM_MATCHER`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

