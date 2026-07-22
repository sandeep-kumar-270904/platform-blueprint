const { executeCode } = require('./backend/services/codeExecutionService');

const code = `
function add(a, b) {
  return a + b;
}
`;

const testCases = [
  { input: '1, 2', expectedOutput: '3' },
  { input: '5, 5', expectedOutput: '10' }
];

console.log("Valid code:");
console.log(executeCode(code, testCases));

const infiniteLoopCode = `
function add(a, b) {
  while(true) {}
  return a + b;
}
`;

console.log("\nInfinite loop code:");
console.log(executeCode(infiniteLoopCode, testCases));
