const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Hostel = require('../models/Hostel');
const HostelInquiry = require('../models/HostelInquiry');
const Notification = require('../models/Notification');
const User = require('../models/User');
const HostelReport = require('../models/HostelReport');
const HostelReview = require('../models/HostelReview');
const HostelReviewReport = require('../models/HostelReviewReport');
const auth = require('../middleware/auth');

// Configure multer storage for hostels
const uploadDir = path.join(__dirname, '../uploads/hostels');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// GET all hostels
router.get('/', async (req, res) => {
  try {
    const { search, minPrice, maxPrice, type, amenities, roomTypes } = req.query;
    let query = {};

    // 1. Search (name, description, location)
    if (search) {
      const sanitizedSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
        { address: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }

    // 2. Filter by Price Range (based on starting room price / pricing field)
    if (minPrice || maxPrice) {
      query.pricing = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        query.pricing.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        query.pricing.$lte = Number(maxPrice);
      }
    }

    // 3. Filter by Hostel Type
    if (type && type !== 'all') {
      query.type = type;
    }

    // 4. Filter by Amenities (must have ALL selected)
    if (amenities) {
      let amenitiesArray = [];
      if (Array.isArray(amenities)) {
        amenitiesArray = amenities;
      } else if (typeof amenities === 'string') {
        amenitiesArray = amenities.split(',');
      }
      if (amenitiesArray.length > 0) {
        query.amenities = { $all: amenitiesArray };
      }
    }

    // 5. Filter by Room Type Availability
    if (roomTypes) {
      let roomTypesArray = [];
      if (Array.isArray(roomTypes)) {
        roomTypesArray = roomTypes;
      } else if (typeof roomTypes === 'string') {
        roomTypesArray = roomTypes.split(',');
      }
      if (roomTypesArray.length > 0) {
        query['roomTypes.type'] = { $in: roomTypesArray };
      }
    }

    // 6. Only return verified hostels for the public feed
    query.verificationStatus = 'verified';

    // 7. Filter out full hostels by default unless explicitly included
    if (req.query.includeFull !== 'true') {
      query.isFull = { $ne: true };
    }

    const hostels = await Hostel.find(query).sort({ createdAt: -1 });
    res.json(hostels);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/hostels/admin/all - Admin fetch all hostels (including unverified)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin only' });
    }
    const hostels = await Hostel.find().sort({ createdAt: -1 });
    res.json(hostels);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/hostels/:id - Remove listing (Admin or Owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });
    
    // Check ownership or admin status
    if (hostel.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this listing' });
    }
    
    const ownerId = hostel.ownerId;
    const hostelName = hostel.name;
    
    await Hostel.findByIdAndDelete(req.params.id);
    
    // Clean up related data (inquiries, reports, saves)
    try {
      await HostelInquiry.deleteMany({ hostelId: req.params.id });
      await HostelReport.deleteMany({ hostelId: req.params.id });
      await User.updateMany(
        { savedHostels: req.params.id },
        { $pull: { savedHostels: req.params.id } }
      );
    } catch (cleanupErr) {
      console.error('Error cleaning up related hostel data:', cleanupErr.message);
    }
    
    // Notify owner if deleted by admin
    if (req.user.role === 'admin' && req.user.id !== ownerId.toString()) {
      const notification = new Notification({
        userId: ownerId,
        title: 'Listing Removed',
        message: `Your hostel listing "${hostelName}" has been removed for policy violations.`,
        type: 'hostel_removed'
      });
      await notification.save();
    }
    
    res.json({ msg: 'Hostel removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// OWNER ENDPOINTS
// ==========================================

// GET /api/hostels/owner/listings - Fetch logged-in user's listings
router.get('/owner/listings', auth, async (req, res) => {
  try {
    const hostels = await Hostel.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json(hostels);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/hostels/:id/availability - Toggle full status
router.put('/:id/availability', auth, async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });

    if (hostel.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    hostel.isFull = req.body.isFull;
    await hostel.save();

    res.json(hostel);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/hostels/:id - Edit listing
router.put('/:id', [auth, upload.array('photos', 5)], async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });

    if (hostel.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized: only the owner can edit this listing' });
    }

    let parsedRoomTypes = [];
    let parsedAmenities = [];
    let existingPhotos = [];
    let parsedMealPlan = {};
    let parsedHouseRules = {};
    let parsedDeposit = {};
    
    try {
      parsedRoomTypes = req.body.roomTypes ? JSON.parse(req.body.roomTypes) : [];
      parsedAmenities = req.body.amenities ? JSON.parse(req.body.amenities) : [];
      existingPhotos = req.body.existingPhotos ? JSON.parse(req.body.existingPhotos) : [];
      parsedMealPlan = req.body.mealPlan ? JSON.parse(req.body.mealPlan) : {};
      parsedHouseRules = req.body.houseRules ? JSON.parse(req.body.houseRules) : {};
      parsedDeposit = req.body.deposit ? JSON.parse(req.body.deposit) : {};
    } catch (e) {
      parsedRoomTypes = req.body.roomTypes || [];
      parsedAmenities = req.body.amenities || [];
      existingPhotos = req.body.existingPhotos || [];
      parsedMealPlan = req.body.mealPlan || {};
      parsedHouseRules = req.body.houseRules || {};
      parsedDeposit = req.body.deposit || {};
    }

    const { name, description, address, type, pricing, totalCapacity, availableBeds, coverPhotoIndex } = req.body;
    const numericPricing = Number(pricing);

    if (parsedDeposit && parsedDeposit.amount !== undefined) {
      if (Number(parsedDeposit.amount) < 0) {
        return res.status(400).json({ msg: 'Deposit amount cannot be negative.' });
      }
    }

    // Revert verification if core details changed
    let verificationStatus = hostel.verificationStatus;
    if (hostel.verificationStatus === 'verified') {
      if (hostel.address !== address || hostel.pricing !== numericPricing || hostel.type !== type) {
        verificationStatus = 'pending';
      }
    }

    // Geocode if address changed
    let location = hostel.location;
    if (hostel.address !== address) {
      location = { lat: 0, lng: 0 };
      try {
        const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: { format: 'json', q: address, limit: 1 },
          headers: { 'User-Agent': 'StudentHub-App' }
        });
        if (geoRes.data && geoRes.data.length > 0) {
          location.lat = parseFloat(geoRes.data[0].lat);
          location.lng = parseFloat(geoRes.data[0].lon);
        }
      } catch (geoErr) {
        console.error('Geocoding error:', geoErr.message);
      }
    }

    let photoUrls = [...existingPhotos];
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => `/uploads/hostels/${file.filename}`);
      photoUrls = [...photoUrls, ...newPhotos];
    }

    hostel.name = name;
    hostel.description = description;
    hostel.address = address;
    hostel.type = type;
    hostel.pricing = numericPricing;
    hostel.totalCapacity = Number(totalCapacity);
    hostel.availableBeds = Number(availableBeds) || 0;
    hostel.roomTypes = parsedRoomTypes;
    hostel.amenities = parsedAmenities;
    hostel.mealPlan = parsedMealPlan;
    hostel.houseRules = parsedHouseRules;
    hostel.deposit = parsedDeposit;
    hostel.coverPhotoIndex = Number(coverPhotoIndex) || 0;
    hostel.photos = photoUrls.slice(0, 5); // Max 5
    hostel.location = location;
    hostel.verificationStatus = verificationStatus;

    const updatedHostel = await hostel.save();
    res.json(updatedHostel);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/hostels/:id/report - Report a listing
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ msg: 'Reason is required' });
    
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });
    
    // Deduplication check
    const existingReport = await HostelReport.findOne({ hostelId: hostel._id, reporterId: req.user.id });
    if (existingReport) {
      return res.status(400).json({ msg: 'You have already reported this listing' });
    }
    
    const report = new HostelReport({
      hostelId: hostel._id,
      reporterId: req.user.id,
      reason
    });
    await report.save();
    
    res.json({ msg: 'Report submitted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET a single hostel by ID
router.get('/:id', async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });
    
    // Check if user is authenticated manually
    const token = req.header('x-auth-token');
    let isAuthenticated = false;
    if (token) {
      const jwt = require('jsonwebtoken');
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        isAuthenticated = true;
      } catch (err) {
        // invalid token, treat as unauthenticated
      }
    }

    const hostelObj = hostel.toObject();
    
    if (isAuthenticated) {
      // Mocked owner contact info for now, normally populated from User
      hostelObj.ownerContact = {
        phone: "+91 9876543210",
        email: "owner@hostel.com"
      };
    }

    res.json(hostelObj);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Hostel not found' });
    res.status(500).send('Server Error');
  }
});

