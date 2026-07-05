const fs = require('node:fs');

// Backend coverage
const backendContent = fs.readFileSync('./coverage-backend/lcov.info', 'utf-8');
const backendLines = backendContent.split('\n');
let backendTotal = 0, backendCovered = 0;

for (let line of backendLines) {
  line = line.trim();
  if (line.startsWith('LF:')) {
    backendTotal += Number.parseInt(line.split(':')[1], 10) || 0;
  } else if (line.startsWith('LH:')) {
    backendCovered += Number.parseInt(line.split(':')[1], 10) || 0;
  }
}

const backendPct = backendTotal > 0 ? ((backendCovered / backendTotal) * 100).toFixed(2) : 0;

// Frontend coverage (if exists)
let frontendTotal = 0, frontendCovered = 0;
if (fs.existsSync('./coverage-frontend/lcov.info')) {
  const frontendContent = fs.readFileSync('./coverage-frontend/lcov.info', 'utf-8');
  const frontendLines = frontendContent.split('\n');
  
  for (let line of frontendLines) {
    line = line.trim();
    if (line.startsWith('LF:')) {
      frontendTotal += Number.parseInt(line.split(':')[1], 10) || 0;
    } else if (line.startsWith('LH:')) {
      frontendCovered += Number.parseInt(line.split(':')[1], 10) || 0;
    }
  }
}
const frontendPct = frontendTotal > 0 ? ((frontendCovered / frontendTotal) * 100).toFixed(2) : 0;

// Combined
const combinedTotal = backendTotal + frontendTotal;
const combinedCovered = backendCovered + frontendCovered;
const combinedPct = combinedTotal > 0 ? ((combinedCovered / combinedTotal) * 100).toFixed(2) : 0;

console.log('════════════════════════════════════════');
console.log('📊 CODE COVERAGE REPORT');
console.log('════════════════════════════════════════');
console.log('');
console.log('✅ BACKEND:');
console.log('   Lines: ' + backendCovered + ' / ' + backendTotal + ' = ' + backendPct + '%');
console.log('');
if (frontendTotal > 0) {
  console.log('✅ FRONTEND:');
  console.log('   Lines: ' + frontendCovered + ' / ' + frontendTotal + ' = ' + frontendPct + '%');
  console.log('');
}
console.log('📈 COMBINED:');
console.log('   Lines: ' + combinedCovered + ' / ' + combinedTotal + ' = ' + combinedPct + '%');
console.log('');
console.log('════════════════════════════════════════');
if (combinedPct >= 80) {
  console.log('✓ GOAL ACHIEVED: Coverage >= 80%');
} else {
  console.log('✗ NEEDS IMPROVEMENT: Coverage < 80%');
  console.log('  Need: ' + (80 - Number.parseFloat(combinedPct)).toFixed(2) + '% more');
}
console.log('════════════════════════════════════════');
