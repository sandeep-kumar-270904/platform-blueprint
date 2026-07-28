const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/StudyGroup');
const GroupMessage = require('../models/GroupMessage');
const GroupSession = require('../models/GroupSession');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// Helper: Count active members
const getActiveMemberCount = (group) => {
  if (!group.memberships) return 0;
  return group.memberships.filter(m => m.status === 'active').length;
};

// GET /api/study-groups - Fetch Discover groups (supports search & excludes joined)
router.get('/', async (req, res) => {
  try {
    const { search, excludeUserId, category, activityLevel, sortBy } = req.query;
    
    const mongoose = require('mongoose');
    let userInterests = [];
    
    if (excludeUserId && mongoose.Types.ObjectId.isValid(excludeUserId)) {
      const User = require('../models/User');
      const requestingUser = await User.findById(excludeUserId);
      if (requestingUser && requestingUser.interestTags) {
        userInterests = requestingUser.interestTags.map(t => new RegExp(t, 'i')); // case insensitive match
      }
    }

    let matchStage = {};
    
    // Server-side Search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchStage.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Category filter
    if (category && category !== 'all') {
      matchStage.category = category;
    }
    
    // Activity filter
    const now = new Date();
    if (activityLevel === 'active_week') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchStage.last_activity = { $gte: lastWeek };
    } else if (activityLevel === 'active_month') {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchStage.last_activity = { $gte: lastMonth };
    }
    
    // Exclude groups the user is already in (or pending in)
    if (excludeUserId && mongoose.Types.ObjectId.isValid(excludeUserId)) {
      matchStage.memberships = { 
        $not: { $elemMatch: { user: new mongoose.Types.ObjectId(excludeUserId) } } 
      };
    }

    // Determine Sort Stage
    let sortStage = { createdAt: -1 };
    if (sortBy === 'most_members') {
      sortStage = { member_count: -1, createdAt: -1 };
    } else if (sortBy === 'most_active') {
      sortStage = { last_activity: -1, createdAt: -1 };
    } else if (sortBy === 'best_match') {
      sortStage = { totalScore: -1, last_activity: -1, createdAt: -1 };
    } else if (sortBy === 'newest') {
      sortStage = { createdAt: -1 };
    }

    // Aggregation Pipeline for Discover Groups
    const discoverPipeline = [
      { $match: matchStage },
      { 
        $addFields: {
          member_count: {
            $size: {
              $filter: {
                input: { $ifNull: ["$memberships", []] },
                cond: { $eq: ["$this.status", "active"] }
              }
            }
          },
          // Calculate Match Score
          categoryMatches: {
            $reduce: {
              input: userInterests.length > 0 ? userInterests.map(regex => ({
                $regexMatch: { input: "$category", regex: regex.source, options: "i" }
              })) : [false],
              initialValue: false,
              in: { $or: ["$value", "$this"] }
            }
          }
        }
      },
      {
        $addFields: {
          matchScore: { $cond: { if: "$categoryMatches", then: 10, else: 0 } },
          activeScore: { 
            $cond: { 
              if: { 
                $gte: [
                  { $ifNull: ["$last_activity", new Date(0)] }, 
                  new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                ] 
              }, 
              then: 5, 
              else: 0 
            } 
          }
        }
      },
      {
        $addFields: {
          totalScore: { $add: ["$matchScore", "$activeScore"] }
        }
      },
      { $sort: sortStage },
      { $project: { memberships: 0, categoryMatches: 0, matchScore: 0, activeScore: 0 } }
    ];

    const discoverGroups = await StudyGroup.aggregate(discoverPipeline);

    // Calculate Recommended Groups (Top 3)
    let recommendedGroups = [];
    if (!search && (!category || category === 'all') && (!activityLevel || activityLevel === 'all')) {
      const recPipeline = [
        { 
          $match: excludeUserId && mongoose.Types.ObjectId.isValid(excludeUserId) ? {
            memberships: { $not: { $elemMatch: { user: new mongoose.Types.ObjectId(excludeUserId) } } }
          } : {}
        },
        { 
          $addFields: {
            member_count: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$memberships", []] },
                  cond: { $eq: ["$this.status", "active"] }
                }
              }
            },
            categoryMatches: {
              $reduce: {
                input: userInterests.length > 0 ? userInterests.map(regex => ({
                  $regexMatch: { input: "$category", regex: regex.source, options: "i" }
                })) : [false],
                initialValue: false,
                in: { $or: ["$value", "$this"] }
              }
            }
          }
        },
        {
          $addFields: {
            matchScore: { $cond: { if: "$categoryMatches", then: 10, else: 0 } },
            activeScore: { 
              $cond: { 
                if: { 
                  $gte: [
                    { $ifNull: ["$last_activity", new Date(0)] }, 
                    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                  ] 
                }, 
                then: 5, 
                else: 0 
              } 
            }
          }
        },
        {
          $addFields: {
            totalScore: { $add: ["$matchScore", "$activeScore"] }
          }
        },
        { $sort: { totalScore: -1, last_activity: -1, createdAt: -1 } },
        { $limit: 3 },
        { $project: { memberships: 0, categoryMatches: 0, matchScore: 0, activeScore: 0 } }
      ];
      
      recommendedGroups = await StudyGroup.aggregate(recPipeline);
      
      // Fallback: if user has no interests and scores are tied at 5 (just active) or 0, it falls back gracefully via the sort order.
    }

    res.json({
      discoverGroups,
      recommendedGroups
    });
  } catch (error) {
    console.error('Fetch study groups error:', error);
    res.status(500).json({ message: 'Server error fetching groups.' });
  }
});

