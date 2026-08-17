const mongoose = require('mongoose');

// Deprecated model: Recreated as an empty schema to prevent MODULE_NOT_FOUND crashes
// in legacy routes that haven't been fully pruned yet.
const courseSchema = new mongoose.Schema({
  title: String,
  provider: String,
  externalUrl: String,
  category: String,
  level: String,
  tags: [String]
}, { strict: false });

module.exports = mongoose.model('Course', courseSchema);
