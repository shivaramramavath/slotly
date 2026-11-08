// Helper script to backfill file header comments and JSDoc documentation on exported symbols.
import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind, Node } from 'ts-morph';

const ROOT_DIR = path.resolve(__dirname, '../../');

function toForwardSlash(p: string): string {
  return p.replace(/\\/g, '/');
}

function humanize(name: string): string {
  return name
    .replace(/^I([A-Z])/, '$1')
    .replace(/Schema$/, '')
    .replace(/Dto$/, ' DTO')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim();
}

function getFileIntent(relPath: string): string {
  const baseName = path.basename(relPath).replace(/\.[^.]+$/, '');
  const dirName = path.dirname(relPath);

  if (relPath.startsWith('packages/contracts')) {
    return 'Shared TypeScript contracts, Zod schemas, DTOs, and event constants.';
  }
  if (relPath.includes('controller')) {
    return `HTTP controller handling ${humanize(baseName)} endpoints.`;
  }
  if (relPath.includes('gateway')) {
    return `WebSocket gateway managing real-time events for ${humanize(baseName)}.`;
  }
  if (relPath.includes('processor')) {
    return `Queue processor handling background jobs for ${humanize(baseName)}.`;
  }
  if (relPath.includes('repository')) {
    return `Database repository managing ${humanize(baseName)} persistence.`;
  }
  if (relPath.includes('schema')) {
    return `Data schema and persistence model for ${humanize(baseName)}.`;
  }
  if (relPath.includes('service')) {
    return `Domain service orchestrating ${humanize(baseName)} business logic.`;
  }
  if (relPath.includes('guard')) {
    return `Route guard controlling access for ${humanize(baseName)}.`;
  }
  if (relPath.includes('strategy')) {
    return `Strategy implementation for ${humanize(baseName)}.`;
  }
  if (relPath.includes('store')) {
    return `Zustand store managing application state for ${humanize(baseName)}.`;
  }
  if (relPath.includes('hooks') || baseName.startsWith('use-')) {
    return `Custom React hook for ${humanize(baseName)}.`;
  }
  if (relPath.includes('components') || relPath.includes('app/')) {
    return `React component for ${humanize(baseName)}.`;
  }
  return `Core implementation for ${humanize(baseName)} in ${dirName}.`;
}

export function annotateFile(filePath: string, project: Project): boolean {
  const relPath = toForwardSlash(path.relative(ROOT_DIR, filePath));
  const sf = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);

  let modified = false;

  // 1. File intent comment on Line 1
  const fullText = sf.getFullText();
  const leadingComments = sf.getLeadingCommentRanges();
  const hasLine1Comment =
    leadingComments.length > 0 &&
    leadingComments[0].getPos() === 0 &&
    leadingComments[0].getText(fullText).trim().startsWith('//');

  if (!hasLine1Comment) {
    const intent = getFileIntent(relPath);
    sf.insertStatements(0, `// ${intent}`);
    modified = true;
  }

  // 2. Exported declarations JSDocs
  // Classes
  for (const cls of sf.getClasses()) {
    if (!cls.isExported()) continue;
    if (cls.getJsDocs().length === 0) {
      const name = cls.getName() || 'Class';
      const isController = cls.getDecorator('Controller');
      const isGateway = cls.getDecorator('WebSocketGateway');
      const isProcessor = cls.getDecorator('Processor');
      const isInjectable = cls.getDecorator('Injectable');

      let desc = `Class implementing ${humanize(name)}.`;
      if (isController) desc = `Controller handling ${humanize(name)} HTTP endpoints.`;
      else if (isGateway) desc = `WebSocket gateway handling ${humanize(name)} real-time events.`;
      else if (isProcessor) desc = `BullMQ queue processor for ${humanize(name)} jobs.`;
      else if (isInjectable) desc = `Injectable service providing ${humanize(name)} logic.`;

      cls.addJsDoc({ description: desc });
      modified = true;
    }
  }

  // Interfaces
  for (const iface of sf.getInterfaces()) {
    if (!iface.isExported()) continue;
    if (iface.getJsDocs().length === 0) {
      const name = iface.getName();
      iface.addJsDoc({ description: `Interface defining structure for ${humanize(name)}.` });
      modified = true;
    }
  }

  // Type Aliases
  for (const ta of sf.getTypeAliases()) {
    if (!ta.isExported()) continue;
    if (ta.getJsDocs().length === 0) {
      const name = ta.getName();
      const typeText = ta.getTypeNode()?.getText() || '';
      let desc = `Type alias for ${humanize(name)}.`;
      if (typeText.includes('z.infer<')) {
        desc = `TypeScript type inferred from ${humanize(name)} Zod schema.`;
      }
      ta.addJsDoc({ description: desc });
      modified = true;
    }
  }

  // Functions
  for (const fn of sf.getFunctions()) {
    if (!fn.isExported()) continue;
    if (fn.getJsDocs().length === 0) {
      const name = fn.getName() || 'function';
      let desc = `Function performing ${humanize(name)}.`;
      if (name.startsWith('use')) desc = `Custom React hook for ${humanize(name)}.`;
      else if (/^[A-Z]/.test(name)) desc = `React component rendering ${humanize(name)}.`;
      fn.addJsDoc({ description: desc });
      modified = true;
    }
  }

  // Variable Statements
  for (const vs of sf.getVariableStatements()) {
    if (!vs.isExported()) continue;
    if (vs.getJsDocs().length === 0) {
      const decls = vs.getDeclarations();
      if (decls.length > 0) {
        const first = decls[0];
        const name = first.getName();
        const initText = first.getInitializer()?.getText() || '';

        let desc = `Constant representing ${humanize(name)}.`;
        if (name.endsWith('Schema') || initText.startsWith('z.')) {
          desc = `Zod schema validating ${humanize(name)}.`;
        } else if (initText.includes('create<') || initText.includes('create(')) {
          desc = `Zustand store managing ${humanize(name)} state.`;
        } else if (name.startsWith('use')) {
          desc = `Custom React hook for ${humanize(name)}.`;
        } else if (/^[A-Z]/.test(name) && (initText.startsWith('(') || initText.includes('memo('))) {
          desc = `React component rendering ${humanize(name)}.`;
        }

        vs.addJsDoc({ description: desc });
        modified = true;
      }
    }
  }

  if (modified) {
    sf.saveSync();
  }
  return modified;
}

export function annotateFolder(folderPath: string): number {
  console.log(`[annotate] Processing folder: ${folderPath}...`);
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const fullFolder = path.isAbsolute(folderPath) ? folderPath : path.join(ROOT_DIR, folderPath);

  const files: string[] = [];
  function walk(dir: string) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (!item.includes('node_modules') && !item.includes('fixtures') && !item.includes('.next') && !item.includes('dist')) {
          walk(full);
        }
      } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
        if (!full.includes('.spec.') && !full.includes('.test.') && !full.endsWith('.d.ts')) {
          files.push(full);
        }
      }
    }
  }

  walk(fullFolder);
  let updatedCount = 0;
  for (const file of files) {
    if (annotateFile(file, project)) {
      updatedCount++;
    }
  }

  console.log(`[annotate] Updated ${updatedCount} of ${files.length} files in ${folderPath}.`);
  return updatedCount;
}

if (require.main === module || (process.argv[1] && path.basename(process.argv[1]).includes('annotate'))) {
  const target = process.argv[2];
  if (!target) {
    console.error('Please specify a target folder (e.g. packages/contracts/src)');
    process.exit(1);
  }
  annotateFolder(target);
}
