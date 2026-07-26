
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const QuizCollection = require('../models/QuizCollection');
const User = require('../models/User');

// Create collection
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, isPublic } = req.body;
    const coll = new QuizCollection({
       name,
       owner: req.user.id,
       isPublic: isPublic || false
    });
    await coll.save();
    res.status(201).json(coll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add quiz to collection
router.post('/:id/quizzes', authMiddleware, async (req, res) => {
  try {
    const { quizId } = req.body;
    const coll = await QuizCollection.findById(req.params.id);
    if (!coll) return res.status(404).json({ error: 'Not found' });
    if (coll.owner.toString() !== req.user.id && req.user.role !== 'admin') {
       return res.status(403).json({ error: 'Not authorized' });
    }
    
    if (!coll.quizzes.includes(quizId)) {
       coll.quizzes.push(quizId);
       await coll.save();
    }
    res.json(coll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user collections
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const colls = await QuizCollection.find({ owner: req.user.id }).populate('quizzes', 'title category');
    res.json(colls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get editorial collections (Homepage)
router.get('/editorial', authMiddleware, async (req, res) => {
  try {
    const colls = await QuizCollection.find({ isEditorial: true }).populate('quizzes', 'title category difficulty price');
    res.json(colls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