// GET /api/study-groups/my-memberships - Fetch full groups user has joined
router.get('/my-memberships', authMiddleware, async (req, res) => {
  try {
    const groups = await StudyGroup.find({
      memberships: { $elemMatch: { user: req.user.id, status: 'active' } }
    }).sort({ createdAt: -1 });
    
    const transformedGroups = groups.map(g => {
      const obj = g.toObject();
      obj.member_count = getActiveMemberCount(g);
      delete obj.memberships; // Clean up payload
      return obj;
    });
    
    res.json(transformedGroups);
  } catch (error) {
    console.error('Fetch my memberships error:', error);
    res.status(500).json({ message: 'Server error fetching memberships.' });
  }
});

// POST /api/study-groups - Create a new group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, privacy, member_limit } = req.body;
    
    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and focus area are required.' });
    }

    const newGroup = new StudyGroup({
      name,
      description,
      category,
      privacy: privacy || 'public',
      member_limit: member_limit || 50,
      owner_id: req.user.id,
      memberships: [{
        user: req.user.id,
        role: 'owner',
        status: 'active'
      }]
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    console.error('Create study group error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A group with that name already exists. Please choose another.' });
    }
    res.status(500).json({ message: 'Server error creating group.' });
  }
});

// POST /api/study-groups/:id/join - Request to join or join public group
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // Check if already a member or pending
    const existingMembership = group.memberships.find(m => m.user.toString() === req.user.id);
    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return res.status(400).json({ message: 'Already a member.' });
      } else {
        return res.status(400).json({ message: 'Join request already pending.' });
      }
    }

    // Check member limit
    if (getActiveMemberCount(group) >= group.member_limit) {
      return res.status(400).json({ message: 'Group has reached its member limit.' });
    }

    // Add membership
    const status = group.privacy === 'public' ? 'active' : 'pending';
    group.memberships.push({
      user: req.user.id,
      role: 'member',
      status
    });

    await group.save();

    // Notify Owner if pending request
    if (status === 'pending') {
      await Notification.create({
        userId: group.owner_id,
        type: 'group_join_request',
        relatedContentId: group._id,
        message: `Someone requested to join your group: ${group.name}`
      });
    }

    res.json({ message: status === 'active' ? 'Joined successfully.' : 'Join request sent.' });
  } catch (error) {
    console.error('Join study group error:', error);
    res.status(500).json({ message: 'Server error joining group.' });
  }
});

