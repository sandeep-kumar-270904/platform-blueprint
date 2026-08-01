const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const RoomBooking = require('../models/RoomBooking');
const RoomRental = require('../models/RoomRental');
const Notification = require('../models/Notification');
const User = require('../models/User');

// POST /api/room-bookings/ - Create booking
router.post('/', auth, isNotBanned, async (req, res) => {
  try {
    const { roomId, moveInDate, durationMonths, depositAmount } = req.body;
    const room = await RoomRental.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    if (room.lister.toString() === (req.user.id || req.user.userId)) {
      return res.status(400).json({ message: 'You cannot book your own room.' });
    }

    const booking = new RoomBooking({
      room: roomId,
      renter: (req.user.id || req.user.userId),
      owner: room.lister,
      moveInDate,
      durationMonths,
      depositAmount
    });

    await booking.save();

    // Notify owner
    const ownerUser = await User.findById(room.lister).select('notificationPreferences');
    const pref = ownerUser?.notificationPreferences?.roomRentals?.booking_updates || 'instant';
    
    if (pref !== 'off') {
      await Notification.create({
        userId: room.lister,
        type: 'room_booking_received',
        message: `You received a new booking request for ${room.title}.`,
        relatedContentId: booking._id,
        actors: [{ userId: (req.user.id || req.user.userId) }],
        isDigest: pref === 'digest'
      });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/room-bookings/renter - Get sent bookings
router.get('/renter', auth, async (req, res) => {
  try {
    const bookings = await RoomBooking.find({ renter: (req.user.id || req.user.userId) })
      .populate('room', 'title location rent photos')
      .populate('owner', 'name email profilePicture')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/room-bookings/owner - Get received bookings
router.get('/owner', auth, async (req, res) => {
  try {
    const bookings = await RoomBooking.find({ owner: (req.user.id || req.user.userId) })
      .populate('room', 'title location rent photos')
      .populate('renter', 'name email profilePicture')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/room-bookings/:id/respond - Accept/Reject booking
router.put('/:id/respond', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await RoomBooking.findOneAndUpdate(
      { _id: req.params.id, owner: (req.user.id || req.user.userId), status: 'Pending' },
      { $set: { status } },
      { new: true }
    ).populate('room', 'title');

    if (!booking) return res.status(404).json({ message: 'Booking not found or already processed.' });

    if (status === 'Accepted') {
      // Mark room as Rented
      await RoomRental.findByIdAndUpdate(booking.room._id, { status: 'Rented' });
      
      // Cancel other pending bookings for this room
      await RoomBooking.updateMany(
        { room: booking.room._id, status: 'Pending' },
        { $set: { status: 'Rejected' } }
      );
    }

    // Notify renter
    const renterUser = await User.findById(booking.renter).select('notificationPreferences');
    const pref = renterUser?.notificationPreferences?.roomRentals?.booking_updates || 'instant';

    if (pref !== 'off') {
      await Notification.create({
        userId: booking.renter,
        type: 'room_booking_response',
        message: `Your booking request for ${booking.room.title} was ${status.toLowerCase()}.`,
        relatedContentId: booking._id,
        actors: [{ userId: (req.user.id || req.user.userId) }],
        isDigest: pref === 'digest'
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error responding to booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/room-bookings/:id/cancel - Renter cancels booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await RoomBooking.findOneAndUpdate(
      { _id: req.params.id, renter: (req.user.id || req.user.userId), status: { $in: ['Pending', 'Accepted'] } },
      { $set: { status: 'Cancelled' } },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found or cannot be cancelled.' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/room-bookings/:id/pay - Sandbox payment
router.put('/:id/pay', auth, async (req, res) => {
  try {
    const booking = await RoomBooking.findOneAndUpdate(
      { _id: req.params.id, renter: (req.user.id || req.user.userId), status: 'Accepted' },
      { $set: { paymentStatus: 'Paid' } },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not eligible for payment.' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
