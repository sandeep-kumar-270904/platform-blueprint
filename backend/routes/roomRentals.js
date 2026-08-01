const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const isNotBanned = require('../middleware/isNotBanned');
const RoomRental = require('../models/RoomRental');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const sanitize = require('../middleware/sanitize');
const { listingCreationLimiter, inquiryLimiter, reportLimiter } = require('../middleware/rateLimiter');
const axios = require('axios');

// Optional auth middleware
const optionalAuth = (req, res, next) => {
  let token = req.cookies?.accessToken;
  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  }
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, "supersecret_antigravity_jwt_key_2026" || 'your-secret-key');
    req.user = { userId: decoded.id || decoded._id };
  } catch (err) {}
  next();
};

// Get all room rentals for Admin
router.get('/admin/all', auth, admin, async (req, res) => {
  try {
    const rentals = await RoomRental.find()
      .populate('lister', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .lean();
      
    const RoomRentalReview = require('../models/RoomRentalReview');
    const roomIds = rentals.map(r => r._id);
    const aggregates = await RoomRentalReview.aggregate([
      { $match: { room: { $in: roomIds } } },
      { $group: { _id: '$room', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    const statsMap = aggregates.reduce((acc, curr) => {
      acc[curr._id.toString()] = { avgRating: curr.avgRating, count: curr.count };
      return acc;
    }, {});

    const rentalsWithStats = rentals.map(r => ({
      ...r,
      reviewStats: statsMap[r._id.toString()] || { avgRating: 0, count: 0 }
    }));
      
    res.json(rentalsWithStats);
  } catch (error) {
    console.error('Error fetching admin rentals:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all room rentals (with search & filters)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, minRent, maxRent, roomType, minBeds, maxDate, includeRented, includeExpired, lat, lng, radius } = req.query;
    
    let query = {};
    
    if (includeRented !== 'true') {
      query.status = 'Available';
    }
    
    if (includeExpired !== 'true') {
      // Exclude expired (where moveInDate has passed) by only showing if moveInDate >= today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.moveInDate = { $gte: today };
    }
    
    if (search) {
      // Escape regex special chars to prevent injection/ReDoS
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { location: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent && !isNaN(minRent)) query.rent.$gte = Number(minRent);
      if (maxRent && !isNaN(maxRent)) query.rent.$lte = Number(maxRent);
    }
    
    if (roomType && roomType !== 'All') {
      query.roomType = roomType;
    }
    
    if (minBeds && !isNaN(minBeds)) {
      query.availableBeds = { $gte: Number(minBeds) };
    }
    
    if (maxDate) {
      const parsedDate = new Date(maxDate);
      if (!isNaN(parsedDate.getTime())) {
        query.moveInDate = { ...query.moveInDate, $lte: parsedDate };
      }
    }

    if (lat && lng && radius) {
      const radiusInMiles = Number(radius);
      // Rough approximation: 1 degree latitude = ~69 miles
      const latDelta = radiusInMiles / 69;
      // Longitude delta depends on latitude
      const lngDelta = radiusInMiles / (69 * Math.cos(Number(lat) * (Math.PI / 180)));
      
      query['coordinates.lat'] = { $gte: Number(lat) - latDelta, $lte: Number(lat) + latDelta };
      query['coordinates.lng'] = { $gte: Number(lng) - lngDelta, $lte: Number(lng) + lngDelta };
    }

    // Blocking exclusion
    if (req.user) {
      const User = require('../models/User');
      const currentUser = await User.findById(req.user.userId || req.user.id).select('blocked_users blocked_by');
      if (currentUser) {
        const blockedUsers = currentUser.blocked_users || [];
        const blockedBy = currentUser.blocked_by || [];
        const excludedListers = [...blockedUsers, ...blockedBy];
        if (excludedListers.length > 0) {
          query.lister = { $nin: excludedListers };
        }
      }
    }

    const rentals = await RoomRental.find(query)
      .populate('lister', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .lean();
      
    const RoomRentalReview = require('../models/RoomRentalReview');
    const roomIds = rentals.map(r => r._id);
    const aggregates = await RoomRentalReview.aggregate([
      { $match: { room: { $in: roomIds } } },
      { $group: { _id: '$room', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    const statsMap = aggregates.reduce((acc, curr) => {
      acc[curr._id.toString()] = { avgRating: curr.avgRating, count: curr.count };
      return acc;
    }, {});

    const RoommateProfile = require('../models/RoommateProfile');
    const listerIds = rentals.map(r => r.lister._id);
    const profiles = await RoommateProfile.find({ user: { $in: listerIds } }).select('_id user').lean();
    const profileMap = profiles.reduce((acc, curr) => {
      acc[curr.user.toString()] = curr._id.toString();
      return acc;
    }, {});

    const rentalsWithStats = rentals.map(r => {
      return {
        ...r,
        // Return the permanently jittered coordinates stored in the DB, not the exact ones
        coordinates: r.jitteredCoordinates || { lat: r.coordinates?.lat, lng: r.coordinates?.lng },
        reviewStats: statsMap[r._id.toString()] || { avgRating: 0, count: 0 },
        lister: {
          ...r.lister,
          roommateProfileId: profileMap[r.lister._id.toString()] || null
        }
      };
    });
      
    res.json(rentalsWithStats);
  } catch (error) {
    console.error('Error fetching room rentals:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Helper to geocode a location string using OpenStreetMap Nominatim
async function geocodeLocation(locationString) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: locationString,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'StudentHub/1.0 (contact@studenthub.com)' // required by Nominatim terms
      }
    });
    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
  }
  // Fallback to a default central coordinate if geocoding fails, 
  // or return null to indicate manual review needed (we'll return a safe default)
  return { lat: 40.7128, lng: -74.0060 };
}

// Create new room rental
router.post('/', auth, isNotBanned, sanitize, listingCreationLimiter, async (req, res) => {
  try {
    const { title, description, rent, roomType, location, coordinates, availableBeds, moveInDate, photos, amenities, utilitiesIncluded, utilitiesNote } = req.body;

    let finalCoordinates = coordinates;
    if (!finalCoordinates && location) {
      finalCoordinates = await geocodeLocation(location);
    }
    
    let jitteredCoordinates = undefined;
    if (finalCoordinates && finalCoordinates.lat && finalCoordinates.lng) {
      jitteredCoordinates = {
        lat: finalCoordinates.lat + (Math.random() - 0.5) * 0.01,
        lng: finalCoordinates.lng + (Math.random() - 0.5) * 0.01
      };
    }

    const newRoom = new RoomRental({
      lister: (req.user.id || req.user.userId),
      title,
      description,
      rent: Number(rent),
      roomType,
      location,
      coordinates: finalCoordinates,
      jitteredCoordinates,
      availableBeds: Number(availableBeds),
      moveInDate: new Date(moveInDate),
      photos: Array.isArray(photos) ? photos : [],
      amenities: Array.isArray(amenities) ? amenities : [],
      utilitiesIncluded: Boolean(utilitiesIncluded),
      utilitiesNote
    });

    await newRoom.save();
    
    // Populate lister info so the frontend has it immediately
    await newRoom.populate('lister', 'name email profilePicture');
    
    // Check for matching search alerts
    const RoomSearchAlert = require('../models/RoomSearchAlert');
    const Notification = require('../models/Notification');
    
    // Build query for matching alerts
    const alertQuery = { isActive: true, user: { $ne: req.user.id } }; // don't alert the lister
    
    const activeAlerts = await RoomSearchAlert.find(alertQuery);
    const notificationsToCreate = [];
    
    for (const alert of activeAlerts) {
      let isMatch = true;
      if (alert.criteria) {
        if (alert.criteria.maxRent && newRoom.rent > alert.criteria.maxRent) isMatch = false;
        if (alert.criteria.minBeds && newRoom.availableBeds < alert.criteria.minBeds) isMatch = false;
        if (alert.criteria.roomType && alert.criteria.roomType !== 'All' && newRoom.roomType !== alert.criteria.roomType) isMatch = false;
        if (alert.criteria.location) {
          const locRegex = new RegExp(alert.criteria.location, 'i');
          if (!locRegex.test(newRoom.location)) isMatch = false;
        }
      }
      
      if (isMatch) {
        notificationsToCreate.push({
          userId: alert.user,
          type: 'room_rental_alert_match',
          message: `A new room matching your alert "${alert.title}" was just listed in ${newRoom.location} for $${newRoom.rent}/mo!`,
          actionUrl: `/room-rentals?room=${newRoom._id}`, // simplified deep link
          channel: 'in_app'
        });
      }
    }
    
    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate).catch(err => console.error('Error creating alert notifications:', err));
    }
    
    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error creating room rental:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

const User = require('../models/User');

// Get current user's analytics (owner)
router.get('/me/analytics', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const listings = await RoomRental.find({ lister: userId }).select('_id');
    const listingIds = listings.map(l => l._id);

    const RoomInquiry = require('../models/RoomInquiry');
    const RoomBooking = require('../models/RoomBooking');

    const totalViews = listings.reduce((acc, l) => acc + (l.views || 0), 0); // Assuming views field might exist later, or just 0
    const totalInquiries = await RoomInquiry.countDocuments({ room: { $in: listingIds } });
    const totalBookings = await RoomBooking.countDocuments({ room: { $in: listingIds }, status: 'Accepted' });

    res.json({
      activeListings: listings.length,
      totalViews,
      totalInquiries,
      totalBookings
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get current user's listings
router.get('/me/listings', auth, async (req, res) => {
  try {
    const rentals = await RoomRental.find({ lister: (req.user.id || req.user.userId) })
      .sort({ createdAt: -1 })
      .lean();
      
    const RoomRentalReview = require('../models/RoomRentalReview');
    const roomIds = rentals.map(r => r._id);
    const aggregates = await RoomRentalReview.aggregate([
      { $match: { room: { $in: roomIds } } },
      { $group: { _id: '$room', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    const statsMap = aggregates.reduce((acc, curr) => {
      acc[curr._id.toString()] = { avgRating: curr.avgRating, count: curr.count };
      return acc;
    }, {});

    const rentalsWithStats = rentals.map(r => ({
      ...r,
      reviewStats: statsMap[r._id.toString()] || { avgRating: 0, count: 0 }
    }));
      
    res.json(rentalsWithStats);
  } catch (error) {
    console.error('Error fetching my listings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get current user's saved listings
router.get('/me/saved', auth, async (req, res) => {
  try {
    const user = await User.findById((req.user.id || req.user.userId)).populate({
      path: 'savedRoomRentals',
      populate: { path: 'lister', select: 'name email profilePicture' }
    });
    res.json(user.savedRoomRentals || []);
  } catch (error) {
    console.error('Error fetching saved listings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

const RoomInquiry = require('../models/RoomInquiry');

// --- INQUIRIES ---

// Create an inquiry
router.post('/inquiries', isNotBanned, auth, sanitize, inquiryLimiter, async (req, res) => {
  try {
    const { roomId, message, moveInDate } = req.body;
    
    if (!roomId || !message) {
      return res.status(400).json({ message: 'Validation Failed: Missing roomId or message.' });
    }

    const room = await RoomRental.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.lister.toString() === (req.user.id || req.user.userId)) {
      return res.status(400).json({ message: 'You cannot inquire about your own listing.' });
    }

    const newInquiry = new RoomInquiry({
      room: roomId,
      sender: (req.user.id || req.user.userId),
      receiver: room.lister,
      message,
      moveInDate,
    });

    await newInquiry.save();

    // Notify the listing owner
    try {
      const ownerUser = await User.findById(room.lister).select('notificationPreferences');
      const pref = ownerUser?.notificationPreferences?.roomRentals?.inquiry_responses || 'instant';
      
      if (pref !== 'off') {
        await Notification.create({
          userId: room.lister,
          type: 'room_rental_inquiry_received',
          message: `You have received a new inquiry on your room rental: ${room.title}`,
          relatedContentId: newInquiry._id,
          actors: [{ userId: (req.user.id || req.user.userId) }],
          isDigest: pref === 'digest'
        });
      }
    } catch (notifErr) {
      console.error('Error sending notification for room rental inquiry:', notifErr);
    }

    res.status(201).json(newInquiry);
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get sent inquiries
router.get('/inquiries/sent', auth, async (req, res) => {
  try {
    const inquiries = await RoomInquiry.find({ sender: (req.user.id || req.user.userId) })
      .populate('room', 'title photos rent location moveInDate')
      .populate('receiver', 'name email profilePicture')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching sent inquiries:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get received inquiries
router.get('/inquiries/received', auth, async (req, res) => {
  try {
    const inquiries = await RoomInquiry.find({ receiver: (req.user.id || req.user.userId) })
      .populate('room', 'title photos rent location moveInDate')
      .populate('sender', 'name email profilePicture')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching received inquiries:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update inquiry status and reply
router.put('/inquiries/:id/status', auth, async (req, res) => {
  try {
    const { status, replyMessage } = req.body;
    const inquiry = await RoomInquiry.findById(req.params.id).populate('room', 'title');
    
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    
    // Only receiver can update status
    if (inquiry.receiver.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    inquiry.status = status;
    if (replyMessage) {
      inquiry.replyMessage = replyMessage;
      inquiry.repliedAt = Date.now();
    }
    
    await inquiry.save();

    // Notify the original sender if status is set to Responded
    if (status === 'Responded') {
      try {
        const renterUser = await User.findById(inquiry.sender).select('notificationPreferences');
        const pref = renterUser?.notificationPreferences?.roomRentals?.inquiry_responses || 'instant';
        
        if (pref !== 'off') {
          await Notification.create({
            userId: inquiry.sender,
            type: 'room_rental_inquiry_responded',
            message: `The owner has responded to your inquiry regarding: ${inquiry.room.title}`,
            relatedContentId: inquiry._id,
            actors: [{ userId: (req.user.id || req.user.userId) }],
            isDigest: pref === 'digest'
          });
        }
      } catch (notifErr) {
        console.error('Error sending notification for room rental response:', notifErr);
      }
    }

    res.json(inquiry);
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get a specific room rental by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const rental = await RoomRental.findById(req.params.id)
      .populate('lister', 'name email profilePicture');
      
    if (!rental) {
      return res.status(404).json({ message: 'Room rental not found' });
    }

    const rentalObj = rental.toObject();
    
    // Hide contact details for unauthenticated requests
    if (!req.user && rentalObj.lister) {
      delete rentalObj.lister.email;
    }

    res.json(rentalObj);
  } catch (error) {
    console.error('Error fetching room rental:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update room rental (Owner)
router.put('/:id', auth, isNotBanned, sanitize, async (req, res) => {
  try {
    const { title, description, rent, roomType, location, availableBeds, moveInDate, photos, amenities, status, coordinates, utilitiesIncluded, utilitiesNote } = req.body;
    
    const room = await RoomRental.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.lister.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if core details changed to reset verification
    let resetVerification = false;
    let priceDropped = false;
    if (
      (rent && room.rent !== Number(rent)) ||
      (location && room.location !== location) ||
      (roomType && room.roomType !== roomType)
    ) {
      if (room.verificationStatus === 'Verified') {
        resetVerification = true;
      }
    }
    
    if (rent && Number(rent) < room.rent) {
      priceDropped = true;
    }

    if (title) room.title = title;
    if (description) room.description = description;
    if (rent) room.rent = Number(rent);
    if (roomType) room.roomType = roomType;
    if (location) room.location = location;
    if (availableBeds) room.availableBeds = Number(availableBeds);
    if (moveInDate) room.moveInDate = new Date(moveInDate);
    if (photos) room.photos = photos;
    if (amenities) room.amenities = amenities;
    if (status) room.status = status;
    if (utilitiesIncluded !== undefined) room.utilitiesIncluded = Boolean(utilitiesIncluded);
    if (utilitiesNote !== undefined) room.utilitiesNote = utilitiesNote;
    
    // Geocode if location changed and coordinates not explicitly provided
    let finalCoordinates = coordinates;
    if (!finalCoordinates && location && location !== room.location) {
      finalCoordinates = await geocodeLocation(location);
    }
    
    if (finalCoordinates) {
      room.coordinates = finalCoordinates;
      
      // Also recalculate jittered coordinates since the location changed
      if (finalCoordinates.lat && finalCoordinates.lng) {
        room.jitteredCoordinates = {
          lat: finalCoordinates.lat + (Math.random() - 0.5) * 0.01,
          lng: finalCoordinates.lng + (Math.random() - 0.5) * 0.01
        };
      }
    }

    if (resetVerification) {
      room.verificationStatus = 'Pending';
    }

    await room.save();
    
    if (priceDropped) {
      // Find users who have this room saved
      const savedUsers = await User.find({ savedRoomRentals: room._id }).select('_id notificationPreferences');
      const notificationsToCreate = [];
      
      for (const u of savedUsers) {
        const pref = u.notificationPreferences?.roomRentals?.price_drops || 'instant';
        if (pref !== 'off') {
          notificationsToCreate.push({
            userId: u._id,
            type: 'room_rental_price_drop',
            message: `The price for the room you saved in ${room.location} has dropped to $${room.rent}!`,
            actionUrl: `/room-rentals?room=${room._id}`,
            channel: 'in_app',
            isDigest: pref === 'digest'
          });
        }
      }
      
      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate).catch(err => console.error('Error creating price drop notifs:', err));
      }
    }

    res.json(room);
  } catch (error) {
    console.error('Error updating room rental:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete room rental (Owner)
router.delete('/:id', auth, isNotBanned, async (req, res) => {
  try {
    const room = await RoomRental.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.lister.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Cascade delete: remove room ID from all users' saved lists
    await User.updateMany(
      { savedRoomRentals: req.params.id },
      { $pull: { savedRoomRentals: req.params.id } }
    );

    // Cascade delete: remove all inquiries for this room
    await RoomInquiry.deleteMany({ room: req.params.id });

    // Delete the room itself
    await RoomRental.findByIdAndDelete(req.params.id);

    res.json({ message: 'Room rental deleted successfully' });
  } catch (error) {
    console.error('Error deleting room rental:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Save room rental (idempotent)
router.post('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById((req.user.id || req.user.userId));
    if (!user) return res.status(404).json({ message: 'User not found' });

    const roomId = req.params.id;
    const room = await RoomRental.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (!user.savedRoomRentals.includes(roomId)) {
      user.savedRoomRentals.push(roomId);
      await user.save();
    }
    
    res.json({ savedRoomRentals: user.savedRoomRentals });
  } catch (error) {
    console.error('Error saving room rental:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Unsave room rental (idempotent)
router.delete('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById((req.user.id || req.user.userId));
    if (!user) return res.status(404).json({ message: 'User not found' });

    const roomId = req.params.id;
    const savedIndex = user.savedRoomRentals.indexOf(roomId);
    
    if (savedIndex !== -1) {
      user.savedRoomRentals.splice(savedIndex, 1);
      await user.save();
    }
    
    res.json({ savedRoomRentals: user.savedRoomRentals });
  } catch (error) {
    console.error('Error unsaving room rental:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Request verification
router.post('/:id/verify', auth, async (req, res) => {
  try {
    const { proofUrl } = req.body;
    if (!proofUrl) {
      return res.status(400).json({ message: 'Verification proof document is required.' });
    }

    const room = await RoomRental.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.lister.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (room.verificationStatus === 'None' || room.verificationStatus === 'Rejected') {
      room.verificationStatus = 'Pending';
      room.verificationProof = proofUrl;
      await room.save();
    }
    
    res.json(room);
  } catch (error) {
    console.error('Error requesting verification:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Admin verify/reject listing
router.put('/:id/verify/admin', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Verified', 'Rejected', 'None'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const room = await RoomRental.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.verificationStatus = status;
    await room.save();

    if (status === 'Verified' || status === 'Rejected') {
      const ownerUser = await User.findById(room.lister).select('notificationPreferences');
      const pref = ownerUser?.notificationPreferences?.roomRentals?.booking_updates || 'instant';
      
      if (pref !== 'off') {
        const notification = new Notification({
          userId: room.lister, // Using userId instead of recipient for consistency
          recipient: room.lister, 
          sender: (req.user.id || req.user.userId),
          type: status === 'Verified' ? 'verification_approved' : 'verification_rejected',
          content: `Your room rental listing "${room.title}" has been ${status.toLowerCase()} by an administrator.`,
          message: `Your room rental listing "${room.title}" has been ${status.toLowerCase()} by an administrator.`,
          isDigest: pref === 'digest'
        });
        await notification.save();
      }
    }
    
    res.json(room);
  } catch (error) {
    console.error('Error in admin verification:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Admin delete listing
router.delete('/:id/admin', auth, admin, async (req, res) => {
  try {
    const room = await RoomRental.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Send notification to owner
    const notification = new Notification({
      recipient: room.lister,
      sender: (req.user.id || req.user.userId),
      type: 'listing_removed',
      content: `Your room rental listing "${room.title}" was removed by an administrator.`,
    });
    await notification.save();

    // Cascade delete: remove room ID from all users' saved lists
    const User = require('../models/User');
    await User.updateMany(
      { savedRoomRentals: req.params.id },
      { $pull: { savedRoomRentals: req.params.id } }
    );

    // Cascade delete: remove all inquiries for this room
    const RoomInquiry = require('../models/RoomInquiry');
    await RoomInquiry.deleteMany({ room: req.params.id });

    await RoomRental.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room rental deleted successfully' });
  } catch (error) {
    console.error('Error deleting room rental:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Report listing
router.post('/:id/report', auth, sanitize, reportLimiter, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const room = await RoomRental.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Check if already reported by this user
    if (room.reports.some(r => r.user.toString() === (req.user.id || req.user.userId))) {
      return res.status(400).json({ message: 'You have already reported this listing' });
    }

    room.reports.push({
      user: (req.user.id || req.user.userId),
      reason
    });

    await room.save();
    res.json({ message: 'Listing reported successfully' });
  } catch (error) {
    console.error('Error reporting listing:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
