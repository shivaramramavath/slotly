# Server Institutions Module Code Map

### `server/src/modules/institutions/controllers/institutions.controller.ts`
*HTTP controller handling institutions.controller endpoints.*

- **Controller** `InstitutionsController` (base: `/institution`) - Controller handling institutions controller HTTP endpoints.
  - `GET /institution/structure` -> `getStructure()` [perm: 'INSTITUTION_READ']
  - `POST /institution` -> `createInstitution()` [perm: 'INSTITUTION_MANAGE']
  - `GET /institution` -> `getInstitution()` [perm: 'INSTITUTION_READ']
  - `PUT /institution` -> `updateInstitution()` [perm: 'INSTITUTION_MANAGE']
  - `GET /institution/departments` -> `listDepartments()` [perm: 'DEPARTMENT_READ']
  - `POST /institution/departments` -> `createDepartment()` [perm: 'DEPARTMENT_MANAGE']
  - `PUT /institution/departments/:id` -> `updateDepartment()` [perm: 'DEPARTMENT_MANAGE']
  - `DELETE /institution/departments/:id` -> `deleteDepartment()` [perm: 'DEPARTMENT_MANAGE']
  - `GET /institution/programs` -> `listPrograms()` [perm: 'STRUCTURE_READ']
  - `POST /institution/programs` -> `createProgram()` [perm: 'STRUCTURE_MANAGE']
  - `PUT /institution/programs/:id` -> `updateProgram()` [perm: 'STRUCTURE_MANAGE']
  - `DELETE /institution/programs/:id` -> `deleteProgram()` [perm: 'STRUCTURE_MANAGE']
  - `GET /institution/academic-years` -> `listAcademicYears()` [perm: 'STRUCTURE_READ']
  - `POST /institution/academic-years` -> `createAcademicYear()` [perm: 'STRUCTURE_MANAGE']
  - `PUT /institution/academic-years/:id` -> `updateAcademicYear()` [perm: 'STRUCTURE_MANAGE']
  - `DELETE /institution/academic-years/:id` -> `deleteAcademicYear()` [perm: 'STRUCTURE_MANAGE']
  - `GET /institution/semesters` -> `listSemesters()` [perm: 'STRUCTURE_READ']
  - `POST /institution/semesters` -> `createSemester()` [perm: 'STRUCTURE_MANAGE']
  - `PUT /institution/semesters/:id` -> `updateSemester()` [perm: 'STRUCTURE_MANAGE']
  - `DELETE /institution/semesters/:id` -> `deleteSemester()` [perm: 'STRUCTURE_MANAGE']
  - `GET /institution/sections` -> `listSections()` [perm: 'STRUCTURE_READ']
  - `POST /institution/sections` -> `createSection()` [perm: 'STRUCTURE_MANAGE']
  - `PUT /institution/sections/:id` -> `updateSection()` [perm: 'STRUCTURE_MANAGE']
  - `DELETE /institution/sections/:id` -> `deleteSection()` [perm: 'STRUCTURE_MANAGE']
  - `GET /institution/holidays` -> `listHolidays()` [perm: 'INSTITUTION_READ']
  - `POST /institution/holidays` -> `createHoliday()` [perm: 'INSTITUTION_MANAGE']
  - `DELETE /institution/holidays/:id` -> `deleteHoliday()` [perm: 'INSTITUTION_MANAGE']

### `server/src/modules/institutions/institutions.module.ts`
*Core implementation for institutions.module in server/src/modules/institutions.*

- **Class** `InstitutionsModule` - Class implementing institutions module.

### `server/src/modules/institutions/repositories/academic-year.repository.ts`
*Database repository managing academic-year.repository persistence.*

- **Injectable** `MongoAcademicYearRepository` implements `AcademicYearRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo academic year repository logic.
- **Injectable** `CachedAcademicYearRepository` implements `AcademicYearRepository` (deps: AcademicYearRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached academic year repository logic.
- **Interface** `AcademicYearRepository` extends `BaseRepository<AcademicYear>` - Interface defining structure for academic year repository.
- **Const** `ACADEMIC_YEAR_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing academic year repository.

### `server/src/modules/institutions/repositories/department.repository.ts`
*Database repository managing department.repository persistence.*

- **Injectable** `MongoDepartmentRepository` implements `DepartmentRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo department repository logic.
- **Injectable** `CachedDepartmentRepository` implements `DepartmentRepository` (deps: DepartmentRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached department repository logic.
- **Interface** `DepartmentRepository` extends `BaseRepository<Department>` - Interface defining structure for department repository.
- **Const** `DEPARTMENT_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing department repository.

### `server/src/modules/institutions/repositories/holiday.repository.ts`
*Database repository managing holiday.repository persistence.*

- **Injectable** `MongoHolidayRepository` implements `HolidayRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo holiday repository logic.
- **Injectable** `CachedHolidayRepository` implements `HolidayRepository` (deps: HolidayRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached holiday repository logic.
- **Interface** `HolidayRepository` extends `BaseRepository<Holiday>` - Interface defining structure for holiday repository.
- **Const** `HOLIDAY_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing holiday repository.

### `server/src/modules/institutions/repositories/institution.repository.ts`
*Database repository managing institution.repository persistence.*

- **Injectable** `MongoInstitutionRepository` implements `InstitutionRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo institution repository logic.
- **Injectable** `CachedInstitutionRepository` implements `InstitutionRepository` (deps: InstitutionRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached institution repository logic.
- **Interface** `InstitutionRepository` extends `BaseRepository<Institution>` - Interface defining structure for institution repository.
- **Const** `INSTITUTION_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing nstitution repository.

### `server/src/modules/institutions/repositories/program.repository.ts`
*Database repository managing program.repository persistence.*

