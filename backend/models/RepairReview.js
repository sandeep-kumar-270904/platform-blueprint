const mongoose = require('mongoose');

const RepairReviewSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairProvider',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  flagsCount: {
    type: Number,
    default: 0
  },
  flaggedByUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderationStatus: {
    type: String,
    enum: ['active', 'flagged', 'removed'],
    default: 'active'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  lastEditedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Enforce one review per user per provider
RepairReviewSchema.index({ providerId: 1, userId: 1 }, { unique: true });

// Static method to compute and update average rating on the provider
RepairReviewSchema.statics.getAverageRating = async function(providerId) {
  const obj = await this.aggregate([
    {
      $match: { providerId: providerId, moderationStatus: 'active' }
    },
    {
      $group: {
        _id: '$providerId',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  try {
    const RepairProvider = mongoose.model('RepairProvider');
    if (obj[0]) {
      await RepairProvider.findByIdAndUpdate(providerId, {
        rating: Math.round(obj[0].averageRating * 10) / 10, // Round to 1 decimal
        reviewsCount: obj[0].count
      });
    } else {
      await RepairProvider.findByIdAndUpdate(providerId, {
        rating: 0,
        reviewsCount: 0
      });
    }
  } catch (err) {
    console.error('Error updating RepairProvider rating', err);
  }
};

// Call getAverageRating after saving a review
RepairReviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.providerId);
});

// Call getAverageRating after removing a review
RepairReviewSchema.post('remove', function() {
  this.constructor.getAverageRating(this.providerId);
});

module.exports = mongoose.model('RepairReview', RepairReviewSchema);
