const express = require('express');
const router = express.Router();
const SkillAssessment = require('../models/SkillAssessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Seed script to initialize assessments if empty
const seedAssessments = async () => {
  const count = await SkillAssessment.countDocuments();
  if (count === 0) {
    const assessments = [
      {
        skill: 'JavaScript',
        title: 'JavaScript Fundamentals',
        description: 'Test your knowledge of core JavaScript concepts including closures, promises, and array methods.',
        passingScorePercent: 70,
        durationMinutes: 15,
        questions: [
          { questionText: 'What is the output of `typeof null`?', options: ['"null"', '"undefined"', '"object"', '"number"'], correctOptionIndex: 2 },
          { questionText: 'Which keyword is used to declare a block-scoped variable?', options: ['var', 'let', 'function', 'global'], correctOptionIndex: 1 },
          { questionText: 'What does `Array.prototype.map()` return?', options: ['A new array', 'The same array modified', 'A string', 'undefined'], correctOptionIndex: 0 }
        ]
      },
      {
        skill: 'React',
        title: 'React Basics',
        description: 'Evaluate your understanding of React components, hooks, and state management.',
        passingScorePercent: 70,
        durationMinutes: 15,
        questions: [
          { questionText: 'Which hook is used for side effects?', options: ['useState', 'useReducer', 'useEffect', 'useMemo'], correctOptionIndex: 2 },
          { questionText: 'React components must return:', options: ['Multiple root elements', 'A single root element', 'A string', 'Nothing'], correctOptionIndex: 1 },
          { questionText: 'What is the Virtual DOM?', options: ['A direct copy of the real DOM', 'A lightweight JavaScript representation of the DOM', 'A browser extension', 'A new HTML standard'], correctOptionIndex: 1 }
        ]
      },
      {
        skill: 'SQL',
        title: 'SQL & Databases',
        description: 'Test your ability to write queries and understand relational database concepts.',
        passingScorePercent: 70,
        durationMinutes: 15,
        questions: [
          { questionText: 'Which clause is used to filter records?', options: ['ORDER BY', 'GROUP BY', 'WHERE', 'HAVING'], correctOptionIndex: 2 },
          { questionText: 'What does a LEFT JOIN do?', options: ['Returns all records from the left table', 'Returns only matching records', 'Returns all records from the right table', 'Throws an error if tables don\'t match'], correctOptionIndex: 0 },
          { questionText: 'Which statement is used to add new rows to a table?', options: ['ADD', 'UPDATE', 'INSERT INTO', 'CREATE'], correctOptionIndex: 2 }
        ]
      }
    ];
    await SkillAssessment.insertMany(assessments);
    console.log('🌱 Seeded Skill Assessments');
  }
};

seedAssessments().catch(console.error);

// GET /api/assessments - List available assessments and user status
router.get('/', authMiddleware, async (req, res) => {
  try {
    const assessments = await SkillAssessment.find({ active: true }).lean();
    const attempts = await AssessmentAttempt.find({ user: req.user.id }).lean();
    
    // Attach attempt info to each assessment
    const result = assessments.map(a => {
      const userAttempts = attempts.filter(att => att.assessment.toString() === a._id.toString());
      userAttempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      const latestAttempt = userAttempts[0];
      
      let canAttempt = true;
      let nextEligibleDate = null;
      
      if (latestAttempt) {
        // 30 days cooldown
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (new Date(latestAttempt.completedAt) > thirtyDaysAgo) {
          canAttempt = false;
          nextEligibleDate = new Date(latestAttempt.completedAt);
          nextEligibleDate.setDate(nextEligibleDate.getDate() + 30);
        }
      }
      
      return {
        _id: a._id,
        skill: a.skill,
        title: a.title,
        description: a.description,
        durationMinutes: a.durationMinutes,
        passingScorePercent: a.passingScorePercent,
        questionCount: a.questions.length,
        latestAttempt: latestAttempt ? {
          score: latestAttempt.score,
          passed: latestAttempt.passed,
          completedAt: latestAttempt.completedAt
        } : null,
        canAttempt,
        nextEligibleDate
      };
    });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/assessments/:id/start - Get assessment questions
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const assessment = await SkillAssessment.findById(req.params.id);
    if (!assessment || !assessment.active) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check cooldown
    const latestAttempt = await AssessmentAttempt.findOne({ 
      user: req.user.id, 
      assessment: assessment._id 
    }).sort({ completedAt: -1 });
    
    if (latestAttempt) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(latestAttempt.completedAt) > thirtyDaysAgo) {
        const nextEligibleDate = new Date(latestAttempt.completedAt);
        nextEligibleDate.setDate(nextEligibleDate.getDate() + 30);
        return res.status(429).json({ 
          message: 'You can only attempt this assessment once every 30 days.',
          nextEligibleDate 
        });
      }
    }
    
    // Strip correctOptionIndex
    const questions = assessment.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options
    }));
    
    res.json({
      _id: assessment._id,
      title: assessment.title,
      durationMinutes: assessment.durationMinutes,
      questions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/assessments/:id/submit - Submit answers
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body; // array of option indices matching question order
    const assessment = await SkillAssessment.findById(req.params.id);
    
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    if (!Array.isArray(answers) || answers.length !== assessment.questions.length) {
      return res.status(400).json({ message: 'Invalid answers format' });
    }
    
    // Check cooldown again
    const latestAttempt = await AssessmentAttempt.findOne({ 
      user: req.user.id, 
      assessment: assessment._id 
    }).sort({ completedAt: -1 });
    
    if (latestAttempt) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(latestAttempt.completedAt) > thirtyDaysAgo) {
        return res.status(429).json({ message: 'Cooldown active.' });
      }
    }
    
    // Grade the test
    let correctCount = 0;
    for (let i = 0; i < assessment.questions.length; i++) {
      if (answers[i] === assessment.questions[i].correctOptionIndex) {
        correctCount++;
      }
    }
    
    const score = (correctCount / assessment.questions.length) * 100;
    const passed = score >= assessment.passingScorePercent;
    
    const attempt = new AssessmentAttempt({
      user: req.user.id,
      assessment: assessment._id,
      answers,
      score,
      passed
    });
    await attempt.save();
    
    // If passed, add to verifiedSkills
    if (passed) {
      const user = await User.findById(req.user.id);
      if (user) {
        const existingSkillIndex = user.verifiedSkills?.findIndex(s => s.skill === assessment.skill);
        if (existingSkillIndex !== -1 && existingSkillIndex !== undefined) {
          // Update score/date if already verified but passed again (e.g. after expiry/cooldown)
          user.verifiedSkills[existingSkillIndex].score = score;
          user.verifiedSkills[existingSkillIndex].verifiedAt = new Date();
        } else {
          if (!user.verifiedSkills) user.verifiedSkills = [];
          user.verifiedSkills.push({
            skill: assessment.skill,
            score,
            verifiedAt: new Date()
          });
        }
        await user.save();
      }
    }
    
    res.json({
      message: 'Assessment submitted',
      score,
      passed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
