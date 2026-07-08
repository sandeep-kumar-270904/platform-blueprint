const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const { RoadmapProgress } = require('../models/Roadmap');
const FlashcardDeck = require('../models/Flashcard');
const StudyGroup = require('../models/StudyGroup');
const GroupMessage = require('../models/GroupMessage');
const ClassroomParticipant = require('../models/ClassroomParticipant');
const EventAttendance = require('../models/EventAttendance');
const { LearningSessionParticipant } = require('../models/LearningSession');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fire all count queries concurrently
    const [
      quizzes,
      roadmapStepsDone,
      flashcardDecks,
      studyGroups,
      groupMessagesSent,
      classroomsJoined,
      eventsAttended,
      sessionsRsvp
    ] = await Promise.all([
      Quiz.find({ 'attempts.user_id': userId }, { attempts: 1 }),
      RoadmapProgress.countDocuments({ user_id: userId }),
      FlashcardDeck.countDocuments({ user_id: userId }),
      StudyGroup.countDocuments({ members: userId }),
      GroupMessage.countDocuments({ user_id: userId }),
      ClassroomParticipant.countDocuments({ user_id: userId }),
      EventAttendance.countDocuments({ user_id: userId }),
      LearningSessionParticipant.countDocuments({ user_id: userId })
    ]);
    
    // Process quiz attempts
    let allAttempts = [];
    quizzes.forEach(q => {
      q.attempts.forEach(a => {
        if (a.user_id.toString() === userId.toString()) {
          allAttempts.push({
            id: a._id,
            quiz_id: q._id,
            score: a.score,
            total: a.total,
            time_taken_seconds: a.time_taken_seconds,
            created_at: a.created_at
          });
        }
      });
    });
    
    // Sort attempts by newest first
    allAttempts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    let totalScore = 0;
    let totalPossible = 0;
    let totalSeconds = 0;
    let bestScore = 0;
    
    const pcts = allAttempts.map(a => {
      totalSeconds += (a.time_taken_seconds || 0);
      const pct = (a.total ? (a.score / a.total) * 100 : 0);
      if (pct > bestScore) bestScore = pct;
      return pct;
    });
    
    const avg = pcts.length ? pcts.reduce((s, n) => s + n, 0) / pcts.length : 0;
    
    const summary = {
      quizAttempts: allAttempts.length,
      avgQuizScore: Math.round(avg),
      bestQuizScore: Math.round(bestScore),
      totalQuizMinutes: Math.round(totalSeconds / 60),
      roadmapStepsDone,
      flashcardDecks,
      studyGroups,
      groupMessagesSent,
      classroomsJoined,
      eventsAttended,
      sessionsRsvp,
      recentQuizzes: allAttempts.slice(0, 5)
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Learning Progress Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
