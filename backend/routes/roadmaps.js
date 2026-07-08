const express = require('express');
const router = express.Router();
const { Roadmap, RoadmapProgress, CheatSheet } = require('../models/Roadmap');
const authMiddleware = require('../middleware/auth');

// Get all public roadmaps
router.get('/', async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ is_public: true }).sort({ created_at: -1 });
    res.json(roadmaps);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user progress for a roadmap
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const progress = await RoadmapProgress.find({ user_id: req.user.id });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new roadmap
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, difficulty, duration, topics, steps } = req.body;
    
    const roadmap = new Roadmap({
      user_id: req.user.id,
      title,
      description,
      category,
      difficulty: difficulty || 'intermediate',
      duration,
      topics: topics || [],
      steps: steps || []
    });
    
    const savedRoadmap = await roadmap.save();
    
    if (req.io) {
      req.io.emit('roadmaps', { action: 'create', data: savedRoadmap });
    }
    
    res.status(201).json(savedRoadmap);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get roadmap steps
router.get('/:id/steps', async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });
    
    const steps = roadmap.steps.sort((a, b) => a.position - b.position);
    res.json(steps);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle a step's completion for a user
router.post('/:roadmapId/steps/:stepId/toggle', authMiddleware, async (req, res) => {
  try {
    const existing = await RoadmapProgress.findOne({
      user_id: req.user.id,
      step_id: req.params.stepId
    });
    
    if (existing) {
      await RoadmapProgress.deleteOne({ _id: existing._id });
      res.json({ status: 'uncompleted' });
    } else {
      const progress = new RoadmapProgress({
        user_id: req.user.id,
        roadmap_id: req.params.roadmapId,
        step_id: req.params.stepId
      });
      await progress.save();
      res.json({ status: 'completed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CheatSheets API routes
router.get('/cheatsheets', async (req, res) => {
  try {
    const sheets = await CheatSheet.find({ is_public: true }).sort({ created_at: -1 });
    res.json(sheets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/cheatsheets/:id/download', async (req, res) => {
  try {
    const sheet = await CheatSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'CheatSheet not found' });
    
    sheet.downloads += 1;
    await sheet.save();
    
    res.json({ downloads: sheet.downloads });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