- **Injectable** `MongoProgramRepository` implements `ProgramRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo program repository logic.
- **Injectable** `CachedProgramRepository` implements `ProgramRepository` (deps: ProgramRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached program repository logic.
- **Interface** `ProgramRepository` extends `BaseRepository<Program>` - Interface defining structure for program repository.
- **Const** `PROGRAM_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing program repository.

### `server/src/modules/institutions/repositories/section.repository.ts`
*Database repository managing section.repository persistence.*

- **Injectable** `MongoSectionRepository` implements `SectionRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo section repository logic.
- **Injectable** `CachedSectionRepository` implements `SectionRepository` (deps: SectionRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached section repository logic.
- **Interface** `SectionRepository` extends `BaseRepository<Section>` - Interface defining structure for section repository.
- **Const** `SECTION_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing section repository.

### `server/src/modules/institutions/repositories/semester.repository.ts`
*Database repository managing semester.repository persistence.*

- **Injectable** `MongoSemesterRepository` implements `SemesterRepository` (deps: ObjectId; }> & { __v: number; }>) - Injectable service providing mongo semester repository logic.
- **Injectable** `CachedSemesterRepository` implements `SemesterRepository` (deps: SemesterRepository, @Inject(CACHE_SERVICE)) - Injectable service providing cached semester repository logic.
- **Interface** `SemesterRepository` extends `BaseRepository<Semester>` - Interface defining structure for semester repository.
- **Const** `SEMESTER_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing semester repository.

### `server/src/modules/institutions/schemas/academic-year.schema.ts`
*Data schema and persistence model for academic-year.schema.*

- **Mongoose Schema** `AcademicYear` (collection: `academic_years` (indexes: institutionId, programId, isDeleted)) - Class implementing academic year.
- **Type** `AcademicYearDocument` - Type alias for academic year document.
- **Zod Schema** `AcademicYearSchema` -> `AcademicYear` - Zod schema validating academic year.

### `server/src/modules/institutions/schemas/department.schema.ts`
*Data schema and persistence model for department.schema.*

- **Mongoose Schema** `Department` (collection: `departments` (indexes: institutionId, isDeleted)) - Class implementing department.
- **Type** `DepartmentDocument` - Type alias for department document.
- **Zod Schema** `DepartmentSchema` -> `Department` - Zod schema validating department.

### `server/src/modules/institutions/schemas/holiday.schema.ts`
*Data schema and persistence model for holiday.schema.*

- **Mongoose Schema** `Holiday` (collection: `holidays` (indexes: institutionId, isDeleted)) - Class implementing holiday.
- **Type** `HolidayDocument` - Type alias for holiday document.
- **Zod Schema** `HolidaySchema` -> `Holiday` - Zod schema validating holiday.

### `server/src/modules/institutions/schemas/institution.schema.ts`
*Data schema and persistence model for institution.schema.*

- **Mongoose Schema** `Institution` (collection: `institutions` (indexes: code, isDeleted)) - Class implementing institution.
- **Type** `InstitutionDocument` - Type alias for institution document.
- **Zod Schema** `InstitutionSchema` -> `Institution` - Zod schema validating institution.

### `server/src/modules/institutions/schemas/program.schema.ts`
*Data schema and persistence model for program.schema.*

- **Mongoose Schema** `Program` (collection: `programs` (indexes: institutionId, departmentId, isDeleted)) - Class implementing program.
- **Type** `ProgramDocument` - Type alias for program document.
- **Zod Schema** `ProgramSchema` -> `Program` - Zod schema validating program.

### `server/src/modules/institutions/schemas/section.schema.ts`
*Data schema and persistence model for section.schema.*

- **Mongoose Schema** `Section` (collection: `sections` (indexes: institutionId, semesterId, academicYearId, isDeleted)) - Class implementing section.
- **Type** `SectionDocument` - Type alias for section document.
- **Zod Schema** `SectionSchema` -> `Section` - Zod schema validating section.

### `server/src/modules/institutions/schemas/semester.schema.ts`
*Data schema and persistence model for semester.schema.*

- **Mongoose Schema** `Semester` (collection: `semesters` (indexes: institutionId, programId, academicYearId, isDeleted)) - Class implementing semester.
- **Type** `SemesterDocument` - Type alias for semester document.
- **Zod Schema** `SemesterSchema` -> `Semester` - Zod schema validating semester.

### `server/src/modules/institutions/services/dependency-checker.service.ts`
*Domain service orchestrating dependency-checker.service business logic.*

- **Injectable** `DependencyCheckerService` - Injectable service providing dependency checker service logic.
- **Interface** `BaseEntityRecord` - Interface defining structure for base entity record.

### `server/src/modules/institutions/services/institutions.service.ts`
*Domain service orchestrating institutions.service business logic.*

- **Injectable** `DefaultInstitutionsService` implements `InstitutionsService` (deps: @Inject(INSTITUTION_REPOSITORY), @Inject(DEPARTMENT_REPOSITORY), @Inject(PROGRAM_REPOSITORY), @Inject(ACADEMIC_YEAR_REPOSITORY), @Inject(SEMESTER_REPOSITORY), @Inject(SECTION_REPOSITORY), @Inject(HOLIDAY_REPOSITORY), DependencyCheckerService, TreeBuilderService, @Inject(CACHE_SERVICE), EventBus, AuditService) - Injectable service providing default institutions service logic.
- **Interface** `InstitutionsService` - Interface defining structure for institutions service.
- **Const** `INSTITUTIONS_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...` - Constant representing nstitutions service.

### `server/src/modules/institutions/services/tree-builder.service.ts`
*Domain service orchestrating tree-builder.service business logic.*

- **Injectable** `TreeBuilderService` - Injectable service providing tree builder service logic.

