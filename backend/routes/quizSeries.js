const express = require('express');
const router = express.Router();
const QuizSeries = require('../models/QuizSeries');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const series = await QuizSeries.find().populate('quizzes');
    res.json(series);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, quizzes, isOfficial } = req.body;
    const series = new QuizSeries({
      title, description, category, quizzes,
      isOfficial,
      createdBy: req.user.id
    });
    await series.save();
    res.status(201).json(series);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
