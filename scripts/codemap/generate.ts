// Code map generator for Slotly monorepo extracting exports, signatures, and patterns.
import * as fs from 'fs';
import * as path from 'path';
import { Project, Node, SyntaxKind } from 'ts-morph';

export interface FileDoc {
  relativePath: string;
  purpose: string;
  entries: string[];
}

export function renderFileDoc(file: FileDoc): string {
  let content = `### \`${file.relativePath}\`\n`;
  content += `*${file.purpose}*\n\n`;
  if (file.entries.length > 0) {
    content += file.entries.join('\n') + '\n\n';
  } else {
    content += `*(No public exports)*\n\n`;
  }
  return content;
}

interface GroupConfig {
  id: string;
  title: string;
  filename: string;
  filter: (relPath: string) => boolean;
}

const GROUPS: GroupConfig[] = [
  {
    id: 'contracts',
    title: 'Shared Contracts',
    filename: 'contracts.md',
    filter: (p) => p.startsWith('packages/contracts/src/'),
  },
  {
    id: 'server-common',
    title: 'Server Common & Infrastructure',
    filename: 'server-common.md',
    filter: (p) => p.startsWith('server/src/common/'),
  },
  {
    id: 'server-auth',
    title: 'Server Auth Module',
    filename: 'server-auth.md',
    filter: (p) => p.startsWith('server/src/modules/auth/'),
  },
  {
    id: 'server-blueprint',
    title: 'Server Blueprint Module',
    filename: 'server-blueprint.md',
    filter: (p) => p.startsWith('server/src/modules/blueprint/'),
  },
  {
    id: 'server-builds',
    title: 'Server Builds Module',
    filename: 'server-builds.md',
    filter: (p) => p.startsWith('server/src/modules/builds/'),
  },
  {
    id: 'server-engine',
    title: 'Server Engine Module',
    filename: 'server-engine.md',
    filter: (p) => p.startsWith('server/src/modules/engine/'),
  },
  {
    id: 'server-institutions',
    title: 'Server Institutions Module',
    filename: 'server-institutions.md',
    filter: (p) => p.startsWith('server/src/modules/institutions/'),
  },
  {
    id: 'server-library',
    title: 'Server Library Module',
    filename: 'server-library.md',
    filter: (p) => p.startsWith('server/src/modules/library/'),
  },
  {
    id: 'client-app',
    title: 'Client App Routes',
    filename: 'client-app.md',
    filter: (p) => p.startsWith('client/src/app/'),
  },
  {
    id: 'client-auth',
    title: 'Client Auth Feature',
    filename: 'client-auth.md',
    filter: (p) => p.startsWith('client/src/features/auth/'),
  },
  {
    id: 'client-blueprint',
    title: 'Client Blueprint Feature',
    filename: 'client-blueprint.md',
    filter: (p) => p.startsWith('client/src/features/blueprint/'),
  },
  {
    id: 'client-builds',
    title: 'Client Builds Feature',
    filename: 'client-builds.md',
    filter: (p) => p.startsWith('client/src/features/builds/'),
  },
  {
    id: 'client-institution',
    title: 'Client Institution Feature',
    filename: 'client-institution.md',
    filter: (p) => p.startsWith('client/src/features/institution/'),
  },
  {
    id: 'client-library',
    title: 'Client Library Feature',
    filename: 'client-library.md',
    filter: (p) => p.startsWith('client/src/features/library/'),
  },
  {
    id: 'client-projects',
    title: 'Client Projects Feature',
    filename: 'client-projects.md',
    filter: (p) => p.startsWith('client/src/features/projects/'),
  },
  {
    id: 'client-shared',
    title: 'Client Shared Components & Lib',
    filename: 'client-shared.md',
    filter: (p) =>
      p.startsWith('client/src/components/') || p.startsWith('client/src/lib/'),
  },
];

const ROOT_DIR = path.resolve(__dirname, '../../');

function toForwardSlash(p: string): string {
  return p.replace(/\\/g, '/');
}

