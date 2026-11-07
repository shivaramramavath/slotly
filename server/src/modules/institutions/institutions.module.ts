import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Institution, InstitutionSchema } from './schemas/institution.schema';
import { Department, DepartmentSchema } from './schemas/department.schema';
import { Program, ProgramSchema } from './schemas/program.schema';
import {
  AcademicYear,
  AcademicYearSchema,
} from './schemas/academic-year.schema';
import { Semester, SemesterSchema } from './schemas/semester.schema';
import { Section, SectionSchema } from './schemas/section.schema';
import { Holiday, HolidaySchema } from './schemas/holiday.schema';
import {
  INSTITUTION_REPOSITORY,
  MongoInstitutionRepository,
  CachedInstitutionRepository,
} from './repositories/institution.repository';
import {
  DEPARTMENT_REPOSITORY,
  MongoDepartmentRepository,
  CachedDepartmentRepository,
} from './repositories/department.repository';
import {
  PROGRAM_REPOSITORY,
  MongoProgramRepository,
  CachedProgramRepository,
} from './repositories/program.repository';
import {
  ACADEMIC_YEAR_REPOSITORY,
  MongoAcademicYearRepository,
  CachedAcademicYearRepository,
} from './repositories/academic-year.repository';
import {
  SEMESTER_REPOSITORY,
  MongoSemesterRepository,
  CachedSemesterRepository,
} from './repositories/semester.repository';
import {
  SECTION_REPOSITORY,
  MongoSectionRepository,
  CachedSectionRepository,
} from './repositories/section.repository';
import {
  HOLIDAY_REPOSITORY,
  MongoHolidayRepository,
  CachedHolidayRepository,
} from './repositories/holiday.repository';
import { DependencyCheckerService } from './services/dependency-checker.service';
import { TreeBuilderService } from './services/tree-builder.service';
import {
  INSTITUTIONS_SERVICE,
  DefaultInstitutionsService,
} from './services/institutions.service';
import { InstitutionsController } from './controllers/institutions.controller';
import { CACHE_SERVICE } from '../../common/cache/cache.interface';
import type { CacheService } from '../../common/cache/cache.interface';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../../common/audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Institution.name, schema: InstitutionSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Program.name, schema: ProgramSchema },
      { name: AcademicYear.name, schema: AcademicYearSchema },
      { name: Semester.name, schema: SemesterSchema },
      { name: Section.name, schema: SectionSchema },
      { name: Holiday.name, schema: HolidaySchema },
    ]),
    AuthModule,
    AuditModule,
  ],
  controllers: [InstitutionsController],
  providers: [
    MongoInstitutionRepository,
    {
      provide: INSTITUTION_REPOSITORY,
      useFactory: (mongo: MongoInstitutionRepository, cache: CacheService) =>
        new CachedInstitutionRepository(mongo, cache),
      inject: [MongoInstitutionRepository, CACHE_SERVICE],
    },
    MongoDepartmentRepository,
    {
      provide: DEPARTMENT_REPOSITORY,
      useFactory: (mongo: MongoDepartmentRepository, cache: CacheService) =>
        new CachedDepartmentRepository(mongo, cache),
      inject: [MongoDepartmentRepository, CACHE_SERVICE],
    },
    MongoProgramRepository,
    {
      provide: PROGRAM_REPOSITORY,
      useFactory: (mongo: MongoProgramRepository, cache: CacheService) =>
        new CachedProgramRepository(mongo, cache),
      inject: [MongoProgramRepository, CACHE_SERVICE],
    },
    MongoAcademicYearRepository,
    {
      provide: ACADEMIC_YEAR_REPOSITORY,
      useFactory: (mongo: MongoAcademicYearRepository, cache: CacheService) =>
        new CachedAcademicYearRepository(mongo, cache),
      inject: [MongoAcademicYearRepository, CACHE_SERVICE],
    },
    MongoSemesterRepository,
    {
      provide: SEMESTER_REPOSITORY,
      useFactory: (mongo: MongoSemesterRepository, cache: CacheService) =>
        new CachedSemesterRepository(mongo, cache),
      inject: [MongoSemesterRepository, CACHE_SERVICE],
    },
    MongoSectionRepository,
    {
      provide: SECTION_REPOSITORY,
      useFactory: (mongo: MongoSectionRepository, cache: CacheService) =>
        new CachedSectionRepository(mongo, cache),
      inject: [MongoSectionRepository, CACHE_SERVICE],
    },
    MongoHolidayRepository,
    {
      provide: HOLIDAY_REPOSITORY,
      useFactory: (mongo: MongoHolidayRepository, cache: CacheService) =>
        new CachedHolidayRepository(mongo, cache),
      inject: [MongoHolidayRepository, CACHE_SERVICE],
    },
    DependencyCheckerService,
    TreeBuilderService,
    {
      provide: INSTITUTIONS_SERVICE,
      useClass: DefaultInstitutionsService,
    },
  ],
  exports: [
    INSTITUTION_REPOSITORY,
    DEPARTMENT_REPOSITORY,
    PROGRAM_REPOSITORY,
    ACADEMIC_YEAR_REPOSITORY,
    SEMESTER_REPOSITORY,
    SECTION_REPOSITORY,
    HOLIDAY_REPOSITORY,
    INSTITUTIONS_SERVICE,
  ],
})
export class InstitutionsModule {}
