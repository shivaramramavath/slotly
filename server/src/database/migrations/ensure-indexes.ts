// Database migration to ensure MongoDB indexes and compound unique constraints across all collections.
import { DEFAULT_CONFIG } from '../../config/defaults';

/** Interface defining an index specification for a collection. */
export interface IndexDefinition {
  collection: string;
  fields: Record<string, 1 | -1>;
  options?: { unique?: boolean; sparse?: boolean; background?: boolean };
}

/** Interface defining minimal MongoDB collection operations for indexing. */
export interface MongoIndexSpec {
  key: Record<string, 1 | -1>;
  name?: string;
}

/** Interface defining minimal collection shape for index checks. */
export interface MongoCollectionLike {
  listIndexes(): { toArray(): Promise<MongoIndexSpec[]> };
  createIndex(
    fields: Record<string, 1 | -1>,
    options?: { unique?: boolean; sparse?: boolean; background?: boolean },
  ): Promise<string>;
}

/** Interface defining minimal database shape for index checks. */
export interface MongoDatabaseLike {
  collection(name: string): MongoCollectionLike;
}

/** Migration execution options. */
export interface MigrationOptions {
  dryRun?: boolean;
}

/** Migration result summary. */
export interface MigrationResult {
  planned: number;
  applied: number;
  details: Array<{
    collection: string;
    fields: Record<string, 1 | -1>;
    action: string;
  }>;
}

/**
 * Returns all required MongoDB index specifications matching docs/ARCHITECTURE.md Section 4.
 */
export function getIndexDefinitions(): IndexDefinition[] {
  return [
    // Users
    {
      collection: 'users',
      fields: { email: 1 },
      options: { unique: true },
    },
    {
      collection: 'users',
      fields: { institutionId: 1, role: 1 },
    },
    // Projects
    {
      collection: 'projects',
      fields: { institutionId: 1, status: 1 },
    },
    {
      collection: 'projects',
      fields: { ownerId: 1 },
    },
    // Blueprints
    {
      collection: 'blueprints',
      fields: { projectId: 1 },
      options: { unique: true },
    },
    // Schedule Versions
    {
      collection: 'schedule_versions',
      fields: { projectId: 1, versionNo: 1 },
      options: { unique: true },
    },
    {
      collection: 'schedule_versions',
      fields: { projectId: 1, status: 1 },
    },
    // Faculties
    {
      collection: 'faculties',
      fields: { institutionId: 1, code: 1, isDeleted: 1 },
      options: { unique: true },
    },
    {
      collection: 'faculties',
      fields: { institutionId: 1, departmentId: 1 },
    },
    // Rooms
    {
      collection: 'rooms',
      fields: { institutionId: 1, code: 1, isDeleted: 1 },
      options: { unique: true },
    },
    {
      collection: 'rooms',
      fields: { institutionId: 1, type: 1 },
    },
    // Subjects
    {
      collection: 'subjects',
      fields: { institutionId: 1, code: 1, isDeleted: 1 },
      options: { unique: true },
    },
    {
      collection: 'subjects',
      fields: { institutionId: 1, departmentId: 1 },
    },
    // Departments
    {
      collection: 'departments',
      fields: { institutionId: 1, code: 1, isDeleted: 1 },
      options: { unique: true },
    },
    // Programs
    {
      collection: 'programs',
      fields: { departmentId: 1, code: 1, isDeleted: 1 },
      options: { unique: true },
    },
    // Academic Years
    {
      collection: 'academic_years',
      fields: { programId: 1, yearNumber: 1, isDeleted: 1 },
      options: { unique: true },
    },
    // Semesters
    {
      collection: 'semesters',
      fields: { academicYearId: 1, number: 1, isDeleted: 1 },
      options: { unique: true },
    },
    // Sections
    {
      collection: 'sections',
      fields: { semesterId: 1, name: 1, isDeleted: 1 },
      options: { unique: true },
    },
    // Audit Logs
    {
      collection: 'audit_logs',
      fields: { targetType: 1, targetId: 1, timestamp: -1 },
    },
  ];
}

/**
 * Runs the index migration idempotently against the provided MongoDB database.
 * If dryRun is true, checks existing indexes and reports planned changes without creating them.
 */
export async function runIndexMigration(
  db: MongoDatabaseLike,
  options: MigrationOptions = {},
): Promise<MigrationResult> {
  const isDryRun = options.dryRun ?? false;
  const defs = getIndexDefinitions();
  const details: MigrationResult['details'] = [];
  let applied = 0;

  for (const def of defs) {
    const col = db.collection(def.collection);
    const existing = await col.listIndexes().toArray();

    // Check if index already exists with the same key specification
    const keySpec = def.fields;
    const exists = existing.some((idx) => {
      const idxKey = idx.key;
      const keysA = Object.keys(keySpec);
      const keysB = Object.keys(idxKey);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((k) => keySpec[k] === idxKey[k]);
    });

    if (exists) {
      details.push({
        collection: def.collection,
        fields: def.fields,
        action: 'already_exists',
      });
      continue;
    }

    if (isDryRun) {
      details.push({
        collection: def.collection,
        fields: def.fields,
        action: 'plan_create',
      });
    } else {
      await col.createIndex(def.fields, def.options);
      applied++;
      details.push({
        collection: def.collection,
        fields: def.fields,
        action: 'created',
      });
    }
  }

  return {
    planned: details.filter((d) => d.action !== 'already_exists').length,
    applied,
    details,
  };
}

if (process.argv[1] && process.argv[1].endsWith('ensure-indexes.ts')) {
  // Direct CLI invocation
  const dryRun = process.argv.includes('--dry-run');
  const uri =
    process.env['DATABASE_URL'] ??
    process.env['MONGODB_URI'] ??
    DEFAULT_CONFIG.database.uri;

  void (async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mongoose = require('mongoose') as typeof import('mongoose');
    console.log(`Connecting to MongoDB at ${uri}...`);
    const conn = await mongoose.connect(uri);
    try {
      const db = conn.connection.db;
      if (!db) {
        throw new Error('Database handle is undefined on mongoose connection');
      }
      console.log(`Running index migration (dryRun=${dryRun})...`);
      const result = await runIndexMigration(db, { dryRun });
      console.log(
        `Migration complete! Planned: ${result.planned}, Applied: ${result.applied}`,
      );
      for (const d of result.details) {
        console.log(
          `  [${d.action}] ${d.collection}: ${JSON.stringify(d.fields)}`,
        );
      }
    } catch (err) {
      console.error('Migration failed:', err);
      process.exitCode = 1;
    } finally {
      await conn.disconnect();
    }
  })();
}
