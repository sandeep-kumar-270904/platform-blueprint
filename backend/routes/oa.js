const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const OADefinition = require('../models/OADefinition');
const OAAttempt = require('../models/OAAttempt');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const CompanyPrep = require('../models/CompanyPrep');
const { executeCode } = require('../services/codeExecutionService');

// Get OA Definition for a company
router.get('/company/:companyId', authMiddleware, async (req, res) => {
  try {
    const definition = await OADefinition.findOne({ company: req.params.companyId }).populate('sections.questions');
    if (!definition) return res.status(404).json({ message: 'OA not found for this company' });
    res.json(definition);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start an OA Simulation
router.post('/start/:definitionId', authMiddleware, async (req, res) => {
  try {
    const definition = await OADefinition.findById(req.params.definitionId).populate('sections.questions');
    if (!definition) return res.status(404).json({ message: 'OA Definition not found' });

    // Check for existing in-progress attempt
    const existing = await OAAttempt.findOne({ 
      user: req.user.id, 
      oaDefinition: definition._id, 
      status: 'In Progress' 
    });

    if (existing) {
      if (existing.expiresAt > new Date()) {
        const existingData = existing.toObject();
        existingData.serverTime = new Date();
        return res.json(existingData); // Resume
      } else {
        existing.status = 'Abandoned';
        await existing.save();
      }
    }

    // Build the sections for the attempt
    const generatedSections = [];

    for (const section of definition.sections) {
      let codingResponses = [];
      let aptitudeResponses = [];

      if (section.type === 'Coding' || section.type === 'Debugging') {
        for (const q of section.questions) {
          codingResponses.push({
            question: q._id,
            code: '',
            language: 'javascript',
            testCasesPassed: 0,
            totalTestCases: q.testCases ? q.testCases.length : 3, // Dummy default
            score: 0
          });
        }
      } else if (section.type === 'Aptitude') {
        // Fetch questions based on rules
        for (const rule of section.aptitudeRules) {
          const match = { category: rule.category };
          if (rule.topic) match.topic = rule.topic;
          
          const questions = await AptitudeQuestion.aggregate([
            { $match: match },
            { $sample: { size: rule.count } }
          ]);
          
          questions.forEach(q => {
            aptitudeResponses.push({
              question: q._id,
              selectedAnswer: null,
              isCorrect: false
            });
          });
        }
      }

      generatedSections.push({
        title: section.title,
        type: section.type,
        codingResponses,
        aptitudeResponses
      });
    }

    const expiresAt = new Date(Date.now() + definition.totalDurationMinutes * 60000);

    // Deep copy definition for the snapshot to preserve rules if changed by admin later
    const definitionSnapshot = JSON.parse(JSON.stringify(definition.toObject()));

    const attempt = new OAAttempt({
      user: req.user.id,
      oaDefinition: definition._id,
      oaDefinitionSnapshot: definitionSnapshot,
      expiresAt,
      sections: generatedSections,
      currentActiveSectionIndex: 0
    });

    await attempt.save();
    
    const attemptData = attempt.toObject();
    attemptData.serverTime = new Date();
    res.status(201).json(attemptData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync Progress (Save code or answers mid-test)
router.post('/sync/:attemptId', authMiddleware, async (req, res) => {
  try {
    const { sectionIndex, questionId, code, language, selectedAnswer, tabSwitches, requestSectionAdvance } = req.body;
    
    const attempt = await OAAttempt.findOne({ _id: req.params.attemptId, user: req.user.id });
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    
    // Auto-submit if expired
    if (attempt.expiresAt < new Date() && attempt.status === 'In Progress') {
      return res.status(403).json({ message: 'Time expired. Please submit.' });
    }

    if (attempt.status !== 'In Progress') return res.status(400).json({ message: 'Attempt is not in progress' });
    
    if (tabSwitches) attempt.tabSwitches = tabSwitches;

    // Enforce section locking
    if (attempt.oaDefinitionSnapshot?.preventSectionNavigation && sectionIndex !== attempt.currentActiveSectionIndex) {
      return res.status(403).json({ message: 'Cannot modify a locked section' });
    }

    if (requestSectionAdvance && attempt.oaDefinitionSnapshot?.preventSectionNavigation) {
      if (attempt.currentActiveSectionIndex < attempt.sections.length - 1) {
        attempt.currentActiveSectionIndex++;
      }
    }

    const section = attempt.sections[sectionIndex];
    if (!section) return res.status(400).json({ message: 'Invalid section index' });

    if (section.type === 'Coding' || section.type === 'Debugging') {
      const resp = section.codingResponses.find(r => r.question.toString() === questionId);
      if (resp) {
        if (code !== undefined) resp.code = code;
        if (language !== undefined) resp.language = language;
      }
    } else if (section.type === 'Aptitude') {
      const resp = section.aptitudeResponses.find(r => r.question.toString() === questionId);
      if (resp) {
        if (selectedAnswer !== undefined) resp.selectedAnswer = selectedAnswer;
      }
    }

    await attempt.save();
    res.json({ success: true, currentActiveSectionIndex: attempt.currentActiveSectionIndex, serverTime: new Date() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit OA
router.post('/submit/:attemptId', authMiddleware, async (req, res) => {
  try {
    const attempt = await OAAttempt.findOne({ _id: req.params.attemptId, user: req.user.id })
      .populate('sections.codingResponses.question')
      .populate('sections.aptitudeResponses.question');
      
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.status === 'Completed') return res.json({ resultId: attempt._id }); // Idempotent

    attempt.endTime = new Date();
    attempt.status = 'Completed';
    
    const durationMs = attempt.endTime.getTime() - attempt.startTime.getTime();
    attempt.timeSpentSeconds = Math.floor(durationMs / 1000);

    let overallScore = 0;
    let maxScore = 0;

    // ACTUAL SCORING LOGIC
    for (const section of attempt.sections) {
      if (section.type === 'Coding' || section.type === 'Debugging') {
        for (const r of section.codingResponses) {
          maxScore += 10; // 10 points per coding question
          
          if (r.code && r.code.trim().length > 0) {
            const testCases = r.question?.testCases || [
               { input: '1, 2', expectedOutput: '3' }, 
               { input: '5, 5', expectedOutput: '10' }
            ]; // Fallback if no test cases defined
            
            const execResult = executeCode(r.code, testCases);
            
            r.totalTestCases = execResult.totalTestCases;
            r.testCasesPassed = execResult.testCasesPassed;
            r.score = (r.testCasesPassed / r.totalTestCases) * 10;
          } else {
            r.totalTestCases = r.question?.testCases?.length || 2;
            r.testCasesPassed = 0;
            r.score = 0;
          }
          overallScore += r.score;
        }
      } else if (section.type === 'Aptitude') {
        for (const r of section.aptitudeResponses) {
          maxScore += 1; // 1 point per aptitude
          if (r.selectedAnswer !== null && r.question) {
            r.isCorrect = (r.selectedAnswer === r.question.correctAnswer);
            if (r.isCorrect) overallScore += 1;
          } else {
            r.isCorrect = false;
          }
        }
      }
    }

    attempt.overallScore = Math.round(overallScore);
    attempt.maxScore = maxScore;

    await attempt.save();
    res.json({ resultId: attempt._id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed results
router.get('/results/:attemptId', authMiddleware, async (req, res) => {
  try {
    const attempt = await OAAttempt.findOne({ _id: req.params.attemptId, user: req.user.id })
      .populate('oaDefinition')
      .populate('sections.codingResponses.question')
      .populate('sections.aptitudeResponses.question');
      
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    const attemptData = attempt.toObject();
    attemptData.serverTime = new Date();
    res.json(attemptData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's past attempts for a company
router.get('/history/:companyId', authMiddleware, async (req, res) => {
  try {
    // Find definitions linked to this company
    const definitions = await OADefinition.find({ company: req.params.companyId }).select('_id');
    const defIds = definitions.map(d => d._id);

    const attempts = await OAAttempt.find({ 
      user: req.user.id, 
      oaDefinition: { $in: defIds },
      status: 'Completed'
    }).sort({ endTime: -1 }).populate('oaDefinition', 'name totalDurationMinutes');

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
