const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Note = require('../models/Note');
const Idea = require('../models/Idea');
const StudyGroup = require('../models/StudyGroup');
const Notification = require('../models/Notification');
const VirtualClassroom = require('../models/VirtualClassroom');
const ClassroomParticipant = require('../models/ClassroomParticipant');
const PlacementOnboarding = require('../models/PlacementOnboarding');
const User = require('../models/User');
const DSAProgress = require('../models/DSAProgress');
const DSAProblem = require('../models/DSAProblem');
const InterviewPrepProgress = require('../models/InterviewPrepProgress');
const TargetCompany = require('../models/TargetCompany');
const MentorBooking = require('../models/MentorBooking');
const PlacementProfile = require('../models/PlacementProfile');
const UserActivity = require('../models/UserActivity');
const OAAttempt = require('../models/OAAttempt');
const GDLiveSession = require('../models/GDLiveSession');
const CreatorContent = require('../models/CreatorContent');
const QuizAttempt = require('../models/QuizAttempt');
const RoommateConnection = require('../models/RoommateConnection');
const RoommateProfile = require('../models/RoommateProfile');
const EventRSVP = require('../models/EventRegistration');
const { dashboardCache, notifyDashboardUpdate } = require('../services/dashboardCache');



const getTargetUserId = async (req) => {
  if (req.query.userId) {
    if (req.user && req.user.role === 'admin') {
      return req.query.userId;
    }
    // Alternatively fallback to db check if req.user.role isn't fresh
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (user && user.role === 'admin') {
      return req.query.userId;
    }
  }
  return req.user.id;
};

const PROGRESS_WEIGHTS = {
  dsaTarget: 50, dsaWeight: 0.40,
  prepTargetScore: 100, prepWeight: 0.30,
  mockTarget: 2, mockWeight: 0.30
};

