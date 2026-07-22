const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const GDTopic = require('../models/GDTopic');
const GDPracticeAttempt = require('../models/GDPracticeAttempt');
const CommunicationLesson = require('../models/CommunicationLesson');
const GDProgress = require('../models/GDProgress');

// @route   GET /api/gd/topics
// @desc    Get all active GD Topics
// @access  Private
router.get('/topics', authMiddleware, async (req, res) => {
  try {
    const topics = await GDTopic.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/gd/practice
// @desc    Save a self-practice attempt
// @access  Private
router.post('/practice', authMiddleware, async (req, res) => {
  try {
    const { topicId, notes, checklist } = req.body;
    
    const topic = await GDTopic.findById(topicId);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    
    // Snapshot the topic
    const topicSnapshot = JSON.parse(JSON.stringify(topic.toObject()));
    
    const attempt = new GDPracticeAttempt({
      user: req.user.id,
      topic: topic._id,
      notes,
      checklist,
      topicSnapshot
    });
    
    await attempt.save();
    
    // Update progress
    let progress = await GDProgress.findOne({ user: req.user.id });
    if (!progress) {
      progress = new GDProgress({ user: req.user.id, practicedTopics: [], completedLessons: [] });
    }
    
    if (!progress.practicedTopics.includes(topic._id)) {
      progress.practicedTopics.push(topic._id);
      await progress.save();
    }
    
    res.status(201).json(attempt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gd/practice/history
// @desc    Get user's past self-practice attempts
// @access  Private
router.get('/practice/history', authMiddleware, async (req, res) => {
  try {
    const attempts = await GDPracticeAttempt.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gd/lessons
// @desc    Get all communication lessons and user's completion status
// @access  Private
router.get('/lessons', authMiddleware, async (req, res) => {
  try {
    const lessons = await CommunicationLesson.find({ isActive: true });
    
    let progress = await GDProgress.findOne({ user: req.user.id });
    const completedIds = progress ? progress.completedLessons.map(id => id.toString()) : [];
    
    const response = lessons.map(l => ({
      ...l.toObject(),
      isCompleted: completedIds.includes(l._id.toString())
    }));
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/gd/lessons/:id/complete
// @desc    Toggle completion status of a lesson
// @access  Private
router.post('/lessons/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { completed } = req.body;
    
    let progress = await GDProgress.findOne({ user: req.user.id });
    if (!progress) {
      progress = new GDProgress({ user: req.user.id, practicedTopics: [], completedLessons: [] });
    }
    
    const lessonId = req.params.id;
    
    if (completed) {
      if (!progress.completedLessons.includes(lessonId)) {
        progress.completedLessons.push(lessonId);
      }
    } else {
      progress.completedLessons = progress.completedLessons.filter(id => id.toString() !== lessonId);
    }
    
    await progress.save();
    res.json({ success: true, completedLessons: progress.completedLessons });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gd/progress
// @desc    Get user's overall GD progress
// @access  Private
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const progress = await GDProgress.findOne({ user: req.user.id });
    res.json(progress || { practicedTopics: [], completedLessons: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
