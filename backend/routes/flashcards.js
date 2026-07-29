const express = require('express');
const router = express.Router();
const FlashcardDeck = require('../models/Flashcard');
const authMiddleware = require('../middleware/auth');

// Get all public decks
router.get('/decks', async (req, res) => {
  try {
    const decks = await FlashcardDeck.find({ is_public: true }).sort({ created_at: -1 });
    // Exclude cards array for listing
    const sanitized = decks.map(d => {
      const dObj = d.toObject();
      delete dObj.cards;
      return dObj;
    });
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new deck
router.post('/decks', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, cards } = req.body;
    
    const deck = new FlashcardDeck({
      user_id: req.user.id,
      title,
      description,
      category,
      cards: cards || []
    });
    
    const savedDeck = await deck.save();
    
    // Broadcast for live sync
    if (req.io) {
      req.io.emit('flashcard-decks', { action: 'create', data: savedDeck });
    }
    
    res.status(201).json(savedDeck);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get cards for a deck
router.get('/decks/:id/cards', async (req, res) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });
    
    const cards = deck.cards.sort((a, b) => a.position - b.position);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Record a card review
router.post('/cards/:cardId/review', authMiddleware, async (req, res) => {
  try {
    const { ease, next_review_at } = req.body;
    
    // Find the deck that contains this card
    const deck = await FlashcardDeck.findOne({ 'cards._id': req.params.cardId });
    if (!deck) return res.status(404).json({ message: 'Card not found' });
    
    // Find existing review or add a new one
    const existingReview = deck.reviews.find(r => 
      r.card_id.toString() === req.params.cardId && r.user_id.toString() === req.user.id
    );
    
    if (existingReview) {
      existingReview.ease = ease;
      existingReview.next_review_at = new Date(next_review_at);
      existingReview.reviewed_at = new Date();
    } else {
      deck.reviews.push({
        user_id: req.user.id,
        card_id: req.params.cardId,
        ease,
        next_review_at: new Date(next_review_at)
      });
    }
    
    await deck.save();
    
    res.status(200).json({ message: 'Review recorded' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
