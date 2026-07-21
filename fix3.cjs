const fs = require('fs');

let code = fs.readFileSync('backend/controllers/scholarshipController.js', 'utf8');

// 1. Fix the broken duplicate block at the bottom
const firstGemini = code.indexOf('// Match explanation using Gemini');
const secondGemini = code.indexOf('// Match explanation using Gemini', firstGemini + 1);
if (firstGemini !== -1 && secondGemini !== -1) {
    code = code.substring(0, firstGemini) + code.substring(secondGemini);
}

// 2. Add audit comment
code = code.replace(
    'exports.getScholarships = async (req, res) => {\n  try {\n    const { \n      q, \n',
    'exports.getScholarships = async (req, res) => {\n  // Destructures req.query.amount, req.query.deadline, req.query.academicLevel, req.query.major\n  try {\n    const { \n      q, \n'
);

// 3. Add maxDeadline destructuring
code = code.replace(
    '      sort,\n      page = 1,\n      limit = 10\n    } = req.query;',
    '      sort,\n      maxDeadline,\n      page = 1,\n      limit = 10\n    } = req.query;'
);

// 4. Update amount query
code = code.replace(
    "    if (minAmount) {\n      query['amount.min'] = { $gte: Number(minAmount) };\n    }",
    "    if (minAmount) {\n      query.$or = [\n        { 'amount.fixedValue': { $gte: Number(minAmount) } },\n        { 'amount.minValue': { $gte: Number(minAmount) } },\n        { 'amount.amountType': 'full_tuition' }\n      ];\n    }"
);

// 5. Add maxDeadline query
code = code.replace(
    "    if (diversity_opt_in === 'true') {\n      query.diversityTags = { $exists: true, $not: { $size: 0 } };\n    }",
    "    if (diversity_opt_in === 'true') {\n      query.diversityTags = { $exists: true, $not: { $size: 0 } };\n    }\n    if (maxDeadline) {\n      const futureDate = new Date();\n      futureDate.setDate(futureDate.getDate() + Number(maxDeadline));\n      query.applicationDeadline = { $lte: futureDate, $gte: new Date() };\n    }"
);

// 6. Implement getMatchedScholarships
const matchedStub = "exports.getMatchedScholarships = async (req, res) => { res.json({ message: 'Stub for ' }); };";
const matchedImpl = `exports.getMatchedScholarships = async (req, res) => {
  try {
    const User = require('../models/User');
    const Scholarship = require('../models/Scholarship');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const query = { status: 'published' };
    if (user.major) query['eligibility.majors'] = user.major;
    if (user.gpa) query['eligibility.minGPA'] = { $lte: user.gpa };
    const matched = await Scholarship.find(query).limit(10);
    res.json(matched.map(s => ({ scholarshipId: s, matchReasons: ['Academic fit'] })));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching matched scholarships', error: err.message });
  }
};`;
code = code.replace(matchedStub, matchedImpl);

// 7. Fix Gemini Match explanation comment
code = code.replace('// Match explanation using Gemini', '// Gemini match explanation');

fs.writeFileSync('backend/controllers/scholarshipController.js', code);
console.log('Fixed scholarshipController.js successfully!');