function getFilePurpose(sourceFile: import('ts-morph').SourceFile): string {
  const fullText = sourceFile.getFullText();
  const leadingComments = sourceFile.getLeadingCommentRanges();

  if (leadingComments && leadingComments.length > 0) {
    const firstComment = leadingComments[0].getText(fullText);
    const cleaned = firstComment
      .replace(/^\/\/\s*/, '')
      .replace(/^\/\*+\s*/, '')
      .replace(/\*\/$/, '')
      .split('\n')[0]
      .trim();
    if (cleaned && !cleaned.startsWith('eslint-') && !cleaned.startsWith('@ts-')) {
      return cleaned;
    }
  }

  // Fallback: check first line
  const lines = fullText.split('\n');
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') && !trimmed.startsWith('///')) {
      const c = trimmed.replace(/^\/\/\s*/, '').trim();
      if (c && !c.startsWith('eslint-') && !c.startsWith('@ts-')) {
        return c;
      }
    }
  }

  return '(no description)';
}

function getFirstJSDocLine(node: Node): string {
  if (Node.isJSDocable(node)) {
    const jsDocs = node.getJsDocs();
    if (jsDocs.length > 0) {
      const comment = jsDocs[0].getComment();
      if (typeof comment === 'string') {
        return comment.split('\n')[0].trim();
      }
      if (Array.isArray(comment)) {
        return comment.map((c) => c.getText()).join('').split('\n')[0].trim();
      }
    }
  }
  return '';
}

function hasInternalTag(node: Node): boolean {
  if (Node.isJSDocable(node)) {
    for (const doc of node.getJsDocs()) {
      for (const tag of doc.getTags()) {
        if (tag.getTagName() === 'internal') {
          return true;
        }
      }
    }
  }
  return false;
}

