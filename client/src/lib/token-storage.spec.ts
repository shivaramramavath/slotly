// Verification test ensuring zero token persistence in localStorage, sessionStorage, cookies from JS, or client source code.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

function findFiles(dir: string, ext: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        results = results.concat(findFiles(fullPath, ext));
      }
    } else if (file.endsWith(ext) && !file.includes('.spec.')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Token Storage Security & Leak Audit', () => {
  it('verifies no client source file saves access or refresh tokens to localStorage or sessionStorage', () => {
    const clientSrc = path.resolve(__dirname, '..');
    const sourceFiles = [
      ...findFiles(clientSrc, '.ts'),
      ...findFiles(clientSrc, '.tsx'),
    ];

    assert(sourceFiles.length > 0, 'Must inspect client source files');

    const forbiddenPatterns = [
      /localStorage\.setItem\([^)]*token/i,
      /sessionStorage\.setItem\([^)]*token/i,
      /document\.cookie\s*=[^;]*refreshToken/i,
    ];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        assert(
          !pattern.test(content),
          `Security violation: found forbidden token storage pattern ${pattern} in ${filePath}`,
        );
      }
    }
  });
});
