const express = require('express');
const router = express.Router();
const Syllabus = require('../models/Syllabus');
const SyllabusProgress = require('../models/SyllabusProgress');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const syllabuses = await Syllabus.find();
    res.json(syllabuses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const syllabus = new Syllabus(req.body);
    await syllabus.save();
    res.status(201).json(syllabus);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/progress', auth, async (req, res) => {
  try {
    const progress = await SyllabusProgress.find({ userId: req.user.id }).populate('subjectId');
    res.json(progress);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
