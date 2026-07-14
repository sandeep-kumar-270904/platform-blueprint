const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: [
      'question_answered', 
      'review_upvoted', 
      'answer_upvoted', 
      'review_reported_resolved', 
      'question_upvoted',
      'event_approved',
      'event_rejected',
      'event_reminder',
      'event_updated',
      'event_cancelled',
      'waitlist_confirmed',
      'event_feedback_request',
      'team_request',
      'team_request_accepted',
      'course_reminder',
      'course_streak_milestone'
    ],
    required: true
  },
  relatedCollegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
  relatedContentId: { type: mongoose.Schema.Types.ObjectId, default: null }, // questionId/reviewId/answerId
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
