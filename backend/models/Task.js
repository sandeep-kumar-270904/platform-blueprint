const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'todo' },
  required_skills: [{ type: String }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  due_date: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
