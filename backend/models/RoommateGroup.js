const mongoose = require('mongoose');

const roommateGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetSize: { type: Number, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  preferredLocations: { type: [String], default: [] },
  budgetRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  moveInDate: { type: Date },
  status: { type: String, enum: ['open', 'closed', 'disbanded'], default: 'open' },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

roommateGroupSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RoommateGroup', roommateGroupSchema);
