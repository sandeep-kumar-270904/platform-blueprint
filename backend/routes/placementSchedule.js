const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const MentorBooking = require('../models/MentorBooking');
const OAAttempt = require('../models/OAAttempt');
const GDLiveSession = require('../models/GDLiveSession');
const QuizChallenge = require('../models/QuizChallenge');
const PlacementOnboarding = require('../models/PlacementOnboarding');
const ReferralRequest = require('../models/ReferralRequest');
const NotificationPreference = require('../models/NotificationPreference');

// Get all unified placement schedule events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const events = [];
    
    // Bounds: -30 days to +90 days
    const now = new Date();
    const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

    // 1. Mock Interviews (as Mentee)
    const mockBookings = await MentorBooking.find({
      menteeId: userId,
      status: { $in: ['requested', 'confirmed'] },
      scheduledAt: { $gte: startDate, $lte: endDate }
    }).populate('mentorId');
    
    mockBookings.forEach(booking => {
      events.push({
        id: `mock-${booking._id}`,
        type: 'mock_interview',
        title: `Mock Interview with ${booking.mentorId ? 'Mentor' : 'Pending'}`,
        start: booking.scheduledAt,
        end: new Date(new Date(booking.scheduledAt).getTime() + (booking.durationMinutes * 60000)),
        url: '/placement/interviews/mock',
        color: '#e879f9' // Fuchsia
      });
    });

    // 2. OA Simulations (Planned)
    const oaSimulations = await OAAttempt.find({
      user: userId,
      status: 'Planned',
      scheduledFor: { $gte: startDate, $lte: endDate }
    });
    
    oaSimulations.forEach(oa => {
      if (oa.scheduledFor) {
        events.push({
          id: `oa-${oa._id}`,
          type: 'oa_simulation',
          title: `OA Simulation: ${oa.oaDefinitionSnapshot?.title || 'Practice Test'}`,
          start: oa.scheduledFor,
          end: new Date(new Date(oa.scheduledFor).getTime() + (90 * 60000)), // assume 90 mins
          url: `/placement/oa-simulation/${oa._id}`,
          color: '#38bdf8' // Sky
        });
      }
    });

    // 3. Live GD Practice Sessions
    const gdSessions = await GDLiveSession.find({
      'rsvps.user': userId,
      'rsvps.status': 'Attending',
      status: 'Scheduled',
      scheduledTime: { $gte: startDate, $lte: endDate }
    });
    
    gdSessions.forEach(gd => {
      events.push({
        id: `gd-${gd._id}`,
        type: 'gd_session',
        title: `GD Session: ${gd.topicTitle}`,
        start: gd.scheduledTime,
        end: new Date(new Date(gd.scheduledTime).getTime() + (45 * 60000)), // assume 45 mins
        url: '/placement/group-discussion',
        color: '#fb923c' // Orange
      });
    });

    // 4. Weekly Challenge Deadlines
    const challenges = await QuizChallenge.find({
      challengedId: userId,
      status: 'pending',
      expiresAt: { $gte: startDate, $lte: endDate }
    }).populate('quizId');
    
    challenges.forEach(challenge => {
      events.push({
        id: `challenge-${challenge._id}`,
        type: 'weekly_challenge',
        title: `Challenge Deadline: ${challenge.quizId?.title || 'Quiz'}`,
        start: challenge.expiresAt, // All day or specific time
        end: challenge.expiresAt,
        url: '/placement/challenges',
        color: '#facc15' // Yellow
      });
    });

    // 5. Referral Request Follow-ups
    const referrals = await ReferralRequest.find({
      requester: userId,
      status: 'pending'
    }).populate({ path: 'referrer_profile', populate: { path: 'user' }});
    
    referrals.forEach(ref => {
      const followUpDate = new Date(ref.createdAt);
      followUpDate.setDate(followUpDate.getDate() + 7);
      
      if (followUpDate >= startDate && followUpDate <= endDate) {
        events.push({
          id: `ref-${ref._id}`,
          type: 'referral_followup',
          title: `Follow up: Referral from ${ref.referrer_profile?.user?.name || 'Alumnus'}`,
          start: followUpDate,
          end: followUpDate,
          url: '/placement/referrals',
          color: '#10b981' // Emerald
        });
      }
    });

    // 6. Prep Plan Milestones
    const plan = await PlacementOnboarding.findOne({ user: userId });
    if (plan && plan.active_plan) {
      const activePlan = plan.active_plan;
      const planStartDate = new Date(activePlan.start_date);
      
      activePlan.phases.forEach((phase, phaseIdx) => {
        const phaseEnd = new Date(planStartDate);
        phaseEnd.setDate(phaseEnd.getDate() + ((phaseIdx + 1) * 14));
        
        if (phaseEnd >= startDate && phaseEnd <= endDate) {
          events.push({
            id: `milestone-${phase._id}`,
            type: 'prep_milestone',
            title: `Milestone: Finish ${phase.title}`,
            start: phaseEnd,
            end: phaseEnd,
            url: '/placement',
            color: '#818cf8' // Indigo
          });
        }
      });
    }

    res.json(events);
  } catch (error) {
    console.error('Schedule Error:', error);
    res.status(500).json({ message: 'Server error fetching schedule' });
  }
});

// Get User Reminder Preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    let prefs = await NotificationPreference.findOne({ user_id: req.user.id });
    if (!prefs) {
      prefs = new NotificationPreference({ user_id: req.user.id });
      
      // Initialize defaults
      prefs.eventReminders = [
        { eventType: 'mock_interview', leadTimeMinutes: 1440, enabled: true },
        { eventType: 'oa_simulation', leadTimeMinutes: 1440, enabled: true },
        { eventType: 'gd_session', leadTimeMinutes: 120, enabled: true },
        { eventType: 'weekly_challenge', leadTimeMinutes: 1440, enabled: true }
      ];
      
      await prefs.save();
    }
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Reminder Preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { daily_digest, eventReminders } = req.body;
    
    let prefs = await NotificationPreference.findOne({ user_id: req.user.id });
    if (!prefs) {
      prefs = new NotificationPreference({ user_id: req.user.id });
    }
    
    if (daily_digest !== undefined) {
      prefs.daily_digest = daily_digest;
    }
    
    if (eventReminders && Array.isArray(eventReminders)) {
      prefs.eventReminders = eventReminders;
    }
    
    await prefs.save();
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
