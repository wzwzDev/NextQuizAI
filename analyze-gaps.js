const fs = require('node:fs');

const content = fs.readFileSync('./coverage-backend/lcov.info', 'utf-8');
const files = content.split('end_of_record');
const coverage = [];

for (let file of files) {
  const lines = file.split('\n');
  let filePath = '';
  let branchesFound = 0, branchesTaken = 0;
  let statementsFound = 0, statementsTaken = 0;
  
  for (let line of lines) {
    if (line.startsWith('SF:')) {
      filePath = line.substring(3).trim();
    }
    if (line.startsWith('BRF:')) {
      branchesFound = Number.parseInt(line.substring(4), 10);
    }
    if (line.startsWith('BRH:')) {
      branchesTaken = Number.parseInt(line.substring(4), 10);
    }
    if (line.startsWith('SF:')) {
      statementsFound = Number.parseInt(line.substring(3), 10);
    }
    if (line.startsWith('SH:')) {
      statementsTaken = Number.parseInt(line.substring(3), 10);
    }
  }
  
  if (filePath) {
    const branchPct = branchesFound > 0 ? ((branchesTaken / branchesFound) * 100).toFixed(2) : -1;
    const linePct = statementsFound > 0 ? ((statementsTaken / statementsFound) * 100).toFixed(2) : -1;
    coverage.push({
      file: filePath,
      branches: { found: branchesFound, taken: branchesTaken, pct: Number.parseFloat(branchPct) },
      lines: { found: statementsFound, taken: statementsTaken, pct: Number.parseFloat(linePct) }
    });
  }
}

// Sort by lowest branch coverage (branches are the problem)
coverage.sort((a, b) => a.branches.pct - b.branches.pct);

console.log('');
console.log('🔴 FILES WITH LOWEST BRANCH COVERAGE:');
console.log('═'.repeat(100));

let fixable = 0;
for (let i = 0; i < Math.min(20, coverage.length); i++) {
  const c = coverage[i];
  if (c.branches.found > 0 && c.branches.pct < 70) {
    fixable++;
    const uncovered = c.branches.found - c.branches.taken;
    console.log(`${c.branches.pct.toFixed(2)}% (${c.branches.taken}/${c.branches.found} branches, need ${uncovered} more)`);
    console.log(`  ➜ ${c.file}`);
  }
}

console.log('');
console.log(`Found ${fixable} files with branch coverage < 70%`);
console.log('');
