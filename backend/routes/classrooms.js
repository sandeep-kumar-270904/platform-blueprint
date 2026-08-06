const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { notifyDashboardUpdate } = require('../services/dashboardCache');
const VirtualClassroom = require('../models/VirtualClassroom');
const ClassroomParticipant = require('../models/ClassroomParticipant');
const ClassroomCollection = require('../models/ClassroomCollection');
const ClassroomMessage = require('../models/ClassroomMessage');
const authMiddleware = require('../middleware/auth');
const { actionRateLimiter } = require('../middleware/rateLimiter'); // ensure user is logged in

// GET /api/classrooms - Fetch classrooms with pagination

// GET /api/classrooms/dashboard-sync - Efficient dashboard sync
router.get('/dashboard-sync', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Find classrooms hosted by user
    const hosted = await VirtualClassroom.find({ host_id: userId }).lean();
    
    // Find participations
    const participations = await ClassroomParticipant.find({ user_id: userId }).populate('classroom_id').lean();
    
    let liveClasses = [];
    let upcomingClasses = [];
    let waitlisted = [];
    let recentRecordings = [];
    let hostActions = 0;

    // Process hosted
    for (const c of hosted) {
      if (c.status === 'live' || (new Date(c.scheduled_at) <= now && c.status !== 'completed' && c.status !== 'cancelled')) {
        liveClasses.push({ ...c, role: 'host' });
      } else if (new Date(c.scheduled_at) > now && c.status !== 'cancelled') {
        upcomingClasses.push({ ...c, role: 'host' });
        if (c.room_settings?.is_locked) {
          hostActions += Math.floor(Math.random() * 3); // mocked pending actions
        }
      }
    }

    // Process participant
    for (const p of participations) {
      if (!p.classroom_id) continue;
      const c = p.classroom_id;
      
      if (p.status === 'waitlisted') {
        waitlisted.push({ ...c, waitlistPos: Math.floor(Math.random() * 5) + 1 });
      } else if (c.status === 'completed' && c.recording_url) {
        recentRecordings.push(c);
      } else if (c.status === 'live' || (new Date(c.scheduled_at) <= now && c.status !== 'completed' && c.status !== 'cancelled')) {
        liveClasses.push({ ...c, role: 'participant' });
      } else if (new Date(c.scheduled_at) > now && c.status !== 'cancelled') {
        upcomingClasses.push({ ...c, role: 'participant' });
      }
    }

    // Sort appropriately
    upcomingClasses.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    recentRecordings.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    res.json({
      liveClasses,
      upcomingClasses: upcomingClasses.slice(0, 3),
      waitlisted: waitlisted.slice(0, 2),
      recentRecordings: recentRecordings.slice(0, 2),
      hostActions,
      stats: {
        attended: participations.filter(p => p.status === 'attending' || p.status === 'left').length,
        hosted: hosted.length,
        badges: hosted.some(h => h.is_featured) ? 1 : 0
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.q) {
      const regex = new RegExp(req.query.q, 'i');
      query = { $or: [{ title: regex }, { subject: regex }, { description: regex }] };
    }

    const classrooms = await VirtualClassroom.find(query)
      .sort({ is_featured: -1, scheduled_at: 1 })
      .skip(skip)
      .limit(limit)
      .populate('host_id', 'first_name last_name avatar is_verified_host');

    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/host - Fetch classrooms hosted by the user
router.get('/host', authMiddleware, async (req, res) => {
  try {
    const classrooms = await VirtualClassroom.find({ host_id: req.user.id }).sort({ scheduled_at: 1 });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/host/analytics - Fetch analytics for host
router.get('/host/analytics', authMiddleware, async (req, res) => {
  try {
    const hostedClasses = await VirtualClassroom.find({ host_id: req.user.id });
    
    if (!hostedClasses || hostedClasses.length === 0) {
      return res.json({ totalSessions: 0 });
    }

    // Mock analytics for now, can be replaced with real DB models later
    res.json({
      totalSessions: hostedClasses.length,
      totalAttendees: Math.floor(Math.random() * 100) + 10,
      avgRating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      avgDuration: Math.floor(Math.random() * 60) + 30, // 30 - 90 mins
      totalEarnings: Math.floor(Math.random() * 1000)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/templates - Fetch classroom templates for host
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const VirtualClassroomTemplate = require('../models/VirtualClassroomTemplate');
    const templates = await VirtualClassroomTemplate.find({
      $or: [
        { host_id: req.user.id },
        { is_global: true }
      ]
    }).sort({ created_at: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/templates - Create a classroom template
router.post('/templates', authMiddleware, async (req, res) => {
  try {
    const VirtualClassroomTemplate = require('../models/VirtualClassroomTemplate');
    const newTemplate = new VirtualClassroomTemplate({
      ...req.body,
      host_id: req.user.id
    });
    const savedTemplate = await newTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/bulk - Create multiple sessions
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const sessions = req.body.sessions.map(s => ({
      ...s,
      host_id: req.user.id,
      join_code: Math.random().toString(36).substring(2, 10)
    }));
    
    const savedSessions = await VirtualClassroom.insertMany(sessions);
    res.status(201).json(savedSessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/my-participation - Fetch user's RSVPs
router.get('/my-participation', authMiddleware, async (req, res) => {
  try {
    const participations = await ClassroomParticipant.find({ user_id: req.user.id });
    res.json(participations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/classrooms/history - Fetch user's completed classes history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const myParticipations = await ClassroomParticipant.find({ user_id: req.user.id });
    const myClassIds = myParticipations.map(p => p.classroom_id);
    
    // Find those classes that are completed
    const historyClasses = await VirtualClassroom.find({ 
      _id: { $in: myClassIds },
      status: 'completed'
    }).sort({ scheduled_at: -1 });
    
    // Map with participation details
    const result = historyClasses.map(c => {
      const p = myParticipations.find(part => part.classroom_id.toString() === c._id.toString());
      return {
        classroom: c,
        participation: p
      };
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/collections - Fetch collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await ClassroomCollection.find({ is_active: true }).populate('items.classroom_id');
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/classrooms/check-conflict - Check schedule overlap
router.post('/check-conflict', authMiddleware, async (req, res) => {
  try {
    const { scheduled_at, duration_minutes, role } = req.body;
    if (!scheduled_at || !duration_minutes) return res.status(400).json({ message: 'Missing time details' });

    const newStart = new Date(scheduled_at).getTime();
    const newEnd = newStart + (duration_minutes * 60000);

    let conflict = false;
    let conflictClass = null;

    if (role === 'host') {
      // Check if user is hosting another class at this time
      const hosted = await VirtualClassroom.find({ host_id: req.user.id, status: { $in: ['scheduled', 'live'] } });
      for (const c of hosted) {
        const cStart = new Date(c.scheduled_at).getTime();
        const cEnd = cStart + (c.duration_minutes * 60000);
        if (newStart < cEnd && newEnd > cStart) {
          conflict = true;
          conflictClass = c;
          break;
        }
      }
    } else {
      // Check if user is attending another class at this time
      const participations = await ClassroomParticipant.find({ user_id: req.user.id, status: { $in: ['registered', 'attending'] } }).populate('classroom_id');
      for (const p of participations) {
        if (!p.classroom_id || p.classroom_id.status === 'completed' || p.classroom_id.status === 'cancelled') continue;
        const c = p.classroom_id;
        const cStart = new Date(c.scheduled_at).getTime();
        const cEnd = cStart + ((c.duration_minutes || 60) * 60000);
        if (newStart < cEnd && newEnd > cStart) {
          conflict = true;
          conflictClass = c;
          break;
        }
      }
    }

    res.json({ conflict, conflicting_class: conflictClass ? conflictClass.title : null });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms - Create a new classroom
router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.is_verified_host) {
      return res.status(403).json({ message: 'Host verification required to create classrooms.' });
    }

    const join_code = Math.random().toString(36).substring(2, 10);
    const newClassroom = new VirtualClassroom({
      ...req.body,
      host_id: req.user.id,
      join_code
    });

    const savedClassroom = await newClassroom.save();
    res.status(201).json(savedClassroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/classrooms/:id/join - RSVP/Join a classroom
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    let participant = await ClassroomParticipant.findOne({ classroom_id: classroom._id, user_id: req.user.id });
    
    if (participant) {
      if (participant.status === 'left') {
        participant.status = 'registered';
        await participant.save();
        return res.json({ message: 'Re-joined successfully' });
      }
      return res.status(400).json({ message: 'Already joined' });
    }

    const status = classroom.participant_count >= classroom.max_participants ? 'waitlisted' : 'registered';
    
    participant = new ClassroomParticipant({
      classroom_id: classroom._id,
      user_id: req.user.id,
      status,
      role: classroom.host_id.toString() === req.user.id ? 'host' : 'participant'
    });

    await participant.save();

    if (status === 'registered') {
      classroom.participant_count += 1;
      await classroom.save();
    }

    notifyDashboardUpdate(req, req.user.id);
    res.json({ message: status === 'waitlisted' ? 'Added to waitlist' : 'Joined successfully', status });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/leave - Leave a classroom
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const participant = await ClassroomParticipant.findOne({ classroom_id: req.params.id, user_id: req.user.id });
    if (!participant) return res.status(400).json({ message: 'Not joined' });

    const wasRegistered = participant.status === 'registered' || participant.status === 'attending';

    participant.status = 'left';
    await participant.save();

    // Decrement count if they were registered (not waitlisted)
    if (wasRegistered) {
      const classroom = await VirtualClassroom.findById(req.params.id);
      if (classroom && classroom.participant_count > 0) {
        classroom.participant_count -= 1;
        
        // Waitlist promotion logic
        const nextInLine = await ClassroomParticipant.findOne({ classroom_id: classroom._id, status: 'waitlisted' }).sort({ createdAt: 1 });
        if (nextInLine) {
          nextInLine.status = 'registered';
          await nextInLine.save();
          classroom.participant_count += 1;
        }

        await classroom.save();
      }
    }

    notifyDashboardUpdate(req, req.user.id);
    res.json({ message: 'Left successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/classrooms/:id - Delete a classroom
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    if (classroom.host_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await classroom.deleteOne();
    await ClassroomParticipant.deleteMany({ classroom_id: req.params.id });
    
    res.json({ message: 'Classroom deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/:id/messages - Get chat messages
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await ClassroomMessage.find({ classroom_id: req.params.id }).sort({ created_at: 1 });
    
    // Enrich with profiles
    const User = require('../models/User');
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const users = await User.find({ _id: { $in: userIds } }).select('username full_name avatar_url');
    const userMap = users.reduce((acc, u) => { acc[u._id] = u; return acc; }, {});
    
    const enriched = messages.map(m => {
      const mObj = m.toObject();
      mObj.profile = userMap[m.user_id];
      return mObj;
    });
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/messages - Send chat message
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const newMessage = new ClassroomMessage({
      classroom_id: req.params.id,
      user_id: req.user.id,
      content: req.body.content
    });
    const savedMessage = await newMessage.save();
    
    // Broadcast message to room using socket.io
    req.io.to(`classroom_${req.params.id}`).emit('new_message', savedMessage);
    
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/messages/:messageId/reactions - React to message
router.post('/:id/messages/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await ClassroomMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    // In a full implementation, this might be a separate Reaction model or an array on the message
    // For now we will just mock a success since we are finishing up the blueprint
    req.io.to(`classroom_${req.params.id}`).emit('message_reaction', {
      message_id: req.params.messageId,
      user_id: req.user.id,
      emoji
    });
    
    res.json({ message: 'Reaction added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/classrooms/:id/messages/:messageId - Delete a message
router.delete('/:id/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await ClassroomMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    // Allow author or classroom host to delete
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (message.user_id.toString() !== req.user.id && classroom.host_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete' });
    }
    
    await message.deleteOne();
    
    req.io.to(`classroom_${req.params.id}`).emit('message_deleted', req.params.messageId);
    
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/settings - Update settings (Host only)
router.post('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    classroom.room_settings = { ...classroom.room_settings, ...req.body.settings };
    await classroom.save();

    req.io.to(`classroom_${req.params.id}`).emit('settings_updated', classroom.room_settings);

    res.json(classroom.room_settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/classrooms/paths - Fetch learning paths
router.get('/paths', async (req, res) => {
  try {
    const ClassroomLearningPath = require('../models/ClassroomLearningPath');
    const paths = await ClassroomLearningPath.find().populate('classes', 'title subject scheduled_at status rating_avg host_id is_paid price');
    res.json(paths);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/paths/:id - Fetch single learning path
router.get('/paths/:id', async (req, res) => {
  try {
    const ClassroomLearningPath = require('../models/ClassroomLearningPath');
    const path = await ClassroomLearningPath.findById(req.params.id).populate('classes', 'title subject scheduled_at status rating_avg host_id is_paid price');
    if (!path) return res.status(404).json({ message: 'Not found' });
    res.json(path);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/:id - Get single classroom details
router.get('/:id', async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/transactions - Mock payment completion
router.post('/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    
    // In a real app we'd save a transaction record to Stripe and the DB here
    res.json({ message: 'Payment successful', transaction_id: 'tx_mock_' + Date.now() });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



// POST /api/classrooms/:id/group-enroll - Enroll a cohort
router.post('/:id/group-enroll', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { group_name, emails } = req.body;
    if (!group_name || !emails || !Array.isArray(emails)) return res.status(400).json({ message: 'Invalid payload' });

    // For a real app we'd look up User IDs by email. Here we mock user ids for missing ones.
    const User = require('../models/User');
    const existingUsers = await User.find({ email: { $in: emails } });
    
    for (const email of emails) {
      let u = existingUsers.find(x => x.email === email);
      let uId = u ? u._id : null;
      if (!uId) {
        // Mock user id creation for demonstration purposes if email not found
        const mongoose = require('mongoose');
        uId = new mongoose.Types.ObjectId();
      }
      
      const existing = await ClassroomParticipant.findOne({ classroom_id: classroom._id, user_id: uId });
      if (!existing) {
        const participant = new ClassroomParticipant({
          classroom_id: classroom._id,
          user_id: uId,
          status: 'registered',
          group_name
        });
        await participant.save();
      }
    }
    
    res.json({ message: 'Group enrolled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/:id/export-roster - Export class roster as CSV
router.get('/:id/export-roster', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const participants = await ClassroomParticipant.find({ classroom_id: classroom._id });
    
    // We would populate User to get Name and Email. For demo, we just export what we have.
    let csv = "User ID,Status,Group Name,Joined At,Attendance Minutes,Rating\n";
    for (const p of participants) {
      csv += `${p.user_id},${p.status},${p.group_name || 'Individual'},${p.joined_at},${p.attendance_minutes || 0},${p.rating || ''}\n`;
    }
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`${classroom.title.replace(/\s+/g, '_')}_roster.csv`);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/bulk-message - Send a message to all participants
router.post('/:id/bulk-message', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    // In a real app this triggers emails/push notifications. 
    // We just save it in announcements for now.
    classroom.announcements.push({
      message,
      created_at: new Date()
    });
    
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/ai-summary - Save AI summary and transcript
router.post('/:id/ai-summary', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    // Assuming we receive the summary directly for this demo
    classroom.ai_summary = req.body.ai_summary;
    classroom.ai_action_items = req.body.ai_action_items;
    
    // Also simulate a transcript if it doesn't exist
    if (!classroom.transcript_text) {
      classroom.transcript_text = "00:00 - Welcome everyone to today's session.\n00:05 - Let's get started with the main topic.\n00:20 - Are there any questions?\n00:45 - Great, thanks for attending!";
    }
    
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/translate-transcript - Simulate translation
router.post('/:id/translate-transcript', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    
    const { lang } = req.body;
    if (!lang) return res.status(400).json({ message: 'Language required' });
    
    // Simulate translated text
    let translated = "00:00 - Translated text for " + lang + "...\n00:05 - More translated text...\n00:20 - Any questions?\n00:45 - End of translated transcript.";
    if (lang === 'hi') {
      translated = "00:00 - आज के सत्र में सभी का स्वागत है।\n00:05 - चलिए मुख्य विषय से शुरू करते हैं।\n00:20 - क्या कोई प्रश्न हैं?\n00:45 - उपस्थित होने के लिए धन्यवाद!";
    } else if (lang === 'ta') {
      translated = "00:00 - இன்றைய அமர்வுக்கு அனைவரையும் வரவேற்கிறோம்.\n00:05 - முக்கிய தலைப்புடன் தொடங்குவோம்.\n00:20 - ஏதேனும் கேள்விகள் உள்ளதா?\n00:45 - நன்றி!";
    } else if (lang === 'te') {
      translated = "00:00 - నేటి సెషన్‌కు అందరికీ స్వాగతం.\n00:05 - ప్రధాన అంశంతో ప్రారంభిద్దాం.\n00:20 - ఏమైనా ప్రశ్నలు ఉన్నాయా?\n00:45 - ధన్యవాదాలు!";
    }
    
    classroom.translated_transcripts.set(lang, translated);
    await classroom.save();
    
    res.json({ transcript: translated });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/save-template - Save class as template
router.post('/:id/save-template', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const VirtualClassroomTemplate = require('../models/VirtualClassroomTemplate');
    const newTemplate = new VirtualClassroomTemplate({
      host_id: req.user.id,
      title: classroom.title + " (Template)",
      subject: classroom.subject,
      description: classroom.description,
      duration_minutes: classroom.duration_minutes,
      max_participants: classroom.max_participants,
      visibility: classroom.visibility,
      type: classroom.type,
      is_paid: classroom.is_paid,
      price: classroom.price,
      is_global: false
    });
    const saved = await newTemplate.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/classrooms/:id - Edit a classroom (Host only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    Object.assign(classroom, req.body);
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/classrooms/:id/cancel - Cancel a classroom (Host only)
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    classroom.status = 'cancelled';
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/classrooms/:id/recording - Add recording URL (Host only)
router.patch('/:id/recording', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    classroom.recording_url = req.body.recording_url;
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/classrooms/:id/reminders - Toggle reminders (Participant only)
router.patch('/:id/reminders', authMiddleware, async (req, res) => {
  try {
    const participant = await ClassroomParticipant.findOne({ classroom_id: req.params.id, user_id: req.user.id });
    if (!participant) return res.status(400).json({ message: 'Not joined' });

    participant.reminders_opt_in = !participant.reminders_opt_in;
    await participant.save();
    res.json({ message: 'Reminders updated', reminders_opt_in: participant.reminders_opt_in });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/rating - Submit rating (Participant only)
router.post('/:id/rating', authMiddleware, async (req, res) => {
  try {
    const participant = await ClassroomParticipant.findOne({ classroom_id: req.params.id, user_id: req.user.id });
    if (!participant) return res.status(400).json({ message: 'Not joined' });

    const { rating, feedback } = req.body;
    
    const isNewRating = participant.rating == null;
    participant.rating = rating;
    participant.feedback = feedback;
    await participant.save();

    await awardBadge(req.user.id, 'first_feedback_left', 'Feedback Provider');

    const classroom = await VirtualClassroom.findById(req.params.id);
    if (classroom) {
      if (isNewRating) {
        const total = classroom.rating_avg * classroom.rating_count;
        classroom.rating_count += 1;
        classroom.rating_avg = (total + rating) / classroom.rating_count;
      } else {
        const allRatings = await ClassroomParticipant.find({ classroom_id: classroom._id, rating: { $ne: null } });
        const sum = allRatings.reduce((acc, p) => acc + p.rating, 0);
        classroom.rating_count = allRatings.length;
        classroom.rating_avg = sum / allRatings.length;
      }
      await classroom.save();
    }

    res.json({ message: 'Rating submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/materials - Add material
router.post('/:id/materials', authMiddleware, actionRateLimiter, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id && (!classroom.co_hosts || !classroom.co_hosts.some(id => id.toString() === req.user.id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { title, url, type } = req.body;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return res.status(400).json({ message: 'Invalid URL protocol' });
    } catch (e) {
      return res.status(400).json({ message: 'Invalid URL' });
    }
    classroom.materials = classroom.materials || [];
    classroom.materials.push({ title, url, type });
    await classroom.save();
    if (req.io) req.io.to(`classroom_${classroom._id}`).emit('materials_updated', classroom.materials);
    res.json(classroom.materials);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/announcements - Add announcement
router.post('/:id/announcements', authMiddleware, actionRateLimiter, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id && (!classroom.co_hosts || !classroom.co_hosts.some(id => id.toString() === req.user.id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { message } = req.body;
    classroom.announcements = classroom.announcements || [];
    classroom.announcements.push({ message, created_at: new Date() });
    await classroom.save();
    
    if (req.io) req.io.to(`classroom_${classroom._id}`).emit('new_announcement', { message, created_at: new Date() });
    
    const participants = await ClassroomParticipant.find({ classroom_id: classroom._id, status: { $in: ['registered', 'attending'] } });
    const notifications = participants.map(p => ({
      userId: p.user_id,
      type: 'classroom_announcement',
      message: `New announcement in ${classroom.title}: ${message}`,
      relatedLiveSession: classroom._id
    }));
    if (notifications.length > 0) {
      const Notification = require('../models/Notification');
      await Notification.insertMany(notifications);
    }
    
    res.json(classroom.announcements);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/attend - Mark attendance
router.post('/:id/attend', authMiddleware, actionRateLimiter, async (req, res) => {
  try {
    const participant = await ClassroomParticipant.findOne({ classroom_id: req.params.id, user_id: req.user.id });
    if (!participant) return res.status(400).json({ message: 'Not joined' });
    if (!participant.joined_live_at) {
      participant.joined_live_at = new Date();
      participant.status = 'attending';
      await participant.save();
    }
    res.json(participant);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/classrooms/:id/my-data - Scrub user data
router.delete('/:id/my-data', authMiddleware, async (req, res) => {
  try {
    const participant = await ClassroomParticipant.findOne({ classroom_id: req.params.id, user_id: req.user.id });
    if (!participant) return res.status(404).json({ message: 'Participant not found' });
    
    participant.feedback = null;
    participant.technical_issue = null;
    participant.technical_issue_details = null;
    await participant.save();
    
    await ClassroomMessage.deleteMany({ classroom_id: req.params.id, user_id: req.user.id });
    
    const AuditLog = require('../models/AuditLog');
const { awardBadge } = require('../utils/gamification');

    await AuditLog.create({
      actor_id: req.user.id,
      action: 'classroom_data_scrubbed',
      entity_type: 'VirtualClassroom',
      entity_id: req.params.id
    });
    
    res.json({ message: 'Your personal data for this class has been scrubbed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/classrooms/verify-host - Request Host Verification
router.post('/verify-host', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.host_verification_status === 'verified') {
      return res.status(400).json({ message: 'Already verified' });
    }
    
    if (user.host_verification_status === 'pending') {
      return res.status(400).json({ message: 'Verification already pending' });
    }
    
    const { proof } = req.body;
    if (!proof) {
      return res.status(400).json({ message: 'Proof is required' });
    }

    user.host_verification_proof = proof;
    user.host_verification_status = 'pending';
    user.is_verified_host = false;
    await user.save();
    
    res.json({ message: 'Host verification request submitted successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/feature - Admin feature class
router.post('/:id/feature', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin' && user.adminRole !== 'super') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    
    classroom.is_featured = !classroom.is_featured;
    await classroom.save();
    
    res.json({ message: 'Classroom feature status updated', is_featured: classroom.is_featured });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/classrooms/:id/study-partners - Find cross-class matching
router.get('/:id/study-partners', authMiddleware, async (req, res) => {
  try {
    // 1. Get all participants in current class
    const currentClassParticipants = await ClassroomParticipant.find({ 
      classroom_id: req.params.id, 
      status: { $in: ['registered', 'attending'] },
      user_id: { $ne: req.user.id } // Exclude self
    });
    
    if (currentClassParticipants.length === 0) {
      return res.json([]); // No partners found
    }
    
    const candidateIds = currentClassParticipants.map(p => p.user_id);
    
    // 2. Find how many OTHER classes the current user and candidates have shared
    // Get current user's classes
    const myParticipations = await ClassroomParticipant.find({ user_id: req.user.id });
    const myClassIds = myParticipations.map(p => p.classroom_id.toString()).filter(id => id !== req.params.id);
    
    // Get candidates' classes in the intersection
    const candidateParticipations = await ClassroomParticipant.find({
      user_id: { $in: candidateIds },
      classroom_id: { $in: myClassIds }
    });
    
    // Calculate overlap count
    const overlapMap = {};
    candidateIds.forEach(id => overlapMap[id.toString()] = 0);
    
    // Get current classroom details for prerequisites
    const VirtualClassroom = require('../models/VirtualClassroom');
    const currentClass = await VirtualClassroom.findById(req.params.id);
    const prereqs = (currentClass.prerequisite_classes || []).map(id => id.toString());
    
    // Check if candidates share prerequisites or learning paths
    const ClassroomLearningPath = require('../models/ClassroomLearningPath');
    const paths = await ClassroomLearningPath.find({ classes: req.params.id });
    const pathIds = paths.map(p => p._id.toString());
    
    // Weight calculation
    // +1 for any shared past class
    // +3 for shared prerequisite class
    // +2 for being in the same learning path (assumed if they took a past class that is also in the same path)
    
    for (const p of candidateParticipations) {
      const uId = p.user_id.toString();
      const cId = p.classroom_id.toString();
      
      let weight = 1; // Base overlap
      if (prereqs.includes(cId)) {
        weight += 3; // Shared prerequisite
      }
      
      // Check if shared class belongs to same learning path
      const sharedClassPaths = await ClassroomLearningPath.find({ classes: cId });
      const sharedPathIds = sharedClassPaths.map(p => p._id.toString());
      const sharesPath = sharedPathIds.some(sp => pathIds.includes(sp));
      if (sharesPath) {
        weight += 2; // Progressing in same learning path
      }
      
      overlapMap[uId] += weight;
    }
    
    // Convert to array and sort
    const matches = Object.keys(overlapMap)
      .map(userId => ({ userId, overlap: overlapMap[userId] }))
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 5); // Top 5
      
    // Populate user info
    const User = require('../models/User');
    const populatedMatches = await Promise.all(matches.map(async m => {
      const user = await User.findById(m.userId).select('full_name email skills bio avatar_url');
      return { ...m, user };
    }));
    
    res.json(populatedMatches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/:id/alternatives - Get similar active classes
router.get('/:id/alternatives', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    
    const alternatives = await VirtualClassroom.find({
      _id: { $ne: classroom._id },
      subject: classroom.subject,
      status: 'scheduled',
      visibility: 'public',
      $expr: { $lt: ['$participant_count', '$max_participants'] }
    }).limit(3).populate('host_id', 'first_name last_name avatar is_verified_host');
    
    res.json(alternatives);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/feedback/:participantId/respond - Host responds to feedback
router.post('/:id/feedback/:participantId/respond', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    
    if (classroom.host_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can respond to feedback' });
    }
    
    const participant = await ClassroomParticipant.findById(req.params.participantId);
    if (!participant) return res.status(404).json({ message: 'Participant not found' });
    
    participant.host_response = req.body.response;
    participant.host_responded_at = new Date();
    await participant.save();
    
    res.json({ message: 'Response added', participant });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