export function processSourceFile(
  sourceFile: import('ts-morph').SourceFile,
  relPath: string,
  exportedSymbolsSet: Set<string>,
): FileDoc {
  const purpose = getFilePurpose(sourceFile);
  const entries: string[] = [];

  // Special Handling: Next.js App route files
  if (relPath.startsWith('client/src/app/')) {
    const appSubPath = relPath.replace('client/src/app/', '');
    const parts = appSubPath.split('/');
    const fileName = parts.pop() || '';
    const folderPath = parts.join('/');

    // Derive Route URL
    const routeParts = parts
      .filter((p) => !p.startsWith('(') || !p.endsWith(')')) // strip route groups
      .map((p) => (p.startsWith('@') ? `slot:${p}` : p)); // show slots

    const routeUrl = '/' + routeParts.join('/');

    const defaultExport = sourceFile.getDefaultExportSymbol();
    const defaultExportName = defaultExport ? defaultExport.getName() : '';

    if (fileName === 'page.tsx' || fileName === 'page.ts') {
      entries.push(
        `- **Route Page:** \`${routeUrl}\` -> renders \`${defaultExportName || 'Page'}\``,
      );
    } else if (fileName === 'layout.tsx' || fileName === 'layout.ts') {
      entries.push(
        `- **Layout:** \`${routeUrl}\` -> renders \`${defaultExportName || 'Layout'}\``,
      );
    } else if (fileName === 'loading.tsx' || fileName === 'loading.ts') {
      entries.push(
        `- **Loading Boundary:** \`${routeUrl}\` -> renders \`${defaultExportName || 'Loading'}\``,
      );
    } else if (fileName === 'error.tsx' || fileName === 'error.ts') {
      entries.push(
        `- **Error Boundary:** \`${routeUrl}\` -> renders \`${defaultExportName || 'Error'}\``,
      );
    } else if (fileName === 'route.ts' || fileName === 'route.tsx') {
      entries.push(`- **API Route:** \`${routeUrl}\``);
    }
  }

  // 1. Classes
  for (const cls of sourceFile.getClasses()) {
    if (!cls.isExported() || hasInternalTag(cls)) continue;
    const name = cls.getName() || 'AnonymousClass';
    exportedSymbolsSet.add(name);
    const jsDoc = getFirstJSDocLine(cls);

    // Pattern 1: NestJS Controller
    const controllerDec = cls.getDecorator('Controller');
    if (controllerDec) {
      let basePath = '';
      const args = controllerDec.getArguments();
      if (args.length > 0) {
        basePath = args[0].getText().replace(/['"]/g, '');
      }
      entries.push(`- **Controller** \`${name}\` (base: \`/${basePath.replace(/^\//, '')}\`)${jsDoc ? ` - ${jsDoc}` : ''}`);

      for (const method of cls.getMethods()) {
        const httpDec = method.getDecorators().find((d) =>
          ['Get', 'Post', 'Put', 'Patch', 'Delete'].includes(d.getName()),
        );
        if (httpDec) {
          const verb = httpDec.getName().toUpperCase();
          const subArgs = httpDec.getArguments();
          const subPath = subArgs.length > 0 ? subArgs[0].getText().replace(/['"]/g, '') : '';
          const fullRoute = `/${basePath}/${subPath}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

          const reqPerms = method.getDecorator('RequirePermissions');
          const guards = method.getDecorator('UseGuards');
          const isPublic = method.getDecorator('Public') || cls.getDecorator('Public');
          const meta: string[] = [];
          if (isPublic) meta.push('public');
          if (reqPerms) meta.push(`perm: ${reqPerms.getArguments().map((a) => a.getText()).join(', ')}`);
          if (guards) meta.push(`guards: ${guards.getArguments().map((a) => a.getText()).join(', ')}`);

          const metaStr = meta.length > 0 ? ` [${meta.join('; ')}]` : '';
          entries.push(`  - \`${verb} ${fullRoute}\` -> \`${method.getName()}()\`` + metaStr);
        }
      }
      continue;
    }

    // Pattern 2: WebSocket Gateway
    const gatewayDec = cls.getDecorator('WebSocketGateway');
    if (gatewayDec) {
      let ns = '';
      const text = gatewayDec.getText();
      const match = text.match(/namespace:\s*['"]([^'"]+)['"]/);
      if (match) ns = match[1];
      entries.push(`- **Gateway** \`${name}\` (namespace: \`${ns}\`)${jsDoc ? ` - ${jsDoc}` : ''}`);

      for (const method of cls.getMethods()) {
        const subMsg = method.getDecorator('SubscribeMessage');
        if (subMsg) {
          const evt = subMsg.getArguments()[0]?.getText().replace(/['"]/g, '') || '';
          entries.push(`  - \`${ns}: ${evt}\` -> \`${method.getName()}()\``);
        }
      }
      continue;
    }

    // Pattern 3: Queue Processor
    const procDec = cls.getDecorator('Processor');
    if (procDec) {
      const qName = procDec.getArguments()[0]?.getText().replace(/['"]/g, '') || '';
      entries.push(`- **Queue Processor** \`${name}\` (queue: \`${qName}\`)${jsDoc ? ` - ${jsDoc}` : ''}`);

      for (const method of cls.getMethods()) {
        const procMethod = method.getDecorator('Process');
        if (procMethod) {
          const jobName = procMethod.getArguments()[0]?.getText().replace(/['"]/g, '') || '*';
          entries.push(`  - \`${qName}: ${jobName}\` -> \`${name}.${method.getName()}()\``);
        } else if (method.getName() === 'process') {
          entries.push(`  - \`${qName}: *\` -> \`${name}.process()\``);
        }
      }
      continue;
    }

    // Pattern 4: Mongoose Schema
    const schemaDec = cls.getDecorator('Schema');
    if (schemaDec) {
      const collMatch = schemaDec.getText().match(/collection:\s*['"]([^'"]+)['"]/);
      const coll = collMatch ? collMatch[1] : name.toLowerCase();
      const indexedProps: string[] = [];
      for (const prop of cls.getProperties()) {
        const pDec = prop.getDecorator('Prop');
        if (pDec && /index:\s*true|unique:\s*true/.test(pDec.getText())) {
          indexedProps.push(prop.getName());
        }
      }
      const idxStr = indexedProps.length > 0 ? ` (indexes: ${indexedProps.join(', ')})` : '';
      entries.push(`- **Mongoose Schema** \`${name}\` (collection: \`${coll}\`${idxStr})${jsDoc ? ` - ${jsDoc}` : ''}`);
      continue;
    }

    // Pattern 5: Injectable service / repository
    const injectableDec = cls.getDecorator('Injectable');
    if (injectableDec) {
      const impl = cls.getImplements().map((i) => i.getText()).join(', ');
      const ctor = cls.getConstructors()[0];
      const deps = ctor
        ? ctor.getParameters().map((p) => {
            const dec = p.getDecorator('Inject');
            const token = dec ? dec.getArguments()[0]?.getText() : '';
            return token ? `@Inject(${token})` : p.getType().getText().split('.').pop() || p.getName();
          }).join(', ')
        : '';
      const implStr = impl ? ` implements \`${impl}\`` : '';
      const depsStr = deps ? ` (deps: ${deps})` : '';
      entries.push(`- **Injectable** \`${name}\`${implStr}${depsStr}${jsDoc ? ` - ${jsDoc}` : ''}`);
      continue;
    }

    // Standard Class
    const implementsClause = cls.getImplements().map((i) => i.getText()).join(', ');
    const implStr = implementsClause ? ` implements \`${implementsClause}\`` : '';
    entries.push(`- **Class** \`${name}\`${implStr}${jsDoc ? ` - ${jsDoc}` : ''}`);
  }

  // 2. Interfaces
  for (const iface of sourceFile.getInterfaces()) {
    if (!iface.isExported() || hasInternalTag(iface)) continue;
    const name = iface.getName();
    exportedSymbolsSet.add(name);
    const jsDoc = getFirstJSDocLine(iface);
    const extendsClause = iface.getExtends().map((e) => e.getText()).join(', ');
    const extStr = extendsClause ? ` extends \`${extendsClause}\`` : '';
    entries.push(`- **Interface** \`${name}\`${extStr}${jsDoc ? ` - ${jsDoc}` : ''}`);
  }

  // 3. Type Aliases
  for (const typeAlias of sourceFile.getTypeAliases()) {
    if (!typeAlias.isExported() || hasInternalTag(typeAlias)) continue;
    const name = typeAlias.getName();
    exportedSymbolsSet.add(name);
    const jsDoc = getFirstJSDocLine(typeAlias);
    entries.push(`- **Type** \`${name}\`${jsDoc ? ` - ${jsDoc}` : ''}`);
  }

  // 4. Functions (including React Components and Hooks)
  for (const fn of sourceFile.getFunctions()) {
    if (!fn.isExported() || hasInternalTag(fn)) continue;
    const name = fn.getName() || 'anonymous';
    exportedSymbolsSet.add(name);
    const jsDoc = getFirstJSDocLine(fn);
    const params = fn.getParameters().map((p) => `${p.getName()}: ${p.getType().getText()}`).join(', ');
    const returnType = fn.getReturnType().getText();

    if (name.startsWith('use')) {
      entries.push(`- **Hook** \`${name}(${params})\`: \`${returnType}\`${jsDoc ? ` - ${jsDoc}` : ''}`);
    } else if (/^[A-Z]/.test(name)) {
      entries.push(`- **Component** \`${name}(${params})\`${jsDoc ? ` - ${jsDoc}` : ''}`);
    } else {
      entries.push(`- **Function** \`${name}(${params})\`: \`${returnType}\`${jsDoc ? ` - ${jsDoc}` : ''}`);
    }
  }

  // 5. Variable Statements (Constants, Zod Schemas, Zustand Stores, Arrows)
  for (const vs of sourceFile.getVariableStatements()) {
    if (!vs.isExported() || hasInternalTag(vs)) continue;
    const jsDoc = getFirstJSDocLine(vs);

    for (const decl of vs.getDeclarations()) {
      const name = decl.getName();
      exportedSymbolsSet.add(name);
      const initText = decl.getInitializer()?.getText() || '';
      const typeText = decl.getType().getText();

      // Pattern: Zod Schema
      if (name.endsWith('Schema') || initText.startsWith('z.') || typeText.startsWith('z.')) {
        // Look for corresponding inferred DTO type
        const inferredTypeName = name.replace(/Schema$/, '');
        entries.push(`- **Zod Schema** \`${name}\` -> \`${inferredTypeName}\`${jsDoc ? ` - ${jsDoc}` : ''}`);
      }
      // Pattern: Zustand Store
      else if (initText.includes('create<') || initText.includes('create(')) {
        const actionNames: string[] = [];
        const objLiterals = decl.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);
        for (const obj of objLiterals) {
          for (const prop of obj.getProperties()) {
            if (Node.isPropertyAssignment(prop)) {
              const pInit = prop.getInitializer();
              if (pInit && (Node.isArrowFunction(pInit) || Node.isFunctionExpression(pInit))) {
                actionNames.push(prop.getName());
              }
            } else if (Node.isMethodDeclaration(prop)) {
              actionNames.push(prop.getName());
            }
          }
        }
        const actionsStr =
          actionNames.length > 0
            ? ` (actions: ${actionNames.slice(0, 8).join(', ')}${actionNames.length > 8 ? ', ...' : ''})`
            : '';
        entries.push(`- **Zustand Store** \`${name}\`${actionsStr}${jsDoc ? ` - ${jsDoc}` : ''}`);
      }
      // Pattern: Component or Hook written as arrow function
      else if (name.startsWith('use') && (initText.startsWith('(') || initText.startsWith('async'))) {
        const arrow = decl.getInitializerIfKind(SyntaxKind.ArrowFunction);
        const params = arrow
          ? arrow.getParameters().map((p) => `${p.getName()}: ${p.getType().getText()}`).join(', ')
          : '';
        const returnType = arrow ? arrow.getReturnType().getText() : 'unknown';
        entries.push(`- **Hook** \`${name}(${params})\`: \`${returnType}\`${jsDoc ? ` - ${jsDoc}` : ''}`);
      } else if (/^[A-Z]/.test(name) && (initText.startsWith('(') || initText.startsWith('React.memo') || initText.startsWith('memo'))) {
        const arrow = decl.getInitializerIfKind(SyntaxKind.ArrowFunction);
        const params = arrow
          ? arrow.getParameters().map((p) => `${p.getName()}: ${p.getType().getText()}`).join(', ')
          : '';
        entries.push(`- **Component** \`${name}(${params})\`${jsDoc ? ` - ${jsDoc}` : ''}`);
      }
      // Standard Constant
      else {
        const trimmedType = typeText.length > 50 ? typeText.slice(0, 47) + '...' : typeText;
        entries.push(`- **Const** \`${name}\`: \`${trimmedType}\`${jsDoc ? ` - ${jsDoc}` : ''}`);
      }
    }
  }

  return {
    relativePath: relPath,
    purpose,
    entries,
  };
}

export async function generateCodeMaps(isCheckMode: boolean = false): Promise<void> {
  console.log(`[codemap] Initializing ts-morph project...`);
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  const globs = [
    'packages/contracts/src/**/*.ts',
    'server/src/**/*.ts',
    'client/src/**/*.ts',
    'client/src/**/*.tsx',
  ];

  const filesToAdd: string[] = [];
  for (const g of globs) {
    const fullPattern = path.join(ROOT_DIR, g);
    filesToAdd.push(fullPattern);
  }

  project.addSourceFilesAtPaths(filesToAdd);

  const sourceFiles = project.getSourceFiles().filter((sf) => {
    const fp = toForwardSlash(sf.getFilePath());
    return (
      !fp.includes('.spec.') &&
      !fp.includes('.test.') &&
      !fp.includes('__tests__') &&
      !fp.includes('/tests/') &&
      !fp.endsWith('.d.ts') &&
      !fp.includes('node_modules')
    );
  });

  console.log(`[codemap] Found ${sourceFiles.length} source files to map.`);

  // Sort source files deterministically by relative path
  sourceFiles.sort((a, b) => {
    const pA = toForwardSlash(path.relative(ROOT_DIR, a.getFilePath()));
    const pB = toForwardSlash(path.relative(ROOT_DIR, b.getFilePath()));
    return pA.localeCompare(pB);
  });

  const exportedSymbolsSet = new Set<string>();
  const fileDocs: FileDoc[] = [];
  let noDescriptionCount = 0;

  for (const sf of sourceFiles) {
    const relPath = toForwardSlash(path.relative(ROOT_DIR, sf.getFilePath()));
    const doc = processSourceFile(sf, relPath, exportedSymbolsSet);
    fileDocs.push(doc);
    if (doc.purpose === '(no description)') {
      noDescriptionCount++;
    }
  }

  console.log(`[codemap] Extracted ${exportedSymbolsSet.size} exported symbols.`);
  console.log(`[codemap] Files without header purpose: ${noDescriptionCount}`);

  // Generate Group markdown files
  const generatedOutputs = new Map<string, string>();
  const groupStats: { filename: string; title: string; lineCount: number }[] = [];

  for (const group of GROUPS) {
    const groupFiles = fileDocs.filter((f) => group.filter(f.relativePath));
    let content = `# ${group.title} Code Map\n\n`;

    for (const file of groupFiles) {
      content += `### \`${file.relativePath}\`\n`;
      content += `*${file.purpose}*\n\n`;
      if (file.entries.length > 0) {
        content += file.entries.join('\n') + '\n\n';
      } else {
        content += `*(No public exports)*\n\n`;
      }
    }

    const normalizedContent = content.replace(/\r\n/g, '\n');
    generatedOutputs.set(group.filename, normalizedContent);

    const lineCount = normalizedContent.split('\n').length;
    groupStats.push({
      filename: group.filename,
      title: group.title,
      lineCount,
    });
  }

  // Update docs/CODEMAP.md generated section
  const codemapPath = path.join(ROOT_DIR, 'docs/CODEMAP.md');
  const existingCodemap = fs.readFileSync(codemapPath, 'utf8');

  let table = '| Module Map | Area | Line count |\n| :--- | :--- | :--- |\n';
  for (const stat of groupStats) {
    table += `| [${stat.filename}](docs/codemap/${stat.filename}) | ${stat.title} | ${stat.lineCount} lines |\n`;
  }

  const generatedSection = `<!-- GENERATED:START -->\n${table}<!-- GENERATED:END -->`;
  const updatedCodemap = existingCodemap.replace(
    /<!-- GENERATED:START -->[\s\S]*?<!-- GENERATED:END -->/,
    generatedSection,
  ).replace(/\r\n/g, '\n');

  // Link Check: Verify MANUAL section in docs/CODEMAP.md
  console.log(`[codemap] Running link and symbol verification on docs/CODEMAP.md...`);
  const manualMatch = existingCodemap.match(/<!-- MANUAL:START -->([\s\S]*?)<!-- MANUAL:END -->/);
  const brokenLinks: string[] = [];
  const brokenSymbols: string[] = [];

  if (manualMatch) {
    const manualContent = manualMatch[1];
    const lines = manualContent.split('\n');
    let currentTable: 'reuse' | 'extension' | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('## Reuse First')) {
        currentTable = 'reuse';
        continue;
      }
      if (trimmed.startsWith('## Extension Points')) {
        currentTable = 'extension';
        continue;
      }
      if (trimmed.startsWith('## ')) {
        currentTable = null;
        continue;
      }

      if (trimmed.startsWith('|') && !trimmed.includes('---')) {
        const cells = trimmed
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        if (cells.length === 0 || cells[0].toLowerCase().includes('task') || cells[0].toLowerCase().includes('registry')) {
          continue; // header row
        }

        if (currentTable === 'reuse' && cells.length >= 3) {
          // cells[1]: Thing to use
          const symbolMatches = cells[1].match(/`([^`]+)`/g) || [];
          for (const sm of symbolMatches) {
            const rawId = sm.replace(/`/g, '');
            const baseId = rawId.split('.')[0].trim();
            if (!exportedSymbolsSet.has(baseId)) {
              brokenSymbols.push(`${baseId} (referenced as \`${rawId}\` in Reuse First)`);
            }
          }
          // cells[2]: File path
          const pathMatches = cells[2].match(/`([^`]+)`/g) || [];
          for (const pm of pathMatches) {
            const cleanPath = pm.replace(/`/g, '').trim();
            const full = path.join(ROOT_DIR, cleanPath);
            if (!fs.existsSync(full)) {
              brokenLinks.push(`${cleanPath} (in Reuse First)`);
            }
          }
        } else if (currentTable === 'extension' && cells.length >= 4) {
          // cells[1]: Where it lives (file or dir path)
          const whereMatches = cells[1].match(/`([^`]+)`/g) || [];
          for (const wm of whereMatches) {
            const cleanPath = wm.replace(/`/g, '').trim();
            const full = path.join(ROOT_DIR, cleanPath);
            if (!fs.existsSync(full)) {
              brokenLinks.push(`${cleanPath} (in Extension Points 'Where it lives')`);
            }
          }
          // cells[2]: Interface to implement
          const ifaceMatches = cells[2].match(/`([^`]+)`/g) || [];
          for (const im of ifaceMatches) {
            const rawId = im.replace(/`/g, '').trim();
            const baseId = rawId.split('.')[0].trim();
            if (!exportedSymbolsSet.has(baseId)) {
              brokenSymbols.push(`${baseId} (in Extension Points 'Interface to implement')`);
            }
          }
          // cells[3]: Test to copy
          const testMatches = cells[3].match(/`([^`]+)`/g) || [];
          for (const tm of testMatches) {
            const cleanPath = tm.replace(/`/g, '').trim();
            const full = path.join(ROOT_DIR, cleanPath);
            if (!fs.existsSync(full)) {
              brokenLinks.push(`${cleanPath} (in Extension Points 'Test to copy')`);
            }
          }
        }
      }
    }
  }

  if (brokenLinks.length > 0) {
    console.error(`[codemap:error] Broken file paths in docs/CODEMAP.md:`);
    for (const bl of brokenLinks) {
      console.error(`  - ${bl}`);
    }
  }

  if (brokenSymbols.length > 0) {
    console.error(`[codemap:error] Unresolved exported identifiers in docs/CODEMAP.md:`);
    for (const bs of brokenSymbols) {
      console.error(`  - \`${bs}\``);
    }
  }

  if (brokenLinks.length > 0 || brokenSymbols.length > 0) {
    if (isCheckMode) {
      process.exit(1);
    }
  }

  // Check Mode diff verification
  if (isCheckMode) {
    console.log(`[codemap:check] Verifying on-disk maps against generated memory...`);
    let hasDiff = false;

    // Check CODEMAP.md
    if (existingCodemap.replace(/\r\n/g, '\n') !== updatedCodemap) {
      console.error(`[codemap:check] Difference detected in docs/CODEMAP.md! Run 'pnpm codemap' to update.`);
      hasDiff = true;
    }

    // Check individual files in docs/codemap/
    for (const [filename, content] of generatedOutputs) {
      const filePath = path.join(ROOT_DIR, 'docs/codemap', filename);
      if (!fs.existsSync(filePath)) {
        console.error(`[codemap:check] Missing file: docs/codemap/${filename}`);
        hasDiff = true;
        continue;
      }
      const diskContent = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
      if (diskContent !== content) {
        console.error(`[codemap:check] Outdated map content: docs/codemap/${filename}`);
        hasDiff = true;
      }
    }

    if (hasDiff) {
      console.error(`\n[codemap:check] Verification failed! Maps on disk are out of date.`);
      process.exit(1);
    }

    console.log(`[codemap:check] All maps and references verified cleanly!`);
    return;
  }

  // Write Mode
  console.log(`[codemap] Writing generated maps to docs/codemap/...`);
  const codemapDir = path.join(ROOT_DIR, 'docs/codemap');
  if (!fs.existsSync(codemapDir)) {
    fs.mkdirSync(codemapDir, { recursive: true });
  }

  for (const [filename, content] of generatedOutputs) {
    const filePath = path.join(codemapDir, filename);
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  }

  fs.writeFileSync(codemapPath, updatedCodemap, { encoding: 'utf8' });
  console.log(`[codemap] Successfully generated all 16 codemap files and updated docs/CODEMAP.md!`);
}

// CLI Execution entry
const isDirectCli =
  require.main === module ||
  (process.argv[1] &&
    path.basename(process.argv[1]).replace(/\.[^.]+$/, '') === 'generate');

if (isDirectCli) {
  const isCheck = process.argv.includes('--check');
  generateCodeMaps(isCheck).catch((err) => {
    console.error(`[codemap:fatal]`, err);
    process.exit(1);
  });
}
