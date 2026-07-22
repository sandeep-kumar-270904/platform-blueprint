const vm = require('vm');

/**
 * Safely executes untrusted JavaScript code against a set of test cases.
 * 
 * @param {string} code - The student's submitted code
 * @param {Array} testCases - Array of { input, expectedOutput } strings
 * @returns {Object} { totalTestCases, testCasesPassed, results: [{passed, actualOutput, expectedOutput, error}] }
 */
const executeCode = (code, testCases) => {
  const results = [];
  let testCasesPassed = 0;

  for (const tc of testCases) {
    const sandbox = {
      console: { log: () => {} }, // stub console to prevent spam
    };
    
    // We expect the student's code to be a function definition. 
    // To test it, we append an invocation using the test case input.
    // Assuming the test case input is valid JSON or arguments string, e.g., "5, 10" or "[1,2,3]"
    const executionWrapper = `
      ${code}
      
      // Attempt to find the function name if not explicitly provided, or assume a generic name.
      // Usually platforms require a specific function signature. For this MVP, we assume they define a function 
      // or we evaluate the last expression. If they use an arrow function, they must assign it.
      // A robust approach expects a specific function name. Since we don't have that guaranteed, we'll try to extract it 
      // or assume the code itself returns the result when evaluated.
      
      // Let's assume the code defines a function. We'll find the first function defined in the sandbox.
      const funcName = Object.keys(this).find(key => typeof this[key] === 'function');
      if(funcName) {
         this[funcName](${tc.input});
      } else {
         throw new Error("No function defined");
      }
    `;

    try {
      const script = new vm.Script(executionWrapper);
      const context = vm.createContext(sandbox);
      
      // Strict timeout to prevent infinite loops (2000ms)
      const actualOutput = script.runInContext(context, { timeout: 2000 });
      
      // Loose comparison for simplicity (ignoring type strictness on string vs number for MVP)
      const passed = String(actualOutput).trim() === String(tc.expectedOutput).trim();
      
      if (passed) testCasesPassed++;
      
      results.push({
        passed,
        actualOutput: String(actualOutput),
        expectedOutput: tc.expectedOutput
      });
    } catch (error) {
      // Handle execution timeout or syntax errors
      results.push({
        passed: false,
        error: error.message || 'Execution Error'
      });
    }
  }

  return {
    totalTestCases: testCases.length,
    testCasesPassed,
    results
  };
};

module.exports = {
  executeCode
};
