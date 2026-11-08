// scripts/audit-contracts.js
const fs = require('fs');
const path = require('path');

const routesMd = fs.readFileSync(path.join(__dirname, '../docs/ROUTES.md'), 'utf8');

// Check queue names in ROUTES.md
console.log('--- QUEUES IN ROUTES.md ---');
const queueMatches = [...routesMd.matchAll(/Queue:\s*`?([a-zA-Z0-9_-]+)`?/g)].map(m => m[1]);
console.log('Unique queues in ROUTES.md:', [...new Set(queueMatches)]);

// Check queue names in server
console.log('--- QUEUES IN SERVER ---');
const serverQueueMatches = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|js)$/.test(f)) {
      const c = fs.readFileSync(p, 'utf8');
      const matches = [...c.matchAll(/registerQueue\(\{\s*name:\s*['"]([a-zA-Z0-9_-]+)['"]/g)].map(m => m[1]);
      const procMatches = [...c.matchAll(/@Processor\(['"]([a-zA-Z0-9_-]+)['"]/g)].map(m => m[1]);
      const injectMatches = [...c.matchAll(/@InjectQueue\(['"]([a-zA-Z0-9_-]+)['"]/g)].map(m => m[1]);
      serverQueueMatches.push(...matches, ...procMatches, ...injectMatches);
    }
  }
}
walk(path.join(__dirname, '../server/src'));
console.log('Unique queues in server:', [...new Set(serverQueueMatches)]);

// Check Socket Events in @slotly/contracts
const contractsIndex = fs.readFileSync(path.join(__dirname, '../packages/contracts/src/index.ts'), 'utf8');
const socketEventsMatch = contractsIndex.match(/export const SocketEvents = (\{[\s\S]*?\}) as const;/);
if (socketEventsMatch) {
  console.log('--- SocketEvents in contracts ---');
  console.log(socketEventsMatch[1]);
}