// GET /api/dashboard/summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const userId = await getTargetUserId(req);
    const cacheKey = `dashboard_summary_${userId}`;
    const cachedData = dashboardCache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Parallel fetch with graceful degradation
    const results = await Promise.allSettled([
      Note.find({ user_id: userId }), // 0: Notes
      Idea.countDocuments({ user_id: userId }), // 1: Ideas
      StudyGroup.countDocuments({ memberships: { $elemMatch: { user: userId, status: 'active' } } }), // 2: Teams
      Notification.countDocuments({ userId: userId, isRead: false }), // 3: Notifications
      QuizAttempt.find({ user: userId, status: 'completed' }), // 4: Quizzes
      ClassroomParticipant.countDocuments({ user_id: userId, status: { $in: ['attending', 'registered', 'waitlisted'] } }), // 5: Classrooms
      EventRSVP.countDocuments({ userId: userId }), // 6: Events
      UserActivity.find({ user_id: userId }).sort({ date: 1 }).lean() // 7: Streak/Activity
    ]);

    // Extract results safely
    const notesData = results[0].status === 'fulfilled' ? results[0].value : null;
    const ideasCount = results[1].status === 'fulfilled' ? results[1].value : null;
    const teamsCount = results[2].status === 'fulfilled' ? results[2].value : null;
    const notificationsCount = results[3].status === 'fulfilled' ? results[3].value : null;
    const quizAttempts = results[4].status === 'fulfilled' ? results[4].value : null;
    const classroomsCount = results[5].status === 'fulfilled' ? results[5].value : null;
    const eventsCount = results[6].status === 'fulfilled' ? results[6].value : null;
    const activities = results[7].status === 'fulfilled' ? results[7].value : null;

    // Derived Stats
    let notesViews = 0;
    let notesDownloads = 0;
    let notesCount = null;
    if (notesData) {
      notesCount = notesData.length;
      notesViews = notesData.reduce((sum, n) => sum + (n.views || 0), 0);
      notesDownloads = notesData.reduce((sum, n) => sum + (n.downloads || 0), 0);
    }

    let avgQuizScore = null;
    let totalQuizzes = null;
    if (quizAttempts) {
      totalQuizzes = quizAttempts.length;
      avgQuizScore = totalQuizzes > 0 
        ? Math.round(quizAttempts.reduce((acc, q) => acc + (q.percentageScore || 0), 0) / totalQuizzes) 
        : 0;
    }

    // Compute Streak
    let currentStreak = 0;
    if (activities && activities.length > 0) {
      // Simplistic streak logic (ignoring timezone complexity for dashboard summary)
      const uniqueDays = Array.from(new Set(activities.map(a => new Date(a.date).toDateString()))).map(d => new Date(d));
      uniqueDays.sort((a, b) => a - b);
      if (uniqueDays.length > 0) {
        let tempStreak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const diffDays = Math.round((uniqueDays[i] - uniqueDays[i - 1]) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) tempStreak++;
          else tempStreak = 1;
        }
        const lastDay = uniqueDays[uniqueDays.length - 1];
        const today = new Date(new Date().toDateString());
        const diffToday = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));
        if (diffToday <= 1) currentStreak = tempStreak;
      }
    }

    // Compute Dynamic Achievements
    const earnedAchievements = [];
    if (ideasCount !== null && ideasCount >= 3) earnedAchievements.push({ id: 'innovator', title: 'Innovator', progress: `${ideasCount}/3 ideas` });
    else if (ideasCount !== null) earnedAchievements.push({ id: 'innovator', title: 'Innovator', progress: `${ideasCount}/3 ideas`, locked: true });

    if (teamsCount !== null && teamsCount >= 2) earnedAchievements.push({ id: 'team_player', title: 'Team Player', progress: `${teamsCount}/2 teams` });
    else if (teamsCount !== null) earnedAchievements.push({ id: 'team_player', title: 'Team Player', progress: `${teamsCount}/2 teams`, locked: true });

    if (notesCount !== null && notesCount >= 5) earnedAchievements.push({ id: 'knowledge_sharer', title: 'Knowledge Sharer', progress: `${notesCount}/5 notes` });
    else if (notesCount !== null) earnedAchievements.push({ id: 'knowledge_sharer', title: 'Knowledge Sharer', progress: `${notesCount}/5 notes`, locked: true });

    const payload = {
      stats: {
        notesCount,
        notesViews,
        notesDownloads,
        ideasCount,
        teamsCount,
        notificationsCount,
        totalQuizzes,
        avgQuizScore,
        classroomsCount,
        eventsCount,
        currentStreak
      },
      achievements: earnedAchievements
    };

    dashboardCache.set(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    console.error('Dashboard Summary Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/stats (Legacy fallback)
router.get('/stats', authMiddleware, (req, res) => {
  res.redirect(301, '/api/dashboard/summary');
});

// GET /api/dashboard/creators-summary
router.get('/creators-summary', authMiddleware, async (req, res) => {
  try {
    const userId = await getTargetUserId(req);
    const user = await User.findById(userId).select('creatorFollowers');
    const allWork = await CreatorContent.find({ userId, status: { $ne: 'removed' } }).select('status views likes');
    
    const totalPiecesPublished = allWork.filter(c => c.status === 'published').length;
    const totalViews = allWork.reduce((sum, c) => sum + (c.views || 0), 0);
    const totalLikes = allWork.reduce((sum, c) => sum + (c.likes || 0), 0);
    const followerCount = user?.creatorFollowers?.length || 0;

    const recentActivity = await Notification.find({
      userId,
      type: { $in: ['creator_publish', 'creator_comment', 'creator_like', 'creator_reply'] }
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      totalPiecesPublished,
      totalViews,
      totalLikes,
      followerCount,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching creators summary', error: err.message });
  }
});

// GET /api/dashboard/roommate-summary
router.get('/roommate-summary', authMiddleware, async (req, res) => {
  try {
    const userId = await getTargetUserId(req);
    
    const profile = await RoommateProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.json({ status: 'no_profile' });
    }
    
    // Calculate completeness score (matches frontend logic)
    let completenessScore = 0;
    const baseFields = [
      profile.bio,
      profile.budgetRange?.min,
      profile.moveInDate,
      profile.lifestyle_preferences?.cleanliness,
      profile.lifestyle_preferences?.sleepSchedule
    ];
    completenessScore += Math.round((baseFields.filter(Boolean).length / 5) * 50);

    if (profile.profilePhoto) completenessScore += 15;
    if (profile.galleryPhotos && profile.galleryPhotos.length > 0) completenessScore += 15;

    const prefFields = [
      profile.lifestyle_preferences?.smoking,
      profile.lifestyle_preferences?.pets
    ];
    completenessScore += Math.round((prefFields.filter(Boolean).length / 2) * 10);

    const advFields = [
      profile.lifestyle_preferences?.guestPolicy,
      profile.lifestyle_preferences?.cookingHabits,
      profile.lifestyle_preferences?.sharedSpaceExpectations
    ];
    completenessScore += Math.round((advFields.filter(Boolean).length / 3) * 10);

    // Count pending requests received by the user
    const pendingRequests = await RoommateConnection.countDocuments({
      recipient: userId,
      status: 'Pending'
    });
    
    // Count active connections
    const activeConnections = await RoommateConnection.countDocuments({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'Accepted'
    });
    
    res.json({
      status: profile.status === 'paused' ? 'paused' : (profile.visibility === 'hidden' ? 'hidden' : 'active'),
      completenessScore,
      pendingRequests,
      activeConnections
    });
  } catch (err) {
    console.error('Error fetching roommate summary:', err);
    res.status(500).json({ message: 'Error fetching roommate summary', error: err.message });
  }
});

// GET /api/dashboard/host
router.get('/host', authMiddleware, async (req, res) => {
  try {
    const userId = await getTargetUserId(req);
    
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
    const userId = await getTargetUserId(req);
    
    // Notes Analytics
    const notes = await Note.find({ user_id: userId })
      .select('title views downloads rating study_time_minutes last_viewed_at')
      .sort({ views: -1 });

    // Quizzes Analytics
    const quizAttempts = await QuizAttempt.find({ user: userId, status: 'completed' });
    const totalQuizzes = quizAttempts.length;
    const averageQuizScore = totalQuizzes > 0 
      ? Math.round(quizAttempts.reduce((acc, q) => acc + (q.percentageScore || 0), 0) / totalQuizzes) 
      : 0;

    // Collaboration Analytics (Study Groups)
    const activeStudyGroups = await StudyGroup.countDocuments({
      memberships: { $elemMatch: { user: userId, status: 'active' } }
    });

    // Connections Analytics (Roommates)
    const roommateConnections = await RoommateConnection.countDocuments({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'Accepted'
    });

    // Engagement Analytics (Virtual Classrooms)
    const sessionsHosted = await VirtualClassroom.countDocuments({ host_id: userId });
    const sessionsAttended = await ClassroomParticipant.countDocuments({
      user_id: userId,
      status: { $in: ['attending', 'registered', 'waitlisted'] }
    });

    res.json({
      notes,
      learning: {
        totalQuizzes,
        averageQuizScore
      },
      collaboration: {
        activeStudyGroups,
        roommateConnections
      },
      engagement: {
        sessionsHosted,
        sessionsAttended
      }
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const JoinRequest = require('../models/JoinRequest');

// GET /api/dashboard/join-requests
router.get('/join-requests', authMiddleware, async (req, res) => {
  try {
    const userId = await getTargetUserId(req);
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
    const userId = await getTargetUserId(req);
    const ideas = await Idea.find({ user_id: userId }).sort({ created_at: -1 });
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/upcoming-sessions
router.get('/upcoming-sessions', authMiddleware, async (req, res) => {
  try {
    const participations = await ClassroomParticipant.find({ user_id: await getTargetUserId(req), status: { $in: ['registered', 'attending', 'waitlisted'] } }).select('classroom_id');
    const classIds = participations.map(p => p.classroom_id);
    const sessions = await VirtualClassroom.find({ 
      $or: [{ host_id: await getTargetUserId(req) }, { _id: { $in: classIds } }],
      status: 'scheduled'
    }).sort({ scheduled_at: 1 }).limit(5);
    const sessionsFormatted = sessions.map(s => ({
      id: s._id,
      title: s.title,
      scheduled_at: s.scheduled_at,
      host_id: s.host_id,
      subject: s.subject
    }));
    res.json({ sessions: sessionsFormatted, recommendations: [] });
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
    const notifications = await Notification.find({ userId: await getTargetUserId(req) }).sort({ createdAt: -1 }).limit(10);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(await getTargetUserId(req)).select(
      'username full_name avatar_url bio videoIntroUrl institutionVerified badges quizStreak totalQuizPoints'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Calculate sessions hosted / attended
    const sessions_hosted = await VirtualClassroom.countDocuments({ host_id: await getTargetUserId(req) });
    const sessions_attended = await ClassroomParticipant.countDocuments({ user_id: await getTargetUserId(req), status: { $in: ['attending', 'registered', 'waitlisted'] } });

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
    const userId = await getTargetUserId(req);
    
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
