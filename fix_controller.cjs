
const fs = require('fs');
const controllerPath = 'backend/controllers/scholarshipController.js';
let content = fs.readFileSync(controllerPath, 'utf8');
content = content.replace(/message: Stub for (\w+) }/g, 'message: \'Stub for ' + '' + '\' }');
fs.writeFileSync(controllerPath, content);
console.log('Fixed stubs!');

