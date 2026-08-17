const mongoose = require('mongoose');

// Deprecated model: Recreated as an empty schema to prevent MODULE_NOT_FOUND crashes
// in legacy routes that haven't been fully pruned yet.
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  description: String,
  skills: [String]
}, { strict: false });

module.exports = mongoose.model('Job', jobSchema);
