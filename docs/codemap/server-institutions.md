# Server Institutions Module Code Map

### `server/src/modules/institutions/controllers/institutions.controller.ts`
*(no description)*

- **Controller** `InstitutionsController` (base: `/institution`)
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
*(no description)*

- **Class** `InstitutionsModule`

### `server/src/modules/institutions/repositories/academic-year.repository.ts`
*(no description)*

- **Injectable** `MongoAcademicYearRepository` implements `AcademicYearRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedAcademicYearRepository` implements `AcademicYearRepository` (deps: AcademicYearRepository, @Inject(CACHE_SERVICE))
- **Interface** `AcademicYearRepository` extends `BaseRepository<AcademicYear>`
- **Const** `ACADEMIC_YEAR_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/institutions/repositories/department.repository.ts`
*(no description)*

- **Injectable** `MongoDepartmentRepository` implements `DepartmentRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedDepartmentRepository` implements `DepartmentRepository` (deps: DepartmentRepository, @Inject(CACHE_SERVICE))
- **Interface** `DepartmentRepository` extends `BaseRepository<Department>`
- **Const** `DEPARTMENT_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/institutions/repositories/holiday.repository.ts`
*(no description)*

- **Injectable** `MongoHolidayRepository` implements `HolidayRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedHolidayRepository` implements `HolidayRepository` (deps: HolidayRepository, @Inject(CACHE_SERVICE))
- **Interface** `HolidayRepository` extends `BaseRepository<Holiday>`
- **Const** `HOLIDAY_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/institutions/repositories/institution.repository.ts`
*(no description)*

- **Injectable** `MongoInstitutionRepository` implements `InstitutionRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedInstitutionRepository` implements `InstitutionRepository` (deps: InstitutionRepository, @Inject(CACHE_SERVICE))
- **Interface** `InstitutionRepository` extends `BaseRepository<Institution>`
- **Const** `INSTITUTION_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/institutions/repositories/program.repository.ts`
*(no description)*

- **Injectable** `MongoProgramRepository` implements `ProgramRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedProgramRepository` implements `ProgramRepository` (deps: ProgramRepository, @Inject(CACHE_SERVICE))
- **Interface** `ProgramRepository` extends `BaseRepository<Program>`
- **Const** `PROGRAM_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/institutions/repositories/section.repository.ts`
*(no description)*

- **Injectable** `MongoSectionRepository` implements `SectionRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedSectionRepository` implements `SectionRepository` (deps: SectionRepository, @Inject(CACHE_SERVICE))
- **Interface** `SectionRepository` extends `BaseRepository<Section>`
- **Const** `SECTION_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/institutions/repositories/semester.repository.ts`
*(no description)*

- **Injectable** `MongoSemesterRepository` implements `SemesterRepository` (deps: ObjectId; }> & { __v: number; }>)
- **Injectable** `CachedSemesterRepository` implements `SemesterRepository` (deps: SemesterRepository, @Inject(CACHE_SERVICE))
- **Interface** `SemesterRepository` extends `BaseRepository<Semester>`
- **Const** `SEMESTER_REPOSITORY`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/institutions/schemas/academic-year.schema.ts`
*(no description)*

- **Mongoose Schema** `AcademicYear` (collection: `academic_years` (indexes: institutionId, programId, isDeleted))
- **Type** `AcademicYearDocument`
- **Zod Schema** `AcademicYearSchema` -> `AcademicYear`

### `server/src/modules/institutions/schemas/department.schema.ts`
*(no description)*

- **Mongoose Schema** `Department` (collection: `departments` (indexes: institutionId, isDeleted))
- **Type** `DepartmentDocument`
- **Zod Schema** `DepartmentSchema` -> `Department`

### `server/src/modules/institutions/schemas/holiday.schema.ts`
*(no description)*

- **Mongoose Schema** `Holiday` (collection: `holidays` (indexes: institutionId, isDeleted))
- **Type** `HolidayDocument`
- **Zod Schema** `HolidaySchema` -> `Holiday`

### `server/src/modules/institutions/schemas/institution.schema.ts`
*(no description)*

- **Mongoose Schema** `Institution` (collection: `institutions` (indexes: code, isDeleted))
- **Type** `InstitutionDocument`
- **Zod Schema** `InstitutionSchema` -> `Institution`

### `server/src/modules/institutions/schemas/program.schema.ts`
*(no description)*

- **Mongoose Schema** `Program` (collection: `programs` (indexes: institutionId, departmentId, isDeleted))
- **Type** `ProgramDocument`
- **Zod Schema** `ProgramSchema` -> `Program`

### `server/src/modules/institutions/schemas/section.schema.ts`
*(no description)*

- **Mongoose Schema** `Section` (collection: `sections` (indexes: institutionId, semesterId, academicYearId, isDeleted))
- **Type** `SectionDocument`
- **Zod Schema** `SectionSchema` -> `Section`

### `server/src/modules/institutions/schemas/semester.schema.ts`
*(no description)*

- **Mongoose Schema** `Semester` (collection: `semesters` (indexes: institutionId, programId, academicYearId, isDeleted))
- **Type** `SemesterDocument`
- **Zod Schema** `SemesterSchema` -> `Semester`

### `server/src/modules/institutions/services/dependency-checker.service.ts`
*(no description)*

- **Injectable** `DependencyCheckerService`
- **Interface** `BaseEntityRecord`

### `server/src/modules/institutions/services/institutions.service.ts`
*(no description)*

- **Injectable** `DefaultInstitutionsService` implements `InstitutionsService` (deps: @Inject(INSTITUTION_REPOSITORY), @Inject(DEPARTMENT_REPOSITORY), @Inject(PROGRAM_REPOSITORY), @Inject(ACADEMIC_YEAR_REPOSITORY), @Inject(SEMESTER_REPOSITORY), @Inject(SECTION_REPOSITORY), @Inject(HOLIDAY_REPOSITORY), DependencyCheckerService, TreeBuilderService, @Inject(CACHE_SERVICE), EventBus, AuditService)
- **Interface** `InstitutionsService`
- **Const** `INSTITUTIONS_SERVICE`: `typeof import("E:/Shiva Ram/Projects/slotly/ser...`

### `server/src/modules/institutions/services/tree-builder.service.ts`
*(no description)*

- **Injectable** `TreeBuilderService`

