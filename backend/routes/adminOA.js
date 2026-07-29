const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const OADefinition = require('../models/OADefinition');
const DSAProblem = require('../models/DSAProblem');
const AptitudeQuestion = require('../models/AptitudeQuestion');

// @route   GET /api/admin/oa/validate/:definitionId
// @desc    Validate if there are enough questions in the pool for this pattern
// @access  Admin
router.get('/validate/:definitionId', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const definition = await OADefinition.findById(req.params.definitionId);
    if (!definition) return res.status(404).json({ message: 'OA Definition not found' });

    const warnings = [];

    for (const section of definition.sections) {
      if (section.type === 'Coding' || section.type === 'Debugging') {
        const requiredCount = section.questions.length;
        // In a real rotating scenario, we'd check if the total available pool > requiredCount * 3 (for instance).
        // For now, just ensure the static questions linked exist.
        const existingCount = await DSAProblem.countDocuments({ _id: { $in: section.questions } });
        if (existingCount < requiredCount) {
          warnings.push(`Section "${section.title}" requires ${requiredCount} coding questions, but only ${existingCount} were found in the database.`);
        }
      } else if (section.type === 'Aptitude') {
        for (const rule of section.aptitudeRules) {
          const match = { category: rule.category };
          if (rule.topic) match.topic = rule.topic;
          
          const availableCount = await AptitudeQuestion.countDocuments(match);
          if (availableCount < rule.count) {
            warnings.push(`Rule for category "${rule.category}" requires ${rule.count} questions, but only ${availableCount} exist.`);
          } else if (availableCount < rule.count * 2) {
            warnings.push(`Low pool size for category "${rule.category}". Required: ${rule.count}, Available: ${availableCount}. Students will see immediate repeats.`);
          }
        }
      }
    }

    if (warnings.length > 0) {
      return res.json({ valid: false, warnings });
    }

    res.json({ valid: true, message: 'Pool sizes are adequate for this OA pattern.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
