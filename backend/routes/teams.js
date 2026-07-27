const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth').protect || require('../middleware/auth');
const { actionRateLimiter, reviewLimiter } = require('../middleware/rateLimiter');

const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  applyToTeam,
  getTeamApplicants,
  updateApplicationStatus,
  withdrawApplication,
  completeTeam,
  disbandTeam,
  removeMember,
  getMyTeams,
  getMyApplications,
  getMatchScore,
  getRecommendedTeams,
  reportTeam,
  startCall,
  joinCall,
  leaveCall,
  getTeamLeaderboard,
  getTeamAnalytics
} = require('../controllers/teamController');

const { getUserLeaderboard, getTeamSkillGap, getTrendingSkillGaps } = require('../controllers/teamController'); // exported from same file

const { createReview } = require('../controllers/teamReviewController');
const { createInvite } = require('../controllers/teamInviteController');

// Global personal endpoints
router.get('/me', protect, getMyTeams);
router.get('/applications/me', protect, getMyApplications);
router.get('/recommended', protect, getRecommendedTeams);
router.get('/me/skill-gaps/trending', protect, getTrendingSkillGaps);

// Phase 5: Leaderboards
router.get('/leaderboard', protect, getTeamLeaderboard);
// (User leaderboard is technically /api/users/leaderboard, but we'll map it here for convenience if needed, actually let's just map it on users route or here as /api/teams/users/leaderboard)
// Wait, the plan said GET /api/users/leaderboard. Let's add it to backend/routes/users.js later, but here we can add it to /users-leaderboard just in case.
router.get('/users-leaderboard', protect, getUserLeaderboard);

router.route('/')
  .get(protect, getTeams)
  .post(protect, actionRateLimiter, createTeam);

router.get('/:id/analytics', protect, getTeamAnalytics);

router.route('/:id')
  .get(protect, getTeamById)
  .put(protect, updateTeam)
  .delete(protect, deleteTeam);

router.post('/:id/apply', protect, actionRateLimiter, applyToTeam);

router.route('/:id/applicants')
  .get(protect, getTeamApplicants);

router.route('/:id/applicants/:applicationId')
  .put(protect, updateApplicationStatus)
  .delete(protect, withdrawApplication);

// Phase 2: Lifecycle
router.put('/:id/complete', protect, completeTeam);
router.put('/:id/disband', protect, disbandTeam);
router.put('/:id/members/:userId/remove', protect, removeMember);

// Phase 2: Reviews
router.post('/:id/reviews', protect, reviewLimiter, createReview);

// Phase 2: Invites
router.post('/:id/invites', protect, actionRateLimiter, createInvite);

// Phase 3: Match & Moderation
router.get('/:id/match-score', protect, getMatchScore);
router.get('/:id/skill-gap', protect, getTeamSkillGap);
router.post('/:id/report', protect, actionRateLimiter, reportTeam);

// Phase 4: Chat & Match Explanation
const { getMatchExplanation, getTeamMessages, sendTeamMessage } = require('../controllers/teamController');

router.get('/:id/match-explanation', protect, getMatchExplanation);
router.route('/:id/messages')
  .get(protect, getTeamMessages)
  .post(protect, actionRateLimiter, sendTeamMessage);

// Phase 5: Calls
router.post('/:id/calls/start', protect, startCall);
router.post('/:id/calls/:sessionId/join', protect, joinCall);
router.post('/:id/calls/:sessionId/leave', protect, leaveCall);

// Phase 5: File Uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/:id/messages/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      url: publicUrl,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
