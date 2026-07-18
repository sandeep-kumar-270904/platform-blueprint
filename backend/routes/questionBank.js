const express = require('express');
const router = express.Router();
const QuestionBank = require('../models/QuestionBank');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/question-bank/me - Get current user's question banks
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    
    const query = { ownerId: req.user.id };
    
    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const banks = await QuestionBank.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await QuestionBank.countDocuments(query);
    
    res.json({
      banks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/question-bank/public - Get public banks
router.get('/public', authMiddleware, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    
    const query = { visibility: 'public' };
    
    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const banks = await QuestionBank.find(query)
      .populate('ownerId', 'full_name username avatar_url')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await QuestionBank.countDocuments(query);
    
    res.json({
      banks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/question-bank/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id).populate('ownerId', 'full_name username avatar_url');
    if (!bank) return res.status(404).json({ message: 'Bank not found' });

    if (bank.visibility === 'private' && bank.ownerId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(bank);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/question-bank - Create a new bank
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, category, tags, visibility, questions } = req.body;
    
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const newBank = new QuestionBank({
      ownerId: req.user.id,
      title,
      category: category || 'General',
      tags: tags || [],
      visibility: visibility || 'private',
      questions: questions || []
    });

    await newBank.save();
    res.status(201).json(newBank);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/question-bank/:id - Update bank or questions
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id);
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    
    if (bank.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(bank, req.body);
    await bank.save();
    res.json(bank);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/question-bank/:id/fork - Fork a public bank
router.post('/:id/fork', authMiddleware, async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id);
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    
    if (bank.visibility !== 'public' && bank.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Cannot fork a private bank you do not own' });
    }

    const newBank = new QuestionBank({
      ownerId: req.user.id,
      title: `${bank.title} (Forked)`,
      category: bank.category,
      tags: bank.tags,
      visibility: 'private',
      forkedFrom: bank._id,
      questions: bank.questions.map(q => {
        const qObj = q.toObject();
        delete qObj._id; // Give them fresh IDs
        return qObj;
      })
    });

    await newBank.save();
    res.status(201).json(newBank);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/question-bank/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id);
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    
    if (bank.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await bank.deleteOne();
    res.json({ message: 'Bank deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
