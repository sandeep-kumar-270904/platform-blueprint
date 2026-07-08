const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  is_active: {
    type: Boolean,
    default: true
  },
  items: [{
    classroom_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualClassroom' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ClassroomCollection', collectionSchema);
