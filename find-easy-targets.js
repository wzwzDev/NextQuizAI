const fs = require('node:fs');
const data = fs.readFileSync('coverage-backend/lcov.info', 'utf8');
const lines = data.split('\n');
let current = { file: '', branches: 0, covered: 0 };
const files = {};

for (const line of lines) {
  if (line.startsWith('SF:')) {
    current.file = line.substring(3);
  } else if (line.startsWith('BRH:')) {
    current.branches = Number.parseInt(line.substring(4), 10);
  } else if (line.startsWith('BRF:')) {
    current.covered = Number.parseInt(line.substring(4), 10);
    if (current.branches > 0) {
      const pct = (current.covered / current.branches * 100).toFixed(1);
      if (pct >= 70 && pct < 80) {
        files[current.file] = { covered: current.covered, total: current.branches, pct: Number.parseFloat(pct) };
      }
    }
  }
}

console.log('FILES WITH 70-80% BRANCH COVERAGE (Best targets):');
console.log('==================================================');
Object.entries(files)
  .sort((a,b) => b[1].pct - a[1].pct)
  .slice(0, 15)
  .forEach(([file, info]) => {
    const uncovered = info.total - info.covered;
    console.log(`${info.pct.toFixed(1)}% (${uncovered} uncovered / ${info.total} total) - ${file}`);
  });
