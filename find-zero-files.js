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
  
  if (filePath && linesFound > 0 && linesTaken === 0) {
    coverage.push({ 
      file: filePath, 
      lines: linesFound,
      branches: branchesFound,
      branchesTaken: branchesTaken
    });
  }
}

coverage.sort((a, b) => b.lines - a.lines);

console.log('');
console.log('🚫 FILES WITH 0% LINE COVERAGE (untested files):');
console.log('═'.repeat(100));

coverage.forEach(c => {
  console.log(`${c.lines} lines, ${c.branchesTaken}/${c.branches} branches - ${c.file}`);
});

console.log('');
console.log(`Total: ${coverage.length} files`);
console.log(`Total untested lines: ${coverage.reduce((sum, c) => sum + c.lines, 0)}`);
