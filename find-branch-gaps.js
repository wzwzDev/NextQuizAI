const fs = require('node:fs');

const content = fs.readFileSync('./coverage-backend/lcov.info', 'utf-8');
const files = content.split('end_of_record');
const coverage = [];

for (let file of files) {
  const lines = file.split('\n');
  let filePath = '';
  let branchesFound = 0, branchesTaken = 0;
  
  for (let line of lines) {
    if (line.startsWith('SF:')) {
      filePath = line.substring(3).trim();
    }
    if (line.startsWith('BRF:')) {
      branchesFound = Number.parseInt(line.substring(4), 10) || 0;
    }
    if (line.startsWith('BRH:')) {
      branchesTaken = Number.parseInt(line.substring(4), 10) || 0;
    }
    if (line.startsWith('LF:')) {
      // Lines found (not used in this analysis)
    }
    if (line.startsWith('LH:')) {
      // Lines hit (not used in this analysis)
    }
  }
  
  if (filePath && branchesFound > 0) {
    const branchPct = ((branchesTaken / branchesFound) * 100);
    const uncovered = branchesFound - branchesTaken;
    if (uncovered > 0) {
      coverage.push({
        file: filePath,
        branches: { found: branchesFound, taken: branchesTaken, pct: branchPct, uncovered }
      });
    }
  }
}

// Sort by most uncovered branches
coverage.sort((a, b) => b.branches.uncovered - a.branches.uncovered);

console.log('');
console.log('🌳 FILES WITH MOST UNCOVERED BRANCHES:');
console.log('═'.repeat(100));

let total = 0;
coverage.slice(0, 20).forEach(c => {
  total += c.branches.uncovered;
  console.log(`${c.branches.uncovered} uncovered (${c.branches.pct.toFixed(1)}% - ${c.branches.taken}/${c.branches.found})`);
  console.log(`   ${c.file.split('\\').pop()} ← ${c.file}`);
});

console.log('');
console.log(`Top 20 total uncovered branches: ${total}`);
