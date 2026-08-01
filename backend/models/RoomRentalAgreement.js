const mongoose = require('mongoose');

const RoomRentalAgreementSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomRental', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomBooking', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  terms: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'Signed'], default: 'Draft' },
  ownerSignDate: { type: Date },
  renterSignDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('RoomRentalAgreement', RoomRentalAgreementSchema);
