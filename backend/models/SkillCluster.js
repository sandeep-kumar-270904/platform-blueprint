const mongoose = require('mongoose');

const skillClusterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "Frontend Engineering Fundamentals"
  requiredTags: [{ type: String, required: true }], // e.g. ["React", "TypeScript", "REST API design"]
  badgeIcon: { type: String, default: 'award' },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SkillCluster', skillClusterSchema);