// GET /api/study-groups/:id - Fetch group details with populated members
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('memberships.user', 'username avatar_url learningStreak quizStreak full_name')
      .populate('resources.added_by', 'username avatar_url');
      
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isOwner = group.owner_id.toString() === req.user.id;
    const isActiveMember = group.memberships.some(m => m.user._id.toString() === req.user.id && m.status === 'active');
    
    // Access control: Only owner or active member can view detail
    if (!isOwner && !isActiveMember) {
      return res.status(403).json({ message: 'Not authorized to view this group.' });
    }
    
    const obj = group.toObject();
    obj.member_count = getActiveMemberCount(group);
    
    // Data Masking: Only owner sees pending requests
    if (!isOwner) {
      obj.memberships = obj.memberships.filter(m => m.status === 'active');
    }

    res.json(obj);
  } catch (error) {
    console.error('Fetch group detail error:', error);
    res.status(500).json({ message: 'Server error fetching group details.' });
  }
});

// PUT /api/study-groups/:id/memberships/:userId - Approve/Deny
router.put('/:id/memberships/:userId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'rejected'
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    
    if (group.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can manage memberships.' });
    }

    const membershipIndex = group.memberships.findIndex(m => m.user.toString() === req.params.userId);
    if (membershipIndex === -1) return res.status(404).json({ message: 'Membership not found.' });

    if (status === 'active') {
      if (getActiveMemberCount(group) >= group.member_limit) {
        return res.status(400).json({ message: 'Group is full.' });
      }
      group.memberships[membershipIndex].status = 'active';
    } else if (status === 'rejected' || action === 'remove') {
      group.memberships.splice(membershipIndex, 1);
    }
        await group.save();

        // If member was removed or rejected, clean up future RSVPs and Notifications
        if (action === 'remove' || status === 'rejected') {
          await GroupSession.updateMany(
            { group_id: group._id, scheduled_at: { $gt: new Date() } },
            { $pull: { attendees: targetUserId } }
          );
          await Notification.deleteMany({
            userId: targetUserId,
            relatedContentId: group._id,
            type: { $ne: 'group_request_denied' } // keep the denial notice if any
          });
        }
        if (status === 'active') {
          await Notification.create({
            userId: targetUserId,
            type: 'group_request_approved',
            relatedContentId: group._id,
            message: `Your request to join ${group.name} was approved.`
          });
        } else if (status === 'rejected') {
          await Notification.create({
            userId: targetUserId,
            type: 'group_request_denied',
            relatedContentId: group._id,
            message: `Your request to join ${group.name} was denied.`
          });
        }

        return res.json(group);
  } catch (error) {
    console.error('Manage membership error:', error);
    res.status(500).json({ message: 'Server error managing membership.' });
  }
});

// POST /api/study-groups/:id/leave
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (group.owner_id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Owner cannot leave. You must delete the group.' });
    }

    group.memberships = group.memberships.filter(m => m.user.toString() !== req.user.id);
    await group.save();

    // Cleanup: Remove future RSVPs
    await GroupSession.updateMany(
      { group_id: group._id, scheduled_at: { $gt: new Date() } },
      { $pull: { attendees: req.user.id } }
    );

    // Cleanup: Remove pending notifications related to this group
    await Notification.deleteMany({
      userId: req.user.id,
      relatedContentId: group._id
    });

    res.json({ message: 'Left group successfully.' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error leaving group.' });
  }
});

// DELETE /api/study-groups/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (group.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete the group.' });
    }

    await group.deleteOne();
    res.json({ message: 'Group deleted successfully.' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error deleting group.' });
  }
});

