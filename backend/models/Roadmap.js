const mongoose = require('mongoose');

const roadmapStepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  resources: [{
    label: { type: String },
    url: { type: String }
  }],
  position: { type: Number, default: 0 }
});

const roadmapSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  duration: { type: String },
  topics: [{ type: String }],
  is_public: { type: Boolean, default: true },
  steps: [roadmapStepSchema]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

roadmapSchema.virtual('step_count').get(function() {
  return this.steps ? this.steps.length : 0;
});
roadmapSchema.set('toJSON', { virtuals: true });
roadmapSchema.set('toObject', { virtuals: true });

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

const roadmapProgressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roadmap_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  step_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // refers to roadmapStepSchema _id
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound index to ensure a user can only complete a step once
roadmapProgressSchema.index({ user_id: 1, step_id: 1 }, { unique: true });

const RoadmapProgress = mongoose.model('RoadmapProgress', roadmapProgressSchema);

const cheatSheetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  file_url: { type: String },
  format: { type: String, default: 'PDF' },
  pages: { type: Number, default: 1 },
  downloads: { type: Number, default: 0 },
  is_public: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const CheatSheet = mongoose.model('CheatSheet', cheatSheetSchema);

module.exports = {
  Roadmap,
  RoadmapProgress,
  CheatSheet
};
