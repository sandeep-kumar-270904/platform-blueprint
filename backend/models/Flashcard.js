const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  hint: { type: String },
  position: { type: Number, default: 0 }
});

const flashcardReviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  card_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Referencing a subdocument _id
  ease: { type: Number, required: true }, // E.g., SM-2 ease factor
  next_review_at: { type: Date, required: true },
  reviewed_at: { type: Date, default: Date.now }
});

const flashcardDeckSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  is_public: { type: Boolean, default: true },
  study_count: { type: Number, default: 0 },
  cards: [flashcardSchema],
  reviews: [flashcardReviewSchema]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Virtual property to get card count
flashcardDeckSchema.virtual('card_count').get(function() {
  return this.cards ? this.cards.length : 0;
});

flashcardDeckSchema.set('toJSON', { virtuals: true });
flashcardDeckSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FlashcardDeck', flashcardDeckSchema);
