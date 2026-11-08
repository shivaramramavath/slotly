// scripts/audit-guards.js
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

const files = walk(path.join(__dirname, '../server/src'));
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
  const classMatch = content.match(/@Controller\((.*?)\)\s*(?:@[\w()]+\s*)*export class (\w+)/);
  const useGuardsMatches = [...content.matchAll(/@UseGuards\((.*?)\)/g)].map(m => m[1]);
  console.log(`${rel}: UseGuards = [${useGuardsMatches.join(', ')}]`);
}
