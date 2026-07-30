const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const sanitize = require('../middleware/sanitize');
const rateLimit = require('express-rate-limit');
const RoommateProfile = require('../models/RoommateProfile');
const RoommateConnection = require('../models/RoommateConnection');
const Notification = require('../models/Notification');
const User = require('../models/User');

const roommateActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Too many actions, please try again later.' }
});

// Calculate compatibility score between two profiles
const calculateCompatibility = (p1, p2) => {
  let score = 0;
  
  // Budget Match (25 pts)
  const overlapMin = Math.max(p1.budgetRange.min, p2.budgetRange.min);
  const overlapMax = Math.min(p1.budgetRange.max, p2.budgetRange.max);
  if (overlapMax >= overlapMin) {
    score += 25; // Strong overlap
  } else if (p1.budgetRange.max >= p2.budgetRange.min - 100 && p1.budgetRange.min <= p2.budgetRange.max + 100) {
    score += 10; // Close match
  }

  // Location Match (25 pts)
  if (p1.preferredLocations && p2.preferredLocations && p1.preferredLocations.length > 0 && p2.preferredLocations.length > 0) {
    const commonLocations = p1.preferredLocations.filter(loc => p2.preferredLocations.includes(loc));
    if (commonLocations.length > 0) {
      score += 25; // Match found
    }
  } else if (!p1.preferredLocations?.length || !p2.preferredLocations?.length) {
    // If either has no specific preference, give partial points to not penalize
    score += 15;
  }

  // Cleanliness (15 pts)
  const cleanScores = { 'Messy': 1, 'Average': 2, 'Clean': 3, 'Neat Freak': 4 };
  const cleanDiff = Math.abs(cleanScores[p1.lifestyle_preferences.cleanliness] - cleanScores[p2.lifestyle_preferences.cleanliness]);
  if (cleanDiff === 0) score += 15;
  else if (cleanDiff === 1) score += 7;

  // Sleep Schedule (15 pts)
  if (p1.lifestyle_preferences.sleepSchedule === p2.lifestyle_preferences.sleepSchedule) score += 15;
  else if (p1.lifestyle_preferences.sleepSchedule === 'Flexible' || p2.lifestyle_preferences.sleepSchedule === 'Flexible') score += 7;

  // Smoking & Pets (20 pts)
  if (p1.lifestyle_preferences.smoking === p2.lifestyle_preferences.smoking && p1.lifestyle_preferences.pets === p2.lifestyle_preferences.pets) score += 20;
  else if (p1.lifestyle_preferences.smoking === 'No' && p2.lifestyle_preferences.smoking === 'Yes') score += 0;
  else score += 10;

  return score;
};

