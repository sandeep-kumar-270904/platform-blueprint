const mongoose = require('mongoose');

const RoomBookingSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomRental', required: true },
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'], default: 'Pending' },
  moveInDate: { type: Date, required: true },
  durationMonths: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Refunded'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('RoomBooking', RoomBookingSchema);
