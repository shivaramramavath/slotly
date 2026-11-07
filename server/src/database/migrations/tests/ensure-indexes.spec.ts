// Unit tests verifying MongoDB schema indexes and migration script.
import { DepartmentSchema } from '../../../modules/institutions/schemas/department.schema';
import { FacultySchema } from '../../../modules/library/schemas/faculty.schema';
import { RoomSchema } from '../../../modules/library/schemas/room.schema';
import { SubjectSchema } from '../../../modules/library/schemas/subject.schema';
import { ProgramSchema } from '../../../modules/institutions/schemas/program.schema';
import { ProjectSchema } from '../../../modules/projects/schemas/project.schema';
import { ScheduleVersionSchema } from '../../../modules/builds/schemas/schedule-version.schema';
import {
  getIndexDefinitions,
  runIndexMigration,
  type MongoDatabaseLike,
  type MongoIndexSpec,
} from '../ensure-indexes';

describe('MongoDB Schema Indexes & Migration (AUD-004)', () => {
  it('should define compound unique indexes with isDeleted for library and institution schemas', () => {
    const deptIndexes = DepartmentSchema.indexes();
    const hasUniqueDept = deptIndexes.some(
      ([fields, opts]) =>
        fields.institutionId === 1 &&
        fields.code === 1 &&
        fields.isDeleted === 1 &&
        opts?.unique === true,
    );
    expect(hasUniqueDept).toBe(true);

    const facultyIndexes = FacultySchema.indexes();
    const hasUniqueFaculty = facultyIndexes.some(
      ([fields, opts]) =>
        fields.institutionId === 1 &&
        fields.code === 1 &&
        fields.isDeleted === 1 &&
        opts?.unique === true,
    );
    expect(hasUniqueFaculty).toBe(true);

    const roomIndexes = RoomSchema.indexes();
    const hasUniqueRoom = roomIndexes.some(
      ([fields, opts]) =>
        fields.institutionId === 1 &&
        fields.code === 1 &&
        fields.isDeleted === 1 &&
        opts?.unique === true,
    );
    expect(hasUniqueRoom).toBe(true);

    const subjectIndexes = SubjectSchema.indexes();
    const hasUniqueSubject = subjectIndexes.some(
      ([fields, opts]) =>
        fields.institutionId === 1 &&
        fields.code === 1 &&
        fields.isDeleted === 1 &&
        opts?.unique === true,
    );
    expect(hasUniqueSubject).toBe(true);

    const programIndexes = ProgramSchema.indexes();
    const hasUniqueProgram = programIndexes.some(
      ([fields, opts]) =>
        fields.departmentId === 1 &&
        fields.code === 1 &&
        fields.isDeleted === 1 &&
        opts?.unique === true,
    );
    expect(hasUniqueProgram).toBe(true);
  });

  it('should define project and schedule_version indexes matching architecture spec', () => {
    const projIndexes = ProjectSchema.indexes();
    const hasOwnerIndex = projIndexes.some(([fields]) => fields.ownerId === 1);
    expect(hasOwnerIndex).toBe(true);

    const hasInstStatus = projIndexes.some(
      ([fields]) => fields.institutionId === 1 && fields.status === 1,
    );
    expect(hasInstStatus).toBe(true);

    const schedIndexes = ScheduleVersionSchema.indexes();
    const hasUniqueSched = schedIndexes.some(
      ([fields, opts]) =>
        fields.projectId === 1 &&
        fields.versionNo === 1 &&
        opts?.unique === true,
    );
    expect(hasUniqueSched).toBe(true);
  });

  it('should support dry-run execution in ensure-indexes migration', async () => {
    const defs = getIndexDefinitions();
    expect(defs.length).toBeGreaterThanOrEqual(7);

    const createdCalls: Array<{
      fields: Record<string, 1 | -1>;
      options?: Record<string, unknown>;
    }> = [];

    const mockDb: MongoDatabaseLike = {
      collection: () => ({
        listIndexes: () => ({
          toArray: (): Promise<MongoIndexSpec[]> => Promise.resolve([]),
        }),
        createIndex: (fields, options): Promise<string> => {
          createdCalls.push({ fields, options });
          return Promise.resolve('ok');
        },
      }),
    };

    const dryRunResult = await runIndexMigration(mockDb, {
      dryRun: true,
    });
    expect(dryRunResult.applied).toBe(0);
    expect(dryRunResult.planned).toBeGreaterThan(0);
    expect(createdCalls).toHaveLength(0);

    const liveResult = await runIndexMigration(mockDb, {
      dryRun: false,
    });
    expect(liveResult.applied).toBeGreaterThan(0);
    expect(createdCalls.length).toBeGreaterThan(0);
  });
});
