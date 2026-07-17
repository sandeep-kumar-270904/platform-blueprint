const express = require('express');
const router = express.Router();
const QuestionBankItem = require('../models/QuestionBankItem');
const authMiddleware = require('../middleware/auth');

// GET /api/question-bank/me - Get current user's question bank items
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    
    const query = { createdBy: req.user.id };
    
    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const items = await QuestionBankItem.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await QuestionBankItem.countDocuments(query);
    
    res.json({
      items,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/question-bank - Add a new item to bank
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { questionText, options, correctOptionIndex, explanation, points, category, tags } = req.body;
    
    if (!options || options.length < 2 || options.length > 6) {
      return res.status(400).json({ message: 'Each question must have 2-6 options' });
    }
    if (typeof correctOptionIndex !== 'number' || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      return res.status(400).json({ message: 'Invalid correctOptionIndex' });
    }

    const newItem = new QuestionBankItem({
      createdBy: req.user.id,
      questionText,
      options,
      correctOptionIndex,
      explanation: explanation || '',
      points: points || 1,
      category: category || 'General',
      tags: tags || []
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/question-bank/:id - Update an item
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await QuestionBankItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    if (item.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // if options changed, ensure validity
    if (req.body.options) {
      const opts = req.body.options;
      if (opts.length < 2 || opts.length > 6) {
        return res.status(400).json({ message: 'Must have 2-6 options' });
      }
      const correctIdx = req.body.correctOptionIndex !== undefined ? req.body.correctOptionIndex : item.correctOptionIndex;
      if (correctIdx < 0 || correctIdx >= opts.length) {
        return res.status(400).json({ message: 'Invalid correctOptionIndex for given options' });
      }
    } else if (req.body.correctOptionIndex !== undefined) {
      if (req.body.correctOptionIndex < 0 || req.body.correctOptionIndex >= item.options.length) {
        return res.status(400).json({ message: 'Invalid correctOptionIndex' });
      }
    }

    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/question-bank/:id - Delete an item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await QuestionBankItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    if (item.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
