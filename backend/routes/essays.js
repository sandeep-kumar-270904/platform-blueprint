const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const EssayResponse = require('../models/EssayResponse');
const geminiService = require('../services/geminiService');

router.get('/', protect, async (req, res) => {
  try {
    const essays = await EssayResponse.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(essays);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching essays', error: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title, prompt, content, tags } = req.body;
    const essay = await EssayResponse.create({
      userId: req.user.id,
      title,
      prompt,
      content,
      tags
    });
    res.status(201).json(essay);
  } catch (err) {
    res.status(400).json({ message: 'Error creating essay', error: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const essay = await EssayResponse.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!essay) return res.status(404).json({ message: 'Essay not found' });
    res.json(essay);
  } catch (err) {
    res.status(400).json({ message: 'Error updating essay', error: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const essay = await EssayResponse.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!essay) return res.status(404).json({ message: 'Essay not found' });
    res.json({ message: 'Essay deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting essay', error: err.message });
  }
});

// Gemini Adaptation Route
router.post('/adapt', protect, async (req, res) => {
  try {
    const { originalEssay, newPrompt } = req.body;
    if (!originalEssay || !newPrompt) {
      return res.status(400).json({ message: 'originalEssay and newPrompt are required' });
    }
    const suggestion = await geminiService.adaptEssay(originalEssay, newPrompt, req.user.id);
    res.json({ suggestion });
  } catch (err) {
    res.status(500).json({ message: 'Error adapting essay', error: err.message });
  }
});

module.exports = router;
