const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  announcement: {
    message: { type: String, default: "" },
    isVisible: { type: Boolean, default: false },
    type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' }
  },
  // Future global settings can go here
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
