const mongoose = require('mongoose');

const eventBookmarkSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

eventBookmarkSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventBookmarkSchema.index({ userId: 1 });

module.exports = mongoose.model('EventBookmark', eventBookmarkSchema);