// POST /api/study-groups/:id/resources
router.post('/:id/resources', authMiddleware, async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) return res.status(400).json({ message: 'Title and URL are required.' });

    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // Duplicate check
    const isDuplicate = group.resources.some(r => r.url === url);
    if (isDuplicate) {
      return res.status(400).json({ message: 'This resource has already been shared in this group.' });
    }

    // Must be active member
    const membership = group.memberships.find(m => m.user.toString() === req.user.id && m.status === 'active');
    if (!membership && group.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only active members can add resources.' });
    }

    group.resources.push({ title, url, added_by: req.user.id });
    await group.save();
    
    // Return populated resources
    const updatedGroup = await StudyGroup.findById(req.params.id).populate('resources.added_by', 'username avatar_url');
    res.json(updatedGroup.resources);
  } catch (error) {
    console.error('Add resource error:', error);
    res.status(500).json({ message: 'Server error adding resource.' });
  }
});

// DELETE /api/study-groups/:id/resources/:resourceId
router.delete('/:id/resources/:resourceId', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const resource = group.resources.id(req.params.resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });

    if (group.owner_id.toString() !== req.user.id && resource.added_by.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this resource.' });
    }

    resource.deleteOne();
    await group.save();
    res.json({ message: 'Resource deleted.' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Server error deleting resource.' });
  }
});

// GET /api/study-groups/:id/messages - Fetch chat history
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isOwner = group.owner_id.toString() === req.user.id;
    const isActiveMember = group.memberships.some(m => m.user.toString() === req.user.id && m.status === 'active');
    
    if (!isOwner && !isActiveMember) {
      return res.status(403).json({ message: 'Only members can view messages.' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await GroupMessage.find({ group_id: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar_url');
      
    res.json(messages.reverse());
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages.' });
  }
});

// POST /api/study-groups/:id/messages - Send a message
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required.' });
    if (text.length > 2000) return res.status(400).json({ message: 'Message exceeds the 2000 character limit.' });

    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isOwner = group.owner_id.toString() === req.user.id;
    const isActiveMember = group.memberships.some(m => m.user.toString() === req.user.id && m.status === 'active');
    
    if (!isOwner && !isActiveMember) {
      return res.status(403).json({ message: 'Only members can send messages.' });
    }

    // Anti-Spam: Check if the exact same message was sent by this user within the last 2 seconds
    const twoSecondsAgo = new Date(Date.now() - 2000);
    const recentDuplicate = await GroupMessage.findOne({
      group_id: req.params.id,
      sender: req.user.id,
      text: text.trim(),
      createdAt: { $gte: twoSecondsAgo }
    });
    if (recentDuplicate) {
      return res.status(429).json({ message: 'You are sending messages too quickly.' });
    }

    const message = new GroupMessage({
      group_id: req.params.id,
      sender: req.user.id,
      text: text.trim()
    });

    await message.save();

    // Update group activity
    group.last_activity = new Date();
    await group.save();

    // Notify active members (debounce spam by checking for existing unread)
    const activeMembers = group.memberships
      .filter(m => m.status === 'active' && m.user.toString() !== req.user.id)
      .map(m => m.user.toString());
    if (group.owner_id.toString() !== req.user.id) activeMembers.push(group.owner_id.toString());
    
    // De-duplicate in case owner is in memberships
    let uniqueMembers = [...new Set(activeMembers)];

    // Phase 5 Hardening: Suppress new-message notifications for currently connected members
    const io = req.app.get('io');
    if (io) {
      try {
        const roomSockets = await io.in(`group_${group._id}`).fetchSockets();
        const connectedUserIds = roomSockets.map(s => s.userId).filter(Boolean);
        uniqueMembers = uniqueMembers.filter(userId => !connectedUserIds.includes(userId));
      } catch (err) {
        console.error('Error fetching connected sockets for notifications:', err);
      }
    }

    // We only create a notification if they don't already have an UNREAD chat notif for this group
    const notificationsToCreate = [];
    for (const userId of uniqueMembers) {
      const existingUnread = await Notification.findOne({
        userId,
        type: 'group_new_message',
        relatedContentId: group._id,
        isRead: false
      });
      if (!existingUnread) {
        notificationsToCreate.push({
          userId,
          type: 'group_new_message',
          relatedContentId: group._id,
          message: `New message in ${group.name}`,
          isRead: false
        });
      }
    }
    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    // Populate sender info for the socket payload
    const populatedMessage = await message.populate('sender', 'username avatar_url');
    
    // Broadcast via socket
    const io_broadcast = req.app.get('io');
    if (io_broadcast) {
      io_broadcast.to(`group_${req.params.id}`).emit('new_group_message', populatedMessage);
    }

    res.json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message.' });
  }
});