// POST a new hostel
router.post('/', [auth, upload.array('photos', 5)], async (req, res) => {
  try {
    let parsedRoomTypes = [];
    let parsedAmenities = [];
    let parsedMealPlan = {};
    let parsedHouseRules = {};
    let parsedDeposit = {};
    
    try {
      parsedRoomTypes = req.body.roomTypes ? JSON.parse(req.body.roomTypes) : [];
      parsedAmenities = req.body.amenities ? JSON.parse(req.body.amenities) : [];
      parsedMealPlan = req.body.mealPlan ? JSON.parse(req.body.mealPlan) : {};
      parsedHouseRules = req.body.houseRules ? JSON.parse(req.body.houseRules) : {};
      parsedDeposit = req.body.deposit ? JSON.parse(req.body.deposit) : {};
    } catch (e) {
      // Fallback if they were sent as arrays or simple strings
      parsedRoomTypes = req.body.roomTypes || [];
      parsedAmenities = req.body.amenities || [];
      parsedMealPlan = req.body.mealPlan || {};
      parsedHouseRules = req.body.houseRules || {};
      parsedDeposit = req.body.deposit || {};
    }

    const {
      name,
      description,
      address,
      type,
      pricing,
      totalCapacity,
      availableBeds,
      coverPhotoIndex
    } = req.body;

    // Server-side validations
    if (!name || !description || !address || !type || !pricing || !totalCapacity) {
      return res.status(400).json({ msg: 'Please provide all required fields.' });
    }

    const numericPricing = Number(pricing);
    const numericCapacity = Number(totalCapacity);
    const numericAvailable = Number(availableBeds);

    if (numericPricing < 0) {
      return res.status(400).json({ msg: 'Pricing cannot be negative.' });
    }

    if (numericCapacity <= 0) {
      return res.status(400).json({ msg: 'Total capacity must be greater than zero.' });
    }
    
    if (numericAvailable < 0 || numericAvailable > numericCapacity) {
      return res.status(400).json({ msg: 'Available beds must be between 0 and total capacity.' });
    }

    if (parsedDeposit && parsedDeposit.amount !== undefined) {
      if (Number(parsedDeposit.amount) < 0) {
        return res.status(400).json({ msg: 'Deposit amount cannot be negative.' });
      }
    }

    // Process uploaded photos
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      photoUrls = req.files.map(file => `/uploads/hostels/${file.filename}`);
    }

    // Geocode address
    let location = { lat: 0, lng: 0 };
    try {
      const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { format: 'json', q: address, limit: 1 },
        headers: { 'User-Agent': 'StudentHub-App' }
      });
      if (geoRes.data && geoRes.data.length > 0) {
        location.lat = parseFloat(geoRes.data[0].lat);
        location.lng = parseFloat(geoRes.data[0].lon);
      }
    } catch (geoErr) {
      console.error('Geocoding error:', geoErr.message);
    }

    const newHostel = new Hostel({
      ownerId: req.user.id,
      name,
      description,
      address,
      location,
      type,
      pricing: numericPricing,
      roomTypes: parsedRoomTypes,
      amenities: parsedAmenities,
      mealPlan: parsedMealPlan,
      houseRules: parsedHouseRules,
      deposit: parsedDeposit,
      coverPhotoIndex: Number(coverPhotoIndex) || 0,
      totalCapacity: numericCapacity,
      availableBeds: numericAvailable || 0,
      photos: photoUrls
    });

    const hostel = await newHostel.save();
    res.json(hostel);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// INQUIRY ENDPOINTS
