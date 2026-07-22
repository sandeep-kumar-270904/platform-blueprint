const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Note = require('../models/Note');
const Idea = require('../models/Idea');
const StudyGroup = require('../models/StudyGroup');
const Notification = require('../models/Notification');
const VirtualClassroom = require('../models/VirtualClassroom');
const PlacementOnboarding = require('../models/PlacementOnboarding');
const DSAProgress = require('../models/DSAProgress');
const DSAProblem = require('../models/DSAProblem');
const InterviewPrepProgress = require('../models/InterviewPrepProgress');
const TargetCompany = require('../models/TargetCompany');
const MentorBooking = require('../models/MentorBooking');
const PlacementProfile = require('../models/PlacementProfile');
const UserActivity = require('../models/UserActivity');
const OAAttempt = require('../models/OAAttempt');
const GDLiveSession = require('../models/GDLiveSession');

const PROGRESS_WEIGHTS = {
  dsaTarget: 50, dsaWeight: 0.40,
  prepTargetScore: 100, prepWeight: 0.30,
  mockTarget: 2, mockWeight: 0.30
};

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Aggregate notes stats
    const notes = await Note.find({ user_id: userId });
    const views = notes.reduce((sum, n) => sum + (n.views || 0), 0);
    const downloads = notes.reduce((sum, n) => sum + (n.downloads || 0), 0);
    
    const ideasCount = await Idea.countDocuments({ user_id: userId });
    
    // Check if user is part of a study group
    const teamsCount = await StudyGroup.countDocuments({ 
      $or: [ { creator_id: userId }, { 'members.user_id': userId } ]
    });
    
    const notificationsCount = await Notification.countDocuments({ userId: userId, isRead: false });
    
    res.json({
      notes: { total: notes.length, views, downloads },
      ideas: ideasCount,
      teams: teamsCount,
      notifications: notificationsCount,
      gamification: { points: 1250, level: 5, rank: 'Scholar', next_level_points: 2000 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/host
router.get('/host', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sessions = await VirtualClassroom.find({ host_id: userId }).sort({ scheduled_at: 1 });
    // Assume templates are empty for now as it's a mock
    const templates = [];
    
    res.json({ sessions, templates });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notes = await Note.find({ user_id: userId })
      .select('title views downloads rating')
      .sort({ views: -1 });
    
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');

// GET /api/dashboard/join-requests
router.get('/join-requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Get all ideas owned by the user
    const userIdeas = await Idea.find({ user_id: userId });
    const ideaIds = userIdeas.map(i => i._id);
    
    // Find all pending join requests for these ideas
    const requests = await JoinRequest.find({ idea_id: { $in: ideaIds }, status: 'pending' }).sort({ created_at: -1 });
    
    // Enrich with idea title and applicant name
    const applicantIds = [...new Set(requests.map(r => r.user_id))];
    const applicants = await User.find({ _id: { $in: applicantIds } }).select('username');
    const applicantMap = applicants.reduce((acc, u) => { acc[u._id] = u; return acc; }, {});
    
    const ideaMap = userIdeas.reduce((acc, i) => { acc[i._id] = i; return acc; }, {});
    
    const enriched = requests.map(r => {
      const rObj = r.toObject();
      rObj.id = r._id;
      rObj.idea_title = ideaMap[r.idea_id]?.title || 'Unknown Idea';
      rObj.applicant_name = applicantMap[r.user_id]?.username || 'Unknown User';
      return rObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/dashboard/join-requests/:id/accept
router.post('/join-requests/:id/accept', authMiddleware, async (req, res) => {
  try {
    const request = await JoinRequest.findByIdAndUpdate(req.params.id, { status: 'accepted' }, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // In a real app we would add the user to the team here
    // const TeamMember = require('../models/TeamMember');
    // await new TeamMember({ team_id: request.team_id || request.idea_id, user_id: request.user_id, role: request.requested_role }).save();
    
    res.json({ message: 'Accepted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/dashboard/join-requests/:id/reject
router.post('/join-requests/:id/reject', authMiddleware, async (req, res) => {
  try {
    const request = await JoinRequest.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/my-ideas
router.get('/my-ideas', authMiddleware, async (req, res) => {
  try {
    const ideas = await Idea.find({ user_id: req.user.id }).sort({ created_at: -1 });
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/upcoming-sessions
router.get('/upcoming-sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await VirtualClassroom.find({ 
      $or: [{ host_id: req.user.id }, { participants: req.user.id }],
      status: 'scheduled'
    }).sort({ scheduled_at: 1 }).limit(5);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/live-activity
router.get('/live-activity', authMiddleware, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'username full_name avatar_url bio videoIntroUrl institutionVerified badges quizStreak totalQuizPoints'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Calculate sessions hosted / attended
    const sessions_hosted = await VirtualClassroom.countDocuments({ host_id: req.user.id });
    const sessions_attended = await VirtualClassroom.countDocuments({ participants: req.user.id });

    res.json({
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      videoIntroUrl: user.videoIntroUrl,
      institutionVerified: user.institutionVerified,
      sessions_hosted,
      sessions_attended,
      badges: user.badges || [],
      quizStreak: user.quizStreak || 0,
      totalQuizPoints: user.totalQuizPoints || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/dashboard/placement-summary
router.get('/placement-summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check for any sign of activity or onboarding
    const onboarding = await PlacementOnboarding.findOne({ user: userId });
    const dsaProgress = await DSAProgress.findOne({ user_id: userId });
    const mocksCompleted = await MentorBooking.countDocuments({ menteeId: userId, status: 'completed' });
    const hasAnyActivity = !!dsaProgress || mocksCompleted > 0;
    
    const isOnboarded = (onboarding && onboarding.has_completed) || hasAnyActivity;

    if (!isOnboarded) {
      return res.json({ 
        version: "1.0", 
        data: { status: 'not_started' } 
      });
    }

    // 2. Readiness & Stats (Simplified logic from progress.js)
    const dsaSolved = dsaProgress ? dsaProgress.solved_problems.length : 0;
    
    let targetCompanyDoc = await TargetCompany.findOne({ user_id: userId }).populate('company_ids');
    let targetCompanies = targetCompanyDoc ? targetCompanyDoc.company_ids.filter(c => c != null) : [];
    
    let interviewPrepStats = { companiesTargeted: targetCompanies.length, targetReadiness: 0, itemsReviewed: 0 };
    if (targetCompanies.length > 0) {
      const prepProgress = await InterviewPrepProgress.find({ user_id: userId });
      const userSolvedIds = new Set(dsaProgress ? dsaProgress.solved_problems.map(p => p._id?.toString() || p.toString()) : []);
      const targetCompanyNames = targetCompanies.map(c => c.name);
      const targetDSAProblems = await DSAProblem.find({ companies: { $in: targetCompanyNames } });
      
      let totalItems = 0;
      let totalReviewed = 0;
      for (const comp of targetCompanies) {
        let compTotal = (comp.techQuestions?.length || 0) + (comp.hrTips?.length || 0); // Handle tech_questions or techQuestions depending on schema
        let compReviewed = 0;
        const p = prepProgress.find(prog => prog.company_id.toString() === comp._id.toString());
        if (p) compReviewed += (p.reviewed_tech?.length || 0) + (p.reviewed_hr?.length || 0);
        
        const compDSA = targetDSAProblems.filter(prob => prob.companies.includes(comp.name));
        compTotal += compDSA.length;
        compReviewed += compDSA.filter(prob => userSolvedIds.has(prob._id.toString())).length;
        
        totalItems += compTotal;
        totalReviewed += compReviewed;
      }
      interviewPrepStats.targetReadiness = totalItems > 0 ? Math.round((totalReviewed / totalItems) * 100) : 0;
    }

    const mocksCompleted = await MentorBooking.countDocuments({ menteeId: userId, status: 'completed' });
    
    const dsaScore = Math.min(dsaSolved / PROGRESS_WEIGHTS.dsaTarget, 1) * (PROGRESS_WEIGHTS.dsaWeight * 100);
    const prepScore = (interviewPrepStats.targetReadiness / PROGRESS_WEIGHTS.prepTargetScore) * (PROGRESS_WEIGHTS.prepWeight * 100);
    const mockScore = Math.min(mocksCompleted / PROGRESS_WEIGHTS.mockTarget, 1) * (PROGRESS_WEIGHTS.mockWeight * 100);
    const overallReadiness = Math.round(dsaScore + prepScore + mockScore);

    // 3. Streak History
    const activities = await UserActivity.find({ user_id: userId }).sort({ date: 1 });
    const history = activities.map(a => a.date);

    // 4. Next Upcoming Event
    const now = new Date();
    let nextEvent = null;

    const nextMock = await MentorBooking.findOne({ menteeId: userId, status: 'confirmed', scheduledAt: { $gte: now } }).sort({ scheduledAt: 1 }).populate('mentorId');
    const nextOA = await OAAttempt.findOne({ user: userId, status: 'Planned', scheduledFor: { $gte: now } }).sort({ scheduledFor: 1 });
    const nextGD = await GDLiveSession.findOne({ 'rsvps.user': userId, 'rsvps.status': 'Attending', status: 'Scheduled', scheduledTime: { $gte: now } }).sort({ scheduledTime: 1 });

    const candidates = [];
    if (nextMock) candidates.push({ title: 'Mock Interview', time: nextMock.scheduledAt, type: 'mock' });
    if (nextOA) candidates.push({ title: 'OA Simulation', time: nextOA.scheduledFor, type: 'oa' });
    if (nextGD) candidates.push({ title: 'GD Practice Session', time: nextGD.scheduledTime, type: 'gd' });

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.time - b.time);
      nextEvent = candidates[0];
    }

    // 5. Gamification
    const profile = await PlacementProfile.findOne({ user_id: userId });
    let gamification = null;
    if (profile) {
      const recentBadge = profile.earnedBadges && profile.earnedBadges.length > 0 
        ? profile.earnedBadges.sort((a, b) => b.earnedAt - a.earnedAt)[0] 
        : null;
      gamification = {
        levelTitle: profile.levelTitle,
        recentBadge: recentBadge ? recentBadge.badgeId : null
      };
    }

    res.json({
      version: "1.0",
      data: {
        status: 'active',
        onboarded: true,
        readinessScore: overallReadiness,
        stats: {
          dsaSolved,
          companiesReviewed: targetCompanies.length,
          mocksCompleted
        },
        nextEvent,
        gamification,
        history
      }
    });
  } catch (error) {
    console.error('Placement Summary Error:', error);
    // Even if it fails, return a structured error so the frontend can degrade gracefully
    res.status(500).json({ 
      version: "1.0", 
      error: 'Temporarily unavailable',
      message: 'Failed to aggregate placement data'
    });
  }
});

module.exports = router;