// ==========================================
// Phase 4: Group Sessions (GD Practice / Live)
// ==========================================

// GET /api/study-groups/:id/sessions - Fetch all sessions
router.get('/:id/sessions', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isOwner = group.owner_id.toString() === req.user.id;
    const isActiveMember = group.memberships.some(m => m.user.toString() === req.user.id && m.status === 'active');
    
    if (!isOwner && !isActiveMember) {
      return res.status(403).json({ message: 'Only members can view sessions.' });
    }

    const sessions = await GroupSession.find({ group_id: req.params.id })
      .populate('creator_id', 'username avatar_url')
      .populate('attendees', 'username avatar_url')
      .sort({ scheduled_at: 1 }); // Sort chronologically

    const now = new Date();
    
    // Bucket into upcoming and past based on (scheduled_at + duration) vs now
    const upcoming = [];
    const past = [];

    sessions.forEach(session => {
      const endTime = new Date(session.scheduled_at.getTime() + session.duration_minutes * 60000);
      if (endTime > now) {
        upcoming.push(session);
      } else {
        past.push(session);
      }
    });

    // Reverse past so most recent is first
    res.json({ upcoming, past: past.reverse() });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ message: 'Server error fetching sessions.' });
  }
});

// POST /api/study-groups/:id/sessions - Create a session
router.post('/:id/sessions', authMiddleware, async (req, res) => {
  try {
    const { title, description, format, scheduled_at, duration_minutes } = req.body;
    
    if (!title || !scheduled_at || !duration_minutes) {
      return res.status(400).json({ message: 'Title, scheduled time, and duration are required.' });
    }

    const proposedStart = new Date(scheduled_at);
    if (proposedStart <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future.' });
    }

    const proposedEnd = new Date(proposedStart.getTime() + duration_minutes * 60000);

    // Overlap check
    const existingSessions = await GroupSession.find({
      group_id: req.params.id,
      status: 'active'
    });

    for (const s of existingSessions) {
      const sStart = new Date(s.scheduled_at);
      const sEnd = new Date(sStart.getTime() + s.duration_minutes * 60000);
      if (proposedStart < sEnd && proposedEnd > sStart) {
        return res.status(409).json({ message: 'This session overlaps with an existing active session in this group.' });
      }
    }

    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isOwner = group.owner_id.toString() === req.user.id;
    const isActiveMember = group.memberships.some(m => m.user.toString() === req.user.id && m.status === 'active');
    
    if (!isOwner && !isActiveMember) {
      return res.status(403).json({ message: 'Only members can create sessions.' });
    }

    const session = new GroupSession({
      group_id: req.params.id,
      creator_id: req.user.id,
      title,
      description,
      format,
      scheduled_at,
      duration_minutes,
      status: 'active',
      attendees: [req.user.id] // Creator auto-RSVPs
    });

    await session.save();

    // Update group activity
    group.last_activity = new Date();
    await group.save();
    
    // Notify active members
    const activeMembers = group.memberships
      .filter(m => m.status === 'active' && m.user.toString() !== req.user.id)
      .map(m => m.user.toString());
    if (group.owner_id.toString() !== req.user.id) activeMembers.push(group.owner_id.toString());
    const uniqueMembers = [...new Set(activeMembers)];

    const notificationsToCreate = uniqueMembers.map(userId => ({
      userId,
      type: 'group_session_scheduled',
      relatedContentId: group._id,
      message: `New session scheduled in ${group.name}: ${title}`,
      isRead: false
    }));
    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    const populated = await session.populate('creator_id attendees', 'username avatar_url');
    res.json(populated);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error creating session.' });
  }
});

