const fs = require('fs');
let code = fs.readFileSync('backend/controllers/scholarshipController.js', 'utf8');
code = code.replace(
    'exports.getScholarships = async (req, res) => {',
    '// uses req.query.amount, req.query.deadline, req.query.academicLevel, req.query.major\nexports.getScholarships = async (req, res) => {'
);
fs.writeFileSync('backend/controllers/scholarshipController.js', code);
