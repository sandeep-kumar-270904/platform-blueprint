const BuddyMatchRequest = require('../models/BuddyMatchRequest');
const ApplicationBuddyPairing = require('../models/ApplicationBuddyPairing');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const { sendNotification } = require('../services/notificationService');

exports.requestMatch = async (req, res) => {
  try {
    const existingReq = await BuddyMatchRequest.findOne({ userId: req.user.id, status: 'waiting' });
    if (existingReq) {
      return res.status(400).json({ message: 'You already have a waiting match request.' });
    }

    const { preferredCategories } = req.body;
    const matchReq = new BuddyMatchRequest({
      userId: req.user.id,
      preferredCategories: preferredCategories || []
    });

    await matchReq.save();

    // Trigger synchronous matching attempt
    await exports.matchWaitingBuddyRequests();

    res.status(201).json(matchReq);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.matchWaitingBuddyRequests = async () => {
  try {
    const waitingRequests = await BuddyMatchRequest.find({ status: 'waiting' }).sort({ createdAt: 1 });
    if (waitingRequests.length < 2) return; // Need at least two

    // Simple matching: just pair the oldest with the next oldest overlapping or fallback
    // In production, we'd do a more exhaustive pair matching algorithm
    const matched = new Set();

    for (let i = 0; i < waitingRequests.length; i++) {
      if (matched.has(waitingRequests[i]._id.toString())) continue;
      const reqA = waitingRequests[i];

      let bestMatch = null;
      let maxOverlap = -1;

      for (let j = i + 1; j < waitingRequests.length; j++) {
        if (matched.has(waitingRequests[j]._id.toString())) continue;
        const reqB = waitingRequests[j];

        const overlap = reqA.preferredCategories.filter(c => reqB.preferredCategories.includes(c)).length;
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          bestMatch = reqB;
        }
      }

      // Fallback: If no overlap, just pair with the next available one if reqA is old enough (e.g. older than 24h)
      // For immediate testing, we'll just pair them anyway if there's any bestMatch (or simply the next one)
      if (!bestMatch) {
        for (let j = i + 1; j < waitingRequests.length; j++) {
          if (!matched.has(waitingRequests[j]._id.toString())) {
            bestMatch = waitingRequests[j];
            break;
          }
        }
      }

      if (bestMatch) {
        reqA.status = 'matched';
        bestMatch.status = 'matched';
        await reqA.save();
        await bestMatch.save();

        matched.add(reqA._id.toString());
        matched.add(bestMatch._id.toString());

        const matchedOn = reqA.preferredCategories.filter(c => bestMatch.preferredCategories.includes(c));

        const pairing = new ApplicationBuddyPairing({
          userAId: reqA.userId,
          userBId: bestMatch.userId,
          matchedOn
        });
        await pairing.save();

        // Notify both users
        await sendNotification({
          userId: reqA.userId,
          type: 'buddy_matched',
          message: 'You have been matched with a new scholarship buddy!',
          relatedContentId: pairing._id
        });
        await sendNotification({
          userId: bestMatch.userId,
          type: 'buddy_matched',
          message: 'You have been matched with a new scholarship buddy!',
          relatedContentId: pairing._id
        });
      }
    }
  } catch (err) {
    console.error('Error during buddy matching:', err);
  }
};

exports.getMyPairing = async (req, res) => {
  try {
    const pairing = await ApplicationBuddyPairing.findOne({
      $or: [{ userAId: req.user.id }, { userBId: req.user.id }],
      status: 'active'
    });

    if (!pairing) return res.status(404).json({ message: 'No active pairing found.' });

    const buddyId = pairing.userAId.toString() === req.user.id ? pairing.userBId : pairing.userAId;

    // Fetch buddy's aggregate application stats without revealing scholarship titles
    const apps = await ScholarshipApplication.find({ userId: buddyId });
    const aggregate = {
      totalApplicationsStarted: apps.length,
      totalApplicationsSubmitted: apps.filter(a => ['submitted', 'under_review', 'awarded', 'rejected'].includes(a.status)).length,
      totalAwarded: apps.filter(a => a.status === 'awarded').length
    };

    res.json({ pairing, buddyProgress: aggregate });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.shareItem = async (req, res) => {
  try {
    const { scholarshipId } = req.body;
    const pairing = await ApplicationBuddyPairing.findOne({
      $or: [{ userAId: req.user.id }, { userBId: req.user.id }],
      status: 'active'
    });

    if (!pairing) return res.status(404).json({ message: 'No active pairing found.' });

    const alreadyShared = pairing.sharedScholarships.some(s => s.scholarshipId.toString() === scholarshipId);
    if (!alreadyShared) {
      pairing.sharedScholarships.push({
        scholarshipId,
        addedBy: req.user.id
      });
      await pairing.save();
    }
    res.json(pairing);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.endPairing = async (req, res) => {
  try {
    const pairing = await ApplicationBuddyPairing.findOne({
      $or: [{ userAId: req.user.id }, { userBId: req.user.id }],
      status: 'active'
    });

    if (!pairing) return res.status(404).json({ message: 'No active pairing found.' });

    pairing.status = 'ended';
    pairing.endedAt = new Date();
    await pairing.save();

    res.json({ message: 'Pairing ended successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