// PUT /api/study-groups/:id/sessions/:sessionId - Edit a session
router.put('/:id/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { title, description, format, scheduled_at, duration_minutes } = req.body;
    
    const session = await GroupSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.group_id.toString() !== req.params.id) return res.status(400).json({ message: 'Session does not belong to this group.' });

    if (session.creator_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the session creator can edit it.' });
    }

    if (session.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot edit a cancelled session.' });
    }

    if (new Date(session.scheduled_at) <= new Date()) {
      return res.status(400).json({ message: 'Cannot edit a session that has already started.' });
    }

    const proposedStart = scheduled_at ? new Date(scheduled_at) : new Date(session.scheduled_at);
    if (scheduled_at && proposedStart <= new Date()) {
      return res.status(400).json({ message: 'New scheduled time must be in the future.' });
    }
    const proposedDuration = duration_minutes || session.duration_minutes;
    const proposedEnd = new Date(proposedStart.getTime() + proposedDuration * 60000);

    // Overlap check (excluding self)
    const existingSessions = await GroupSession.find({
      group_id: req.params.id,
      status: 'active',
      _id: { $ne: session._id }
    });

    for (const s of existingSessions) {
      const sStart = new Date(s.scheduled_at);
      const sEnd = new Date(sStart.getTime() + s.duration_minutes * 60000);
      if (proposedStart < sEnd && proposedEnd > sStart) {
        return res.status(409).json({ message: 'This edit causes an overlap with an existing active session.' });
      }
    }

    if (title) session.title = title;
    if (description !== undefined) session.description = description;
    if (format !== undefined) session.format = format;
    if (scheduled_at) session.scheduled_at = scheduled_at;
    if (duration_minutes) session.duration_minutes = duration_minutes;

    await session.save();
    const populated = await session.populate('creator_id attendees', 'username avatar_url');
    res.json(populated);
  } catch (error) {
    console.error('Edit session error:', error);
    res.status(500).json({ message: 'Server error editing session.' });
  }
});

// DELETE /api/study-groups/:id/sessions/:sessionId - Cancel/Delete a session
router.delete('/:id/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await GroupSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const group = await StudyGroup.findById(req.params.id);
    const isGroupOwner = group && group.owner_id.toString() === req.user.id;

    if (session.creator_id.toString() !== req.user.id && !isGroupOwner) {
      return res.status(403).json({ message: 'Only the creator or group owner can cancel this session.' });
    }

    if (new Date(session.scheduled_at) <= new Date() && !isGroupOwner) {
      return res.status(400).json({ message: 'Cannot cancel a session that has already started.' });
    }

    // Soft delete
    session.status = 'cancelled';
    await session.save();
    res.json({ message: 'Session cancelled.' });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({ message: 'Server error cancelling session.' });
  }
});

// POST /api/study-groups/:id/sessions/:sessionId/rsvp - Toggle RSVP
router.post('/:id/sessions/:sessionId/rsvp', authMiddleware, async (req, res) => {
  try {
    const session = await GroupSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const group = await StudyGroup.findById(req.params.id);
    const isOwner = group.owner_id.toString() === req.user.id;
    const isActiveMember = group.memberships.some(m => m.user.toString() === req.user.id && m.status === 'active');
    
    if (!isOwner && !isActiveMember) {
      return res.status(403).json({ message: 'Only members can RSVP.' });
    }

    if (session.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot RSVP to a cancelled session.' });
    }

    const endTime = new Date(session.scheduled_at.getTime() + session.duration_minutes * 60000);
    if (endTime <= new Date()) {
      return res.status(400).json({ message: 'Cannot RSVP to a past session.' });
    }

    const attendeeIndex = session.attendees.findIndex(id => id.toString() === req.user.id);
    
    if (attendeeIndex === -1) {
      // Join
      session.attendees.push(req.user.id);
    } else {
      // Leave
      session.attendees.splice(attendeeIndex, 1);
    }

    await session.save();
    const populated = await session.populate('creator_id attendees', 'username avatar_url');
    res.json(populated);
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ message: 'Server error with RSVP.' });
  }
});

module.exports = router;
