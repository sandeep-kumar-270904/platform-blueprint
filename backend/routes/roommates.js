const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const sanitize = require('../middleware/sanitize');
const rateLimit = require('express-rate-limit');
const RoommateProfile = require('../models/RoommateProfile');
const RoommateConnection = require('../models/RoommateConnection');
const RoommateChat = require('../models/RoommateChat');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

// Helper to geocode a location and add privacy jitter
async function geocodeLocation(locationString) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationString)}&format=json&limit=1`, {
      headers: { 'User-Agent': 'AntiGravityBlueprint' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      // Add random spatial jitter (approx up to 500m) for privacy
      const lat = parseFloat(data[0].lat) + (Math.random() - 0.5) * 0.01;
      const lon = parseFloat(data[0].lon) + (Math.random() - 0.5) * 0.01;
      return [lon, lat]; // GeoJSON uses [longitude, latitude]
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return null;
}

const roommateActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Too many actions, please try again later.' }
});

// Calculate compatibility score between two profiles
const calculateCompatibility = (p1, p2) => {
  let breakdown = { budget: 0, location: 0, cleanliness: 0, sleep: 0, lifestyle: 0, advancedLifestyle: 0 };

  // Budget (20 pts)
  if (p1.budgetRange?.min && p1.budgetRange?.max && p2.budgetRange?.min && p2.budgetRange?.max) {
    const overlapMin = Math.max(p1.budgetRange.min, p2.budgetRange.min);
    const overlapMax = Math.min(p1.budgetRange.max, p2.budgetRange.max);
    if (overlapMin <= overlapMax) {
      breakdown.budget = 20;
    } else {
      const gap = overlapMin - overlapMax;
      if (gap < 1000) breakdown.budget = 10;
      else if (gap < 3000) breakdown.budget = 5;
    }
  } else {
    breakdown.budget = 10; // default if missing
  }

  // Preferred Locations (20 pts)
  if (p1.preferredLocations?.length > 0 && p2.preferredLocations?.length > 0) {
    const common = p1.preferredLocations.filter(loc => p2.preferredLocations.includes(loc));
    if (common.length > 0) breakdown.location = 20;
    else breakdown.location = 5; // give partial just in case
  } else {
    breakdown.location = 20; // if one is open to anywhere
  }

  const p1Life = p1.lifestyle_preferences;
  const p2Life = p2.lifestyle_preferences;

  if (p1Life && p2Life) {
    // Cleanliness (10 pts)
    if (p1Life.cleanliness && p2Life.cleanliness) {
      const levels = ['Messy', 'Average', 'Clean', 'Neat Freak'];
      const diff = Math.abs(levels.indexOf(p1Life.cleanliness) - levels.indexOf(p2Life.cleanliness));
      if (diff === 0) breakdown.cleanliness = 10;
      else if (diff === 1) breakdown.cleanliness = 5;
    }

    // Sleep Schedule (10 pts)
    if (p1Life.sleepSchedule && p2Life.sleepSchedule) {
      if (p1Life.sleepSchedule === p2Life.sleepSchedule || p1Life.sleepSchedule === 'Flexible' || p2Life.sleepSchedule === 'Flexible') {
        breakdown.sleep = 10;
      } else {
        breakdown.sleep = 5;
      }
    }

    // Smoking / Pets (10 pts)
    let smokePts = 0;
    if (p1Life.smoking && p2Life.smoking) {
      if (p1Life.smoking === p2Life.smoking || p1Life.smoking === 'any' || p2Life.smoking === 'any') smokePts = 5;
      else if (p1Life.smoking === 'Outside only' || p2Life.smoking === 'Outside only') smokePts = 2;
    }
    
    let petPts = 0;
    if (p1Life.pets && p2Life.pets) {
      if (p1Life.pets === p2Life.pets || p1Life.pets === 'any' || p2Life.pets === 'any') petPts = 5;
      else if (p1Life.pets !== 'No' && p2Life.pets !== 'No') petPts = 2;
    }
    breakdown.lifestyle = smokePts + petPts;

    // Advanced Lifestyle (30 pts)
    let advPts = 0;
    
    // Guest Policy (10 pts)
    if (p1Life.guestPolicy && p2Life.guestPolicy) {
      const gLevels = ['Strictly No Guests', 'Rarely', 'Occasionally', 'Frequently'];
      const gDiff = Math.abs(gLevels.indexOf(p1Life.guestPolicy) - gLevels.indexOf(p2Life.guestPolicy));
      if (gDiff === 0) advPts += 10;
      else if (gDiff === 1) advPts += 5;
    } else {
      advPts += 10; // Backward compatibility
    }

    // Noise Tolerance (10 pts)
    if (p1Life.noiseTolerance && p2Life.noiseTolerance) {
      const nLevels = ['Low', 'Medium', 'High'];
      const nDiff = Math.abs(nLevels.indexOf(p1Life.noiseTolerance) - nLevels.indexOf(p2Life.noiseTolerance));
      if (nDiff === 0) advPts += 10;
      else if (nDiff === 1) advPts += 5;
    } else {
      advPts += 10; // Backward compatibility
    }

    // Cooking Habits (5 pts)
    if (p1Life.cookingHabits && p2Life.cookingHabits) {
      if (p1Life.cookingHabits === p2Life.cookingHabits) advPts += 5;
      else if (p1Life.cookingHabits.includes('Often') && p2Life.cookingHabits.includes('Often')) advPts += 2;
    } else {
      advPts += 5;
    }

    // Shared Space Expectations (5 pts)
    if (p1Life.sharedSpaceExpectations && p2Life.sharedSpaceExpectations) {
      if (p1Life.sharedSpaceExpectations === p2Life.sharedSpaceExpectations) advPts += 5;
    } else {
      advPts += 5;
    }

    breakdown.advancedLifestyle = advPts;
  } else {
    breakdown.advancedLifestyle = 30;
  }

  const score = breakdown.budget + breakdown.location + breakdown.cleanliness + breakdown.sleep + breakdown.lifestyle + breakdown.advancedLifestyle;

  return { score, breakdown };
};

// GET /profile - Get own profile
router.get('/profile', auth, async (req, res) => {
  try {
    const profile = await RoommateProfile.findOne({ user: req.user.id }).populate('user', 'name full_name email profilePicture avatar_url');
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
    const { preferredLocations, lifestyle_preferences, budgetRange, moveInDate, bio, profilePhoto, galleryPhotos, visibility, status } = req.body;
    
    let profile = await RoommateProfile.findOne({ user: req.user.id });
    if (profile) {
      if (preferredLocations) profile.preferredLocations = preferredLocations;
      if (lifestyle_preferences) {
        if (lifestyle_preferences.cleanliness) profile.lifestyle_preferences.cleanliness = lifestyle_preferences.cleanliness;
        if (lifestyle_preferences.sleepSchedule) profile.lifestyle_preferences.sleepSchedule = lifestyle_preferences.sleepSchedule;
        if (lifestyle_preferences.noiseTolerance) profile.lifestyle_preferences.noiseTolerance = lifestyle_preferences.noiseTolerance;
        if (lifestyle_preferences.smoking) profile.lifestyle_preferences.smoking = lifestyle_preferences.smoking;
        if (lifestyle_preferences.pets) profile.lifestyle_preferences.pets = lifestyle_preferences.pets;
        if (lifestyle_preferences.guestPolicy) profile.lifestyle_preferences.guestPolicy = lifestyle_preferences.guestPolicy;
        if (lifestyle_preferences.cookingHabits) profile.lifestyle_preferences.cookingHabits = lifestyle_preferences.cookingHabits;
        if (lifestyle_preferences.sharedSpaceExpectations) profile.lifestyle_preferences.sharedSpaceExpectations = lifestyle_preferences.sharedSpaceExpectations;
      }
      if (budgetRange) profile.budgetRange = budgetRange;
      if (moveInDate) profile.moveInDate = moveInDate;
      if (bio) profile.bio = bio;
      if (profilePhoto !== undefined) profile.profilePhoto = profilePhoto;
      if (galleryPhotos) profile.galleryPhotos = galleryPhotos;
      if (visibility) profile.visibility = visibility;
      if (status) profile.status = status;
      
      // Update location if preferredLocations changed
      if (preferredLocations && preferredLocations.length > 0) {
        const coords = await geocodeLocation(preferredLocations[0]);
        if (coords) {
          profile.location = { type: 'Point', coordinates: coords };
        }
      }

      await profile.save();
    } else {
      // Create new profile
      let newLocation = { type: 'Point', coordinates: [0, 0] };
      if (preferredLocations && preferredLocations.length > 0) {
        const coords = await geocodeLocation(preferredLocations[0]);
        if (coords) newLocation.coordinates = coords;
      }

      profile = new RoommateProfile({
        user: req.user.id,
        preferredLocations,
        lifestyle_preferences,
        budgetRange,
        moveInDate,
        bio,
        profilePhoto,
        galleryPhotos,
        visibility,
        status,
        location: newLocation
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

    const currentUser = await User.findById(req.user.id);
    const blockedAndMuted = [...(currentUser.blocked_users || []), ...(currentUser.muted_users || [])];

    // Phase 10: Block-list awareness (exclude profiles of users who have blocked the current user)
    const usersWhoBlockedMe = await User.find({ blocked_users: req.user.id }).select('_id');
    const usersWhoBlockedMeIds = usersWhoBlockedMe.map(u => u._id);
    const excludedUsers = [...blockedAndMuted, ...usersWhoBlockedMeIds];

    const { minBudget, maxBudget, moveInDate, cleanliness, sleepSchedule, smoking, pets, guestPolicy, cookingHabits, sharedSpaceExpectations, noiseTolerance, sortBy, search, verifiedOnly, lat, lng, radius } = req.query;

    let query = { 
      user: { $ne: req.user.id, $nin: excludedUsers },
      status: 'active',
      $or: [{ visibility: 'everyone' }, { visibility: 'same_college' }]
    };

    // Location Radius Filter (Phase 24)
    if (lat && lng && radius) {
      const radiusInRadians = parseFloat(radius) / 6371; // Earth radius in km
      query.location = {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
        }
      };
    }

    if (verifiedOnly === 'true') {
      query.verificationStatus = { $in: ['email_verified', 'id_verified'] };
    }

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
    if (smoking) query['lifestyle_preferences.smoking'] = smoking;
    if (pets) query['lifestyle_preferences.pets'] = pets;
    if (guestPolicy) query['lifestyle_preferences.guestPolicy'] = guestPolicy;
    if (cookingHabits) query['lifestyle_preferences.cookingHabits'] = cookingHabits;
    if (sharedSpaceExpectations) query['lifestyle_preferences.sharedSpaceExpectations'] = sharedSpaceExpectations;
    if (noiseTolerance) query['lifestyle_preferences.noiseTolerance'] = noiseTolerance;

    // We only populate name/full_name, profilePicture/avatar_url, and university for searching/display
    let otherProfiles = await RoommateProfile.find(query)
      .populate('user', 'name full_name profilePicture avatar_url university');

    // Phase 10: Visibility & same college filtering
    otherProfiles = otherProfiles.filter(p => {
      // If profile is set to same_college, check if the current user has a university and it matches
      if (p.visibility === 'same_college') {
        const myUni = currentUser.university;
        const theirUni = p.user?.university;
        if (!myUni || !theirUni || myUni.toLowerCase() !== theirUni.toLowerCase()) {
          return false;
        }
      }
      return true;
    });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      otherProfiles = otherProfiles.filter(p => {
        const userName = p.user?.name || p.user?.full_name || '';
        const userUniversity = p.user?.university || '';
        if (searchRegex.test(userName)) return true;
        if (p.bio && searchRegex.test(p.bio)) return true;
        if (searchRegex.test(userUniversity)) return true;
        if (p.preferredLocations && p.preferredLocations.some(loc => searchRegex.test(loc))) return true;
        return false;
      });
    }

    // Score and sort
    const matchedProfiles = otherProfiles.map(p => {
      const pObj = p.toObject();
      const comp = calculateCompatibility(myProfile, p);
      pObj.compatibilityScore = comp.score;
      pObj.compatibilityBreakdown = comp.breakdown;
      return pObj;
    });

    if (sortBy === 'recent') {
      matchedProfiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'budget') {
      matchedProfiles.sort((a, b) => (a.budgetRange?.min || 0) - (b.budgetRange?.min || 0));
    } else {
      matchedProfiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    }

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

    const sender = await User.findById(req.user.id);

    await createNotification({
      userId: recipientId,
      type: 'roommate_connection_request',
      message: `${sender.name || 'Someone'} sent you a roommate connection request`,
      relatedContentId: newConnection._id,
      actionUrl: '/find-roommates?tab=connections',
      actorId: req.user.id
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
    })
    .sort({ createdAt: -1 })
    .populate('requester', 'name full_name profilePicture avatar_url email')
    .populate('recipient', 'name full_name profilePicture avatar_url email');
    
    const myProfile = await RoommateProfile.findOne({ user: req.user.id });
    
    // Fetch all profiles for the connected users
    const otherUserIds = connections.map(c => 
      c.requester._id.toString() === req.user.id ? c.recipient._id : c.requester._id
    );
    
    const profiles = await RoommateProfile.find({ user: { $in: otherUserIds } })
      .populate('user', 'name full_name profilePicture avatar_url university');
    
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.user._id.toString()] = p.toObject();
    });

    const maskedConnections = connections.map(c => {
      const cObj = c.toObject();
      const otherUserId = cObj.requester._id.toString() === req.user.id 
        ? cObj.recipient._id.toString() 
        : cObj.requester._id.toString();
        
      if (cObj.status !== 'Accepted') {
        if (cObj.requester._id.toString() !== req.user.id) delete cObj.requester.email;
        if (cObj.recipient._id.toString() !== req.user.id) delete cObj.recipient.email;
      }
      
      const otherProfile = profileMap[otherUserId];
      if (otherProfile && myProfile) {
        const comp = calculateCompatibility(myProfile, otherProfile);
        otherProfile.compatibilityScore = comp.score;
        otherProfile.compatibilityBreakdown = comp.breakdown;
      }
      cObj.otherProfile = otherProfile || null;
      
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

    const responder = await User.findById(req.user.id);
    const responderName = responder.name || 'Someone';

    const notifType = status === 'Accepted' ? 'roommate_connection_accepted' : 'roommate_connection_declined';
    const notifMsg = status === 'Accepted' ? `${responderName} accepted your connection request!` : `${responderName} declined your connection request.`;

    await createNotification({
      userId: connection.requester,
      type: notifType,
      message: notifMsg,
      relatedContentId: connection._id,
      actionUrl: '/find-roommates?tab=connections',
      actorId: req.user.id
    });

    res.json(connection);
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /connections/:id - Withdraw or unmatch
router.delete('/connections/:id', auth, async (req, res) => {
  try {
    const connection = await RoommateConnection.findById(req.params.id);
    if (!connection) return res.status(404).json({ message: 'Connection not found or already deleted' });

    // Only requester or recipient can delete
    if (connection.requester.toString() !== req.user.id && connection.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (connection.status === 'Accepted') {
       console.log(`[ANALYTICS] Roommate Disconnect: User ${req.user.id} unmatched connection ${connection._id} involving users ${connection.requester} and ${connection.recipient} at ${new Date().toISOString()}`);
       
       const disconnector = await User.findById(req.user.id);
       const targetUserId = connection.requester.toString() === req.user.id ? connection.recipient : connection.requester;
       
       await createNotification({
         userId: targetUserId,
         type: 'roommate_connection_disconnected',
         message: `${disconnector.name || 'Someone'} has disconnected from you.`,
         relatedContentId: connection._id,
         actionUrl: '/find-roommates?tab=connections',
         actorId: req.user.id
       });
    }

    await connection.deleteOne();
    
    // Archive chat if it exists
    await RoommateChat.findOneAndUpdate({ connectionId: req.params.id }, { status: 'archived' });

    res.json({ message: 'Connection removed' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /saved - Get user's saved roommate profiles
router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.savedRoommates || []);
  } catch (error) {
    console.error('Error fetching saved roommates:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /saved-profiles - Get populated saved profiles for the Saved View
router.get('/saved-profiles', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const savedIds = user.savedRoommates || [];

    if (savedIds.length === 0) {
      return res.json([]);
    }

    const blockedAndMuted = [...(user.blocked_users || []), ...(user.muted_users || [])].map(id => id.toString());
    const usersWhoBlockedMe = await User.find({ blocked_users: req.user.id }).select('_id');
    const usersWhoBlockedMeIds = usersWhoBlockedMe.map(u => u._id.toString());
    const excludedUsers = [...blockedAndMuted, ...usersWhoBlockedMeIds];

    const profiles = await RoommateProfile.find({
      _id: { $in: savedIds },
      user: { $ne: req.user.id, $nin: excludedUsers },
      status: 'active'
    }).populate('user', 'name full_name email profilePicture avatar_url location university current_year bio blocked_users');

    const myProfile = await RoommateProfile.findOne({ user: req.user.id });
    
    let result = profiles.map(p => {
      let pObj = p.toObject();
      if (myProfile) {
        const comp = calculateCompatibility(myProfile, p);
        pObj.compatibilityScore = comp.score;
        pObj.compatibilityBreakdown = comp.breakdown;
      } else {
        pObj.compatibilityScore = 0;
      }
      return pObj;
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching populated saved profiles:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /saved/:id - Toggle saved status
router.post('/saved/:id', auth, isNotBanned, async (req, res) => {
  try {
    const profileId = req.params.id;
    const user = await User.findById(req.user.id);
    
    const savedSet = new Set((user.savedRoommates || []).map(id => id.toString()));
    
    if (savedSet.has(profileId)) {
      savedSet.delete(profileId);
    } else {
      savedSet.add(profileId);
    }
    
    user.savedRoommates = Array.from(savedSet);
    await user.save();
    
    res.json({ message: 'Saved status toggled', saved: Array.from(savedSet) });
  } catch (error) {
    console.error('Error toggling saved roommate:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
