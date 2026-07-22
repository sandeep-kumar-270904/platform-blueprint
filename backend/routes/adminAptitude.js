const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const AptitudeTestDefinition = require('../models/AptitudeTestDefinition');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const CompanyPrep = require('../models/CompanyPrep');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// --- Aptitude Test Definitions ---

// Get all definitions
router.get('/definitions', async (req, res) => {
  try {
    const definitions = await AptitudeTestDefinition.find().populate('company', 'name');
    res.json(definitions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Helper function to validate if question pool has enough questions for rules
const validateRulesAgainstPool = async (rules) => {
  const errors = [];
  for (const rule of rules) {
    const query = { category: rule.category };
    if (rule.topic) query.topic = rule.topic;
    
    const count = await AptitudeQuestion.countDocuments(query);
    if (count < rule.count) {
      errors.push(`Not enough questions in pool for Category: ${rule.category}${rule.topic ? `, Topic: ${rule.topic}` : ''}. Requested: ${rule.count}, Available: ${count}`);
    }
  }
  return errors;
};

// Create a new definition
router.post('/definitions', async (req, res) => {
  try {
    const { name, description, company, rules, timeLimitMinutes, allowBackwardNavigation } = req.body;

    const validationErrors = await validateRulesAgainstPool(rules);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Validation Failed', errors: validationErrors });
    }

    const definition = new AptitudeTestDefinition({
      name, description, company, rules, timeLimitMinutes, allowBackwardNavigation
    });
    await definition.save();
    res.status(201).json(definition);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update a definition
router.put('/definitions/:id', async (req, res) => {
  try {
    const { name, description, company, rules, timeLimitMinutes, allowBackwardNavigation } = req.body;

    const validationErrors = await validateRulesAgainstPool(rules);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Validation Failed', errors: validationErrors });
    }

    const definition = await AptitudeTestDefinition.findByIdAndUpdate(req.params.id, {
      name, description, company, rules, timeLimitMinutes, allowBackwardNavigation
    }, { new: true });
    
    if (!definition) return res.status(404).json({ message: 'Definition not found' });
    res.json(definition);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- Aptitude Questions ---

// Get questions (with optional filters)
router.get('/questions', async (req, res) => {
  try {
    const { category, topic } = req.query;
    const query = {};
    if (category) query.category = category;
    if (topic) query.topic = topic;
    
    const questions = await AptitudeQuestion.find(query);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a new question
router.post('/questions', async (req, res) => {
  try {
    const { category, topic, difficulty, questionText, options, correctAnswer, explanation } = req.body;
    const question = new AptitudeQuestion({
      category, topic, difficulty, questionText, options, correctAnswer, explanation
    });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update an existing question
router.put('/questions/:id', async (req, res) => {
  try {
    const { category, topic, difficulty, questionText, options, correctAnswer, explanation } = req.body;
    
    // Note: Since past attempts store snapshotCorrectAnswer, editing this won't break past scores!
    const question = await AptitudeQuestion.findByIdAndUpdate(req.params.id, {
      category, topic, difficulty, questionText, options, correctAnswer, explanation
    }, { new: true });
    
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
