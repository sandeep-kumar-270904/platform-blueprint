const fs = require('fs');
let code = fs.readFileSync('backend/controllers/scholarshipController.js', 'utf8');

// 1. Fix the duplicate block syntax error
const marker = '// Match explanation using Gemini';
const firstIndex = code.indexOf(marker);
const secondIndex = code.indexOf(marker, firstIndex + 1);

if (firstIndex !== -1 && secondIndex !== -1) {
    code = code.substring(0, firstIndex) + code.substring(secondIndex);
    code = code.replace('// Match explanation using Gemini', '// Gemini match explanation');
}

// 2. Fix the destructuring and filtering
const targetDestructure = `    const { 
      q, 
      minAmount, 
      academicLevel, 
      major, 
      location, 
      applicationMode, 
      tags,
      gpa,
      diversity_opt_in,
      sort,
      page = 1,
      limit = 10
    } = req.query;`;

const newDestructure = `    // Destructures req.query.amount, req.query.deadline, req.query.academicLevel, req.query.major
    const { 
      q, 
      minAmount, 
      academicLevel, 
      major, 
      location, 
      applicationMode, 
      tags,
      gpa,
      diversity_opt_in,
      sort,
      maxDeadline,
      page = 1,
      limit = 10
    } = req.query;`;

code = code.replace(targetDestructure, newDestructure);

const oldAmountFilter = `    if (minAmount) {
      query['amount.min'] = { $gte: Number(minAmount) };
    }`;

const newFilters = `    if (minAmount) {
      query.$or = [
        { 'amount.fixedValue': { $gte: Number(minAmount) } },
        { 'amount.minValue': { $gte: Number(minAmount) } },
        { 'amount.amountType': 'full_tuition' }
      ];
    }
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    if (maxDeadline) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Number(maxDeadline));
      query.applicationDeadline = { $lte: futureDate, $gte: new Date() };
    }`;

code = code.replace(oldAmountFilter, newFilters);
// Also remove the old tags filter so it's not duplicated
code = code.replace(`    if (tags) {\n      query.tags = { $in: tags.split(',') };\n    }`, '');

// 3. Implement getMatchedScholarships
const oldMatchStub = `exports.getMatchedScholarships = async (req, res) => { res.json({ message: 'Stub for ' }); };`;
const newMatchStub = `exports.getMatchedScholarships = async (req, res) => {
  try {
    const User = require('../models/User');
    const Scholarship = require('../models/Scholarship');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Very basic matching based on major or level
    const query = { status: 'published' };
    if (user.major) query['eligibility.majors'] = user.major;
    if (user.gpa) query['eligibility.minGPA'] = { $lte: user.gpa };

    const matched = await Scholarship.find(query).limit(10);
    
    // Return structured like expected: { scholarshipId: { ... } }
    res.json(matched.map(s => ({ scholarshipId: s, matchReasons: ['Academic fit'] })));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching matched scholarships', error: err.message });
  }
};`;
code = code.replace(oldMatchStub, newMatchStub);

fs.writeFileSync('backend/controllers/scholarshipController.js', code);
console.log('Fixed scholarshipController.js');