// ==========================================

// POST /api/hostels/:id/inquiries - Send an inquiry
router.post('/:id/inquiries', auth, async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });

    // Prevent owners from sending inquiries to their own hostels
    if (hostel.ownerId.toString() === req.user.id) {
      return res.status(400).json({ msg: 'You cannot send an inquiry to your own hostel' });
    }

    const { name, preferredRoomType, moveInDate, message } = req.body;

    const newInquiry = new HostelInquiry({
      hostelId: hostel._id,
      senderId: req.user.id,
      ownerId: hostel.ownerId,
      name,
      preferredRoomType,
      moveInDate,
      message
    });

    const savedInquiry = await newInquiry.save();

    // Notify the owner
    try {
      const notification = new Notification({
        userId: hostel.ownerId,
        type: 'hostel_inquiry_received',
        message: `You have received a new booking inquiry for ${hostel.name} from ${name}.`,
        metadata: { inquiryId: savedInquiry._id, hostelId: hostel._id },
        isRead: false
      });
      await notification.save();
    } catch (notifErr) {
      console.error('Error saving notification:', notifErr.message);
    }

    res.json(savedInquiry);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/hostels/inquiries/sent - Get inquiries sent by the logged-in user
router.get('/inquiries/sent', auth, async (req, res) => {
  try {
    const inquiries = await HostelInquiry.find({ senderId: req.user.id })
      .populate('hostelId', 'name type pricing')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/hostels/inquiries/received - Get inquiries received by the logged-in user's hostels
router.get('/inquiries/received', auth, async (req, res) => {
  try {
    const inquiries = await HostelInquiry.find({ ownerId: req.user.id })
      .populate('hostelId', 'name type')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/hostels/inquiries/:id/respond - Mark an inquiry as responded
router.put('/inquiries/:id/respond', auth, async (req, res) => {
  try {
    const inquiry = await HostelInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ msg: 'Inquiry not found' });

    // Check authorization
    if (inquiry.ownerId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to respond to this inquiry' });
    }

    if (inquiry.status === 'responded') {
      return res.status(400).json({ msg: 'Inquiry is already marked as responded' });
    }

    inquiry.status = 'responded';
    await inquiry.save();

    // Find hostel to include name in notification
    const hostel = await Hostel.findById(inquiry.hostelId);

    // Notify the sender
    try {
      const notification = new Notification({
        userId: inquiry.senderId,
        type: 'hostel_inquiry_responded',
        message: `The owner of ${hostel ? hostel.name : 'a hostel'} has responded to your inquiry.`,
        metadata: { inquiryId: inquiry._id, hostelId: inquiry.hostelId },
        isRead: false
      });
      await notification.save();
    } catch (notifErr) {
      console.error('Error saving notification:', notifErr.message);
    }

    res.json(inquiry);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// ==========================================
// VERIFICATION & SAVED HOSTEL ENDPOINTS
// ==========================================

// GET /api/hostels/saved - Get saved hostels
router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedHostels');
    res.json(user.savedHostels || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/hostels/:id/save - Save a hostel
router.post('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.savedHostels.includes(req.params.id)) {
      user.savedHostels.push(req.params.id);
      await user.save();
    }
    res.json(user.savedHostels);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/hostels/:id/save - Unsave a hostel
router.delete('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedHostels = user.savedHostels.filter(id => id.toString() !== req.params.id);
    await user.save();
    res.json(user.savedHostels);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/hostels/:id/request-verification - Request verification
router.post('/:id/request-verification', auth, async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });
    if (hostel.ownerId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    hostel.verificationStatus = 'pending';
    await hostel.save();
    res.json(hostel);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/hostels/:id/verify - Verify hostel (admin only)
router.put('/:id/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin only' });
    }
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });
    
    hostel.verificationStatus = req.body.status || 'verified'; 
    await hostel.save();

    // Notify owner
    try {
      if (hostel.verificationStatus === 'verified') {
        const notification = new Notification({
          userId: hostel.ownerId,
          type: 'hostel_verified',
          message: `Your hostel listing "${hostel.name}" has been verified!`,
          metadata: { hostelId: hostel._id },
          isRead: false
        });
        await notification.save();
      }
    } catch (notifErr) {
      console.error('Error saving notification:', notifErr.message);
    }

    res.json(hostel);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// ADMIN: REVIEW REPORTS
// ==========================================
router.get('/admin/review-reports', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized. Admin only.' });
    }

    const reports = await HostelReviewReport.find()
      .populate('reporterId', 'full_name email')
      .populate({
        path: 'reviewId',
        populate: [
          { path: 'userId', select: 'full_name' },
          { path: 'hostelId', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// REVIEWS & RATINGS
// ==========================================

// Helper function to recompute hostel rating
const recomputeHostelRating = async (hostelId) => {
  const reviews = await HostelReview.find({ hostelId });
  const reviewCount = reviews.length;
  const rating = reviewCount > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
    : 0;
  
  await Hostel.findByIdAndUpdate(hostelId, { rating, reviewCount });
};

// GET /api/hostels/:id/reviews - Fetch reviews for a hostel
router.get('/:id/reviews', auth, async (req, res) => {
  try {
    const reviews = await HostelReview.find({ hostelId: req.params.id })
      .populate('userId', 'full_name avatar_url university')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/hostels/:id/reviews - Add a review
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ msg: 'Rating and comment required' });
    
    // Enforce inquiry history
    const inquiry = await HostelInquiry.findOne({ hostelId: req.params.id, senderId: req.user.id });
    if (!inquiry) {
      return res.status(403).json({ msg: 'You must inquire about this hostel before leaving a review.' });
    }

    const newReview = new HostelReview({
      hostelId: req.params.id,
      userId: req.user.id,
      rating,
      comment
    });

    await newReview.save();
    await recomputeHostelRating(req.params.id);

    try {
      const hostel = await Hostel.findById(req.params.id);
      if (hostel && hostel.ownerId.toString() !== req.user.id) {
        const notification = new Notification({
          userId: hostel.ownerId,
          type: 'hostel_review_received',
          message: `Your hostel "${hostel.name}" received a new ${rating}-star review.`,
          metadata: { hostelId: hostel._id, reviewId: newReview._id },
          isRead: false
        });
        await notification.save();
      }
    } catch (notifErr) {
      console.error('Error saving review notification:', notifErr.message);
    }

    const populatedReview = await newReview.populate('userId', 'full_name avatar_url university');
    res.json(populatedReview);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'You have already reviewed this hostel' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/hostels/reviews/:reviewId - Edit review
router.put('/reviews/:reviewId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await HostelReview.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ msg: 'Review not found' });
    
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to edit this review' });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    
    await review.save();
    await recomputeHostelRating(review.hostelId);

    const populatedReview = await review.populate('userId', 'full_name avatar_url university');
    res.json(populatedReview);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/hostels/reviews/:reviewId - Delete review
router.delete('/reviews/:reviewId', auth, async (req, res) => {
  try {
    const review = await HostelReview.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ msg: 'Review not found' });
    
    if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const hostelId = review.hostelId;
    await HostelReview.findByIdAndDelete(req.params.reviewId);
    await recomputeHostelRating(hostelId);

    res.json({ msg: 'Review deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/hostels/reviews/:reviewId/report - Report a review
router.post('/reviews/:reviewId/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ msg: 'Reason is required' });

    const report = new HostelReviewReport({
      reviewId: req.params.reviewId,
      reporterId: req.user.id,
      reason
    });

    await report.save();
    res.json({ msg: 'Review reported successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'You have already reported this review' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/hostels/owner/:ownerId/reputation - Get aggregated owner rating
router.get('/owner/:ownerId/reputation', auth, async (req, res) => {
  try {
    const hostels = await Hostel.find({ ownerId: req.params.ownerId });
    if (!hostels.length) return res.json({ rating: 0, reviewCount: 0 });

    let totalRating = 0;
    let totalReviews = 0;

    hostels.forEach(h => {
      totalRating += (h.rating * h.reviewCount);
      totalReviews += h.reviewCount;
    });

    const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;
    res.json({ rating: averageRating, reviewCount: totalReviews });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
