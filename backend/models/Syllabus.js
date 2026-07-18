const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weightPercentage: { type: Number, required: true }, // Out of 100
  subtopics: [{ type: String }]
});

const syllabusSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topics: [topicSchema]
}, { timestamps: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);
