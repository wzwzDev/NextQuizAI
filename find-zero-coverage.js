const fs = require('node:fs');

const content = fs.readFileSync('./coverage-backend/lcov.info', 'utf-8');
const files = content.split('end_of_record');
const coverage = [];

for (let file of files) {
  const lines = file.split('\n');
  let filePath = '';
  let branchesFound = 0, branchesTaken = 0;
  let linesFound = 0, linesTaken = 0;
  
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
      linesFound = Number.parseInt(line.substring(3), 10) || 0;
    }
    if (line.startsWith('LH:')) {
      linesTaken = Number.parseInt(line.substring(3), 10) || 0;
    }
  }
  
  if (filePath) {
    const branchPct = branchesFound > 0 ? ((branchesTaken / branchesFound) * 100) : -1;
    const linePct = linesFound > 0 ? ((linesTaken / linesFound) * 100) : -1;
    coverage.push({
      file: filePath,
      branches: { found: branchesFound, taken: branchesTaken, pct: branchPct },
      lines: { found: linesFound, taken: linesTaken, pct: linePct }
    });
  }
}

// Get files with 0 branch coverage and significant number of branches
const zeroCoverage = coverage.filter(c => c.branches.found > 0 && c.branches.pct === 0).sort((a, b) => b.branches.found - a.branches.found);

console.log('');
console.log('⚠️  FILES WITH 0% BRANCH COVERAGE (potentially easy to fix):');
console.log('═'.repeat(100));

let totalBranchesToGain = 0;
zeroCoverage.forEach(c => {
  totalBranchesToGain += c.branches.found;
  console.log(`${c.branches.found} uncovered branches - ${c.file.split('\\').pop()}`);
  console.log(`   Full path: ${c.file}`);
  console.log('');
});

console.log('═'.repeat(100));
console.log(`Total branches available from these files: ${totalBranchesToGain}`);
console.log(`Current total branches: 1119 / 1604`);
const newTotal = 1119 + totalBranchesToGain;
const newBranchPct = ((newTotal / 1604) * 100).toFixed(2);
console.log(`If we cover all these: ${newTotal} / 1604 = ${newBranchPct}%`);
console.log('');
