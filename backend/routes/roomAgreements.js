const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RoomRentalAgreement = require('../models/RoomRentalAgreement');
const RoomBooking = require('../models/RoomBooking');
const RoomRental = require('../models/RoomRental');
const Notification = require('../models/Notification');

// POST /api/room-agreements/generate
router.post('/generate', auth, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await RoomBooking.findById(bookingId).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only owner can generate
    if (booking.owner.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Only owner can generate agreement.' });
    }

    // Check if exists
    let agreement = await RoomRentalAgreement.findOne({ booking: bookingId });
    if (agreement) return res.status(400).json({ message: 'Agreement already exists.' });

    const terms = `1. PREMISES: The Landlord agrees to rent to the Tenant the room located at ${booking.room.location}.
2. TERM: The lease shall commence on ${new Date(booking.moveInDate).toDateString()} and continue for ${booking.durationMonths} months.
3. RENT: The Tenant agrees to pay $${booking.room.rent} per month.
4. DEPOSIT: A security deposit of $${booking.depositAmount} is required.
5. UTILITIES: ${booking.room.utilitiesIncluded ? 'Included' : 'Not included'}.
6. HOUSE RULES: As specified in the original listing.`;

    agreement = new RoomRentalAgreement({
      room: booking.room._id,
      booking: booking._id,
      owner: booking.owner,
      renter: booking.renter,
      terms
    });
    
    await agreement.save();

    // Notify renter
    await Notification.create({
      userId: booking.renter,
      type: 'room_agreement_generated',
      message: `A rental agreement has been generated for ${booking.room.title}. Please review and sign.`,
      relatedContentId: agreement._id,
      actors: [{ userId: (req.user.id || req.user.userId) }]
    });

    res.status(201).json(agreement);
  } catch (error) {
    console.error('Error generating agreement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/room-agreements/:bookingId
router.get('/:bookingId', auth, async (req, res) => {
  try {
    const agreement = await RoomRentalAgreement.findOne({ booking: req.params.bookingId });
    if (!agreement) return res.status(404).json({ message: 'Agreement not found.' });

    // Check auth
    if (agreement.owner.toString() !== (req.user.id || req.user.userId) && agreement.renter.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(agreement);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/room-agreements/:id/sign
router.put('/:id/sign', auth, async (req, res) => {
  try {
    const agreement = await RoomRentalAgreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found.' });

    const userId = (req.user.id || req.user.userId);
    let updated = false;

    if (agreement.owner.toString() === userId) {
      agreement.ownerSignDate = new Date();
      updated = true;
    } else if (agreement.renter.toString() === userId) {
      agreement.renterSignDate = new Date();
      updated = true;
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (agreement.ownerSignDate && agreement.renterSignDate) {
      agreement.status = 'Signed';
    }

    await agreement.save();
    res.json(agreement);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
