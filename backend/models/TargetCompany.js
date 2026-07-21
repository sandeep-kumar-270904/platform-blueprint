const mongoose = require('mongoose');

const targetCompanySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  company_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyPrep'
  }]
}, { timestamps: true });

module.exports = mongoose.model('TargetCompany', targetCompanySchema);
