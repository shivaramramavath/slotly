// CLI utility for migrating legacy environment variables to the namespaced configuration schema.
import * as fs from 'fs';
import * as path from 'path';

/** Interface representing result of environment migration. */
export interface MigrationResult {
  sourcePath: string;
  outputPath: string;
  renamed: Array<{ from: string; to: string }>;
  flagged: Array<{ key: string; note: string }>;
}

const RENAME_MAP: Record<string, string> = {
  MONGODB_URI: 'DATABASE_URL',
  JWT_ACCESS_EXPIRATION: 'JWT_ACCESS_EXPIRES_IN',
  JWT_REFRESH_EXPIRATION: 'JWT_REFRESH_EXPIRES_IN',
  EMAIL_FROM: 'BREVO_SENDER_EMAIL',
  EMAIL_FROM_NAME: 'BREVO_SENDER_NAME',
};

const FLAGGED_MAP: Record<string, string> = {
  GOOGLE_CALLBACK_URL:
    'Replaced by OAUTH_CALLBACK_BASE_URL (callbacks are now derived as /auth/oauth/google/callback)',
  GITHUB_CALLBACK_URL:
    'Replaced by OAUTH_CALLBACK_BASE_URL (callbacks are now derived as /auth/oauth/github/callback)',
};

/** Migrates environment variable file from legacy keys to modern namespaced keys without exposing values. */
export function migrateEnvFile(targetPath: string): MigrationResult {
  const resolved = path.resolve(process.cwd(), targetPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Target environment file does not exist: ${resolved}`);
  }

  const content = fs.readFileSync(resolved, 'utf8');
  const lines = content.split(/\r?\n/);
  const outLines: string[] = [];
  const renamed: Array<{ from: string; to: string }> = [];
  const flagged: Array<{ key: string; note: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      outLines.push(line);
      continue;
    }

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) {
      outLines.push(line);
      continue;
    }

    const rawKey = line.slice(0, eqIdx);
    const key = rawKey.trim();
    const valueWithLeadingSpaces = line.slice(eqIdx); // Includes '=' and whatever follows

    if (RENAME_MAP[key]) {
      const newKey = RENAME_MAP[key];
      renamed.push({ from: key, to: newKey });
      outLines.push(`${newKey}${valueWithLeadingSpaces}`);
    } else if (FLAGGED_MAP[key]) {
      const note = FLAGGED_MAP[key];
      flagged.push({ key, note });
      outLines.push(`# DEPRECATED: ${key} -> ${note}`);
      outLines.push(`# ${line}`);
    } else if (key.startsWith('SMTP_')) {
      const note =
        'SMTP variables have been removed in favor of Brevo (BREVO_API_KEY, BREVO_SENDER_EMAIL)';
      flagged.push({ key, note });
      outLines.push(`# DEPRECATED: ${key} -> ${note}`);
      outLines.push(`# ${line}`);
    } else {
      outLines.push(line);
    }
  }

  const outputPath = `${resolved}.migrated`;
  fs.writeFileSync(outputPath, outLines.join('\n'), 'utf8');

  return {
    sourcePath: resolved,
    outputPath,
    renamed,
    flagged,
  };
}

/** CLI entry point when executed directly. */
function runCli(): void {
  const target = process.argv[2] || path.join('server', '.env');
  try {
    const result = migrateEnvFile(target);
    console.log(`\n=== Slotly Environment Migration ===`);
    console.log(`Source: ${result.sourcePath}`);
    console.log(`Output: ${result.outputPath}\n`);

    if (result.renamed.length === 0 && result.flagged.length === 0) {
      console.log('No legacy environment variables detected.');
    } else {
      if (result.renamed.length > 0) {
        console.log('Renamed variables:');
        for (const item of result.renamed) {
          console.log(`  - ${item.from} -> ${item.to}`);
        }
      }
      if (result.flagged.length > 0) {
        console.log('\nFlagged variables (manual attention required):');
        for (const item of result.flagged) {
          console.log(`  - ${item.key}: ${item.note}`);
        }
      }
    }
    console.log('\nMigration complete. Review .migrated file before replacing .env.\n');
  } catch (err) {
    console.error(`Migration failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
}
