const RoommateProfile = require('../models/RoommateProfile');
const RoommateConnection = require('../models/RoommateConnection');
const RoommateGroup = require('../models/RoommateGroup');
const mongoose = require('mongoose');

// Simple compatibility scoring duplicate logic (or we can just do a very basic filter since real scoring is in roommateController)
// For simplicity, we'll fetch profiles and if we need compat, we just do a basic match here, or rely on them having same location/budget
function calculateBasicCompat(me, other) {
  let score = 50;
  if (me.budgetRange && other.budgetRange) {
    if (me.budgetRange.min <= other.budgetRange.max && me.budgetRange.max >= other.budgetRange.min) score += 20;
  }
  if (me.preferredLocations && other.preferredLocations) {
    const commonLoc = me.preferredLocations.filter(loc => other.preferredLocations.includes(loc));
    if (commonLoc.length > 0) score += 20;
  }
  if (me.lifestyle_preferences && other.lifestyle_preferences) {
    if (me.lifestyle_preferences.cleanliness === other.lifestyle_preferences.cleanliness) score += 5;
    if (me.lifestyle_preferences.sleepSchedule === other.lifestyle_preferences.sleepSchedule) score += 5;
  }
  return Math.min(score, 100);
}

exports.getSuggestions = async (req, res) => {
  try {
    const myProfile = await RoommateProfile.findOne({ user: req.user.id }).populate('user', 'name');
    if (!myProfile) return res.json([]);

    const dismissed = myProfile.dismissedSuggestions || [];
    let suggestions = [];

    // Check Rule 3: Re-activation Nudge
    if (myProfile.status === 'paused' || myProfile.visibility === 'hidden') {
      const pendingRequests = await RoommateConnection.countDocuments({
        recipient: req.user.id,
        status: 'pending'
      });
      const suggId = `reactivate_profile_nudge`;
      if (pendingRequests > 0 && !dismissed.includes(suggId)) {
        suggestions.push({
          id: suggId,
          type: 'reactivate_profile',
          title: 'You have pending connection requests!',
          reason: `You have ${pendingRequests} pending request(s) but your profile is currently hidden or paused. Reactivate to connect.`,
          actionLabel: 'Reactivate Profile',
          targetId: myProfile._id
        });
      }
    }

    // Check Rule 1: Group Needs Members
    const myGroups = await RoommateGroup.find({
      admin: req.user.id,
      status: 'open'
    });

    for (const group of myGroups) {
      if (group.members.length < group.targetSize) {
        const suggId = `group_needs_members_${group._id}`;
        if (!dismissed.includes(suggId)) {
          suggestions.push({
            id: suggId,
            type: 'manage_group',
            title: `Your group "${group.name}" has open spots`,
            reason: `Your group currently has ${group.members.length} members, but you're looking for ${group.targetSize}. Browse individuals to invite.`,
            actionLabel: 'Manage Group',
            targetId: group._id
          });
        }
      }
    }

    // Check Rule 2: Unviewed Compatible Matches
    // Only if user has active profile
    if (myProfile.status === 'active' && myProfile.visibility !== 'hidden') {
      const connectionsCount = await RoommateConnection.countDocuments({
        $or: [{ requester: req.user.id }, { recipient: req.user.id }]
      });

      // If they have less than 3 connections, suggest finding more
      if (connectionsCount < 3) {
        const unviewedSuggId = 'unviewed_matches_nudge';
        if (!dismissed.includes(unviewedSuggId)) {
          suggestions.push({
            id: unviewedSuggId,
            type: 'discover_matches',
            title: 'Expand your circle',
            reason: `You have very few active connections. There are likely highly compatible roommates nearby!`,
            actionLabel: 'Discover Roommates',
            targetId: 'discover'
          });
        }
      }
    }

    // Return top 3 suggestions to avoid overwhelming
    res.json(suggestions.slice(0, 3));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.dismissSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.body;
    if (!suggestionId) return res.status(400).json({ message: 'Suggestion ID is required' });

    await RoommateProfile.updateOne(
      { user: req.user.id },
      { $addToSet: { dismissedSuggestions: suggestionId } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