// GET /profile - Get own profile
router.get('/profile', auth, async (req, res) => {
  try {
    const profile = await RoommateProfile.findOne({ user: req.user.id }).populate('user', 'name email profilePicture');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    console.error('Error fetching roommate profile:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /profile - Create or update profile
router.post('/profile', auth, isNotBanned, sanitize, async (req, res) => {
  try {
    const { preferredLocations, lifestyle_preferences, budgetRange, moveInDate, bio } = req.body;
    
    let profile = await RoommateProfile.findOne({ user: req.user.id });
    if (profile) {
      if (preferredLocations) profile.preferredLocations = preferredLocations;
      if (lifestyle_preferences) {
        if (lifestyle_preferences.cleanliness) profile.lifestyle_preferences.cleanliness = lifestyle_preferences.cleanliness;
        if (lifestyle_preferences.sleepSchedule) profile.lifestyle_preferences.sleepSchedule = lifestyle_preferences.sleepSchedule;
        if (lifestyle_preferences.noiseTolerance) profile.lifestyle_preferences.noiseTolerance = lifestyle_preferences.noiseTolerance;
        if (lifestyle_preferences.smoking) profile.lifestyle_preferences.smoking = lifestyle_preferences.smoking;
        if (lifestyle_preferences.pets) profile.lifestyle_preferences.pets = lifestyle_preferences.pets;
      }
      if (budgetRange) profile.budgetRange = budgetRange;
      if (moveInDate) profile.moveInDate = moveInDate;
      if (bio) profile.bio = bio;
      await profile.save();
    } else {
      profile = new RoommateProfile({
        user: req.user.id,
        preferredLocations, lifestyle_preferences, budgetRange, moveInDate, bio
      });
      await profile.save();
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error saving roommate profile:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /discover - Find compatible roommates
router.get('/discover', auth, async (req, res) => {
  try {
    const myProfile = await RoommateProfile.findOne({ user: req.user.id });
    if (!myProfile) return res.status(400).json({ message: 'Please create your own profile first to see matches.' });

    const { minBudget, maxBudget, moveInDate, cleanliness, sleepSchedule } = req.query;

    let query = { user: { $ne: req.user.id } };

    if (minBudget || maxBudget) {
      query['budgetRange.max'] = { $gte: Number(minBudget || 0) };
      if (maxBudget) {
        query['budgetRange.min'] = { $lte: Number(maxBudget) };
      }
    }

    if (moveInDate) {
      query.moveInDate = { $gte: new Date(moveInDate) };
    }

    if (cleanliness) query['lifestyle_preferences.cleanliness'] = cleanliness;
    if (sleepSchedule) query['lifestyle_preferences.sleepSchedule'] = sleepSchedule;

    const otherProfiles = await RoommateProfile.find(query)
      .populate('user', 'name profilePicture'); // Specifically omit email to protect privacy

    // Score and sort
    const matchedProfiles = otherProfiles.map(p => {
      const pObj = p.toObject();
      pObj.compatibilityScore = calculateCompatibility(myProfile, p);
      return pObj;
    });

    matchedProfiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json(matchedProfiles);
  } catch (error) {
    console.error('Error discovering roommates:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /connections - Send connection request
router.post('/connections', auth, isNotBanned, sanitize, roommateActionLimiter, async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId || recipientId === req.user.id) {
      return res.status(400).json({ message: 'Invalid recipient' });
    }

    const existing = await RoommateConnection.findOne({
      requester: req.user.id,
      recipient: recipientId
    });

    if (existing) {
      return res.status(400).json({ message: 'Connection request already sent' });
    }

    const newConnection = new RoommateConnection({
      requester: req.user.id,
      recipient: recipientId,
      status: 'Pending'
    });
    await newConnection.save();

    await Notification.create({
      userId: recipientId,
      type: 'roommate_connection_request',
      message: 'You have a new roommate connection request!',
      relatedContentId: newConnection._id,
      actors: [{ userId: req.user.id }]
    });

    res.status(201).json(newConnection);
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /connections - Get connections (sent, received, accepted)
router.get('/connections', auth, async (req, res) => {
  try {
    const connections = await RoommateConnection.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }]
    }).populate('requester', 'name profilePicture email').populate('recipient', 'name profilePicture email');
    
    // Mask email for pending requests if current user is recipient/requester
    const maskedConnections = connections.map(c => {
      const cObj = c.toObject();
      if (cObj.status !== 'Accepted') {
        if (cObj.requester._id.toString() !== req.user.id) delete cObj.requester.email;
        if (cObj.recipient._id.toString() !== req.user.id) delete cObj.recipient.email;
      }
      return cObj;
    });

    res.json(maskedConnections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /connections/:id - Accept/Decline connection
router.put('/connections/:id', auth, isNotBanned, sanitize, async (req, res) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Declined'
    if (!['Accepted', 'Declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const connection = await RoommateConnection.findById(req.params.id);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });

    if (connection.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    connection.status = status;
    await connection.save();

    const notifType = status === 'Accepted' ? 'roommate_connection_accepted' : 'roommate_connection_declined';
    const notifMsg = status === 'Accepted' ? 'Your roommate connection request was accepted!' : 'Your roommate connection request was declined.';

    await Notification.create({
      userId: connection.requester,
      type: notifType,
      message: notifMsg,
      relatedContentId: connection._id,
      actors: [{ userId: req.user.id }]
    });

    res.json(connection);
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
