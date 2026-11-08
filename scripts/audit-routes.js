// scripts/audit-routes.js
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results = results.concat(walk(full));
    else if (file.endsWith('.controller.ts') || file.endsWith('.gateway.ts')) results.push(full);
  }
  return results;
}

const controllerFiles = walk(path.join(__dirname, '../server/src'));
const routeMap = [];

for (const file of controllerFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const rel = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');

  // get controller prefix
  const ctrlMatch = content.match(/@Controller\(['"]?(.*?)['"]?\)/);
  const prefix = ctrlMatch ? ctrlMatch[1] : '';

  // get gateway namespace
  const gwMatch = content.match(/@WebSocketGateway\(\{[\s\S]*?namespace:\s*['"](.*?)['"]/);
  const wsNamespace = gwMatch ? gwMatch[1] : '';

  let currentHttp = '';
  let currentPermissions = [];
  let isPublic = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('@Public(')) isPublic = true;
    const permMatch = line.match(/@RequirePermissions\((.*?)\)/);
    if (permMatch) {
      currentPermissions.push(permMatch[1].trim());
    }

    const httpMatch = line.match(/@(Get|Post|Put|Patch|Delete)\(['"]?(.*?)['"]?\)/);
    if (httpMatch) {
      const sub = httpMatch[2] ? httpMatch[2] : '';
      currentHttp = httpMatch[1].toUpperCase() + ' /' + [prefix, sub].filter(Boolean).join('/').replace(/\/+/g, '/');
    }

    const wsMatch = line.match(/@SubscribeMessage\(['"](.*?)['"]/);
    if (wsMatch) {
      currentHttp = 'WS ' + wsNamespace + ' ' + wsMatch[1];
    }

    const methodMatch = line.match(/^(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/);
    if (methodMatch && currentHttp && !line.startsWith('if') && !line.startsWith('for') && !line.startsWith('while') && !line.startsWith('switch')) {
      routeMap.push({
        endpoint: currentHttp,
        method: methodMatch[1],
        file: rel,
        line: i + 1,
        permissions: currentPermissions,
        isPublic
      });
      currentHttp = '';
      currentPermissions = [];
      isPublic = false;
    }
  }
}

console.log('Total routes found:', routeMap.length);
const unguarded = routeMap.filter(r => !r.isPublic && r.permissions.length === 0 && !r.endpoint.startsWith('WS'));
console.log('Endpoints without @RequirePermissions or @Public:', unguarded.length);
fs.writeFileSync(path.join(__dirname, 'audit-routes.json'), JSON.stringify({ total: routeMap.length, routes: routeMap, unguarded }, null, 2));
console.log('Saved to scripts/audit-routes.json');
