const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  branch: {
    type: String
  },
  semester: {
    type: Number
  },
  category: {
    type: String
  },
  university: {
    type: String
  },
  year: {
    type: Number
  },
  tags: {
    type: [String]
  },
  content_url: {
    type: String,
    required: true
  },
  file_type: {
    type: String,
    default: 'pdf'
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Note', NoteSchema);
