// Generator test verifying extracted markdown against golden fixtures.
import * as fs from 'fs';
import * as path from 'path';
import { Project } from 'ts-morph';
import { processSourceFile, renderFileDoc } from '../generate';

function runTest(): void {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const fixturesDir = path.resolve(__dirname, '../fixtures');

  const fixtureFiles = [
    { file: 'tiny.controller.ts', rel: 'server/src/modules/sample/sample.controller.ts' },
    { file: 'tiny.gateway.ts', rel: 'server/src/modules/sample/sample.gateway.ts' },
    { file: 'tiny.processor.ts', rel: 'server/src/modules/sample/sample.processor.ts' },
    { file: 'tiny.schema.ts', rel: 'server/src/modules/sample/sample.schema.ts' },
    { file: 'tiny.zod.ts', rel: 'packages/contracts/src/sample.ts' },
    { file: 'tiny.hook.ts', rel: 'client/src/features/sample/hooks/use-tiny.ts' },
    { file: 'tiny.page.tsx', rel: 'client/src/app/(dashboard)/@modal/sample/page.tsx' },
  ];

  for (const f of fixtureFiles) {
    project.addSourceFileAtPath(path.join(fixturesDir, f.file));
  }

  const exportedSymbolsSet = new Set<string>();
  let outputMarkdown = '# Golden Fixture Output\n\n';

  for (const f of fixtureFiles) {
    const sf = project.getSourceFileOrThrow(path.join(fixturesDir, f.file));
    const doc = processSourceFile(sf, f.rel, exportedSymbolsSet);
    outputMarkdown += renderFileDoc(doc);
  }

  const goldenPath = path.join(__dirname, 'golden.md');

  if (process.env.UPDATE_GOLDEN || !fs.existsSync(goldenPath)) {
    fs.writeFileSync(goldenPath, outputMarkdown.replace(/\r\n/g, '\n'), 'utf8');
    console.log(`[codemap:test] Golden file written to: ${goldenPath}`);
  }

  const goldenContent = fs.readFileSync(goldenPath, 'utf8').replace(/\r\n/g, '\n');
  const normalizedActual = outputMarkdown.replace(/\r\n/g, '\n');

  if (normalizedActual !== goldenContent) {
    console.error(`[codemap:test:error] Extracted markdown does not match golden file!`);
    console.error(`--- Expected Golden ---\n${goldenContent}`);
    console.error(`--- Actual Output ---\n${normalizedActual}`);
    process.exit(1);
  }

  console.log(`[codemap:test] Generator fixtures test passed cleanly!`);
}

runTest();
