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
  
  if (filePath && (linesFound > 0 || branchesFound > 0)) {
    const branchPct = branchesFound > 0 ? ((branchesTaken / branchesFound) * 100) : -1;
    const linePct = linesFound > 0 ? ((linesTaken / linesFound) * 100) : -1;
    coverage.push({
      file: filePath,
      branches: { found: branchesFound, taken: branchesTaken, pct: branchPct },
      lines: { found: linesFound, taken: linesTaken, pct: linePct }
    });
  }
}

// Calculate totals
let totalLines = 0, totalLinesCovered = 0;
let totalBranches = 0, totalBranchesCovered = 0;

coverage.forEach(c => {
  totalLines += c.lines.found;
  totalLinesCovered += c.lines.taken;
  totalBranches += c.branches.found;
  totalBranchesCovered += c.branches.taken;
});

const currentLinePct = ((totalLinesCovered / totalLines) * 100).toFixed(2);
const currentBranchPct = ((totalBranchesCovered / totalBranches) * 100).toFixed(2);

console.log('');
console.log('📊 CURRENT COVERAGE METRICS:');
console.log('═'.repeat(80));
console.log(`Lines:    ${totalLinesCovered} / ${totalLines} = ${currentLinePct}%`);
console.log(`Branches: ${totalBranchesCovered} / ${totalBranches} = ${currentBranchPct}%`);
console.log('');
console.log('To reach 80% (both metrics must be >= 80%):');

const linesToAdd = Math.ceil(totalLines * 0.8) - totalLinesCovered;
const branchesToAdd = Math.ceil(totalBranches * 0.8) - totalBranchesCovered;

console.log(`Need ${linesToAdd} more lines (${(linesToAdd/totalLines*100).toFixed(2)}%)`);
console.log(`Need ${branchesToAdd} more branches (${(branchesToAdd/totalBranches*100).toFixed(2)}%)`);
console.log('');

// Show files with most untested lines
const untested = coverage
  .filter(c => c.lines.pct >= 0 && c.lines.pct < 80)
  .map(c => ({
    ...c,
    untested: c.lines.found - c.lines.taken
  }))
  .sort((a, b) => b.untested - a.untested);

console.log('TOP FILES WITH UNTESTED LINES (< 80% coverage):');
console.log('═'.repeat(80));
untested.slice(0, 15).forEach(c => {
  console.log(`${c.lines.pct.toFixed(1)}% - ${c.untested} untested lines`);
  console.log(`    ${c.file.split('\\').pop()} (${c.lines.taken}/${c.lines.found})`);
});
