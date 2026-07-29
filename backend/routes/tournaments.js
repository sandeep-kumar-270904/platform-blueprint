const express = require('express');
const router = express.Router();
const QuizTournament = require('../models/QuizTournament');
const QuizAttempt = require('../models/QuizAttempt');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');
const notificationService = require('../services/notificationService');
const rateLimit = require('express-rate-limit');

const tournamentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many tournaments created, please try again later' }
});

// Create tournament
router.post('/', adminAuth, tournamentLimiter, async (req, res) => {
  try {
    const tournament = new QuizTournament(req.body);
    await tournament.save();
    res.status(201).json(tournament);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await QuizTournament.find()
      .populate('quizIds', 'title category')
      .populate('participantIds', 'full_name avatar_url');
    res.json(tournaments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get specific tournament
router.get('/:id', async (req, res) => {
  try {
    const tournament = await QuizTournament.findById(req.params.id)
      .populate('quizIds', 'title category')
      .populate('participantIds', 'full_name avatar_url');
    if (!tournament) return res.status(404).json({ error: 'Not found' });
    res.json(tournament);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Join tournament
router.post('/:id/join', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.id);
    if (user?.banned) return res.status(403).json({ error: 'Cannot join a tournament while banned' });
    const tournament = await QuizTournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Not found' });
    if (tournament.status !== 'upcoming') return res.status(400).json({ error: 'Cannot join active/completed tournament' });

    if (!tournament.participantIds.includes(req.user.id)) {
      tournament.participantIds.push(req.user.id);
      await tournament.save();
    }
    res.json(tournament);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Force start tournament and generate bracket
router.post('/:id/start', adminAuth, async (req, res) => {
  try {
    const tournament = await QuizTournament.findById(req.params.id).populate('quizIds');
    if (!tournament) return res.status(404).json({ error: 'Not found' });
    
    // Check if any quiz is under review
    if (tournament.quizIds.some(q => q.status === 'under_review')) {
      return res.status(400).json({ error: 'Cannot start tournament with a quiz that is under review' });
    }
    
    tournament.status = 'active';
    
    // Simple single elimination bracket generation logic
    if (tournament.format === 'single_elimination') {
      const participants = [...tournament.participantIds];
      const matches = [];
      for (let i = 0; i < participants.length; i += 2) {
        if (i + 1 < participants.length) {
          matches.push({
            id: `R1-M${i/2}`,
            p1: participants[i],
            p2: participants[i+1],
            winner: null,
            quizId: tournament.quizIds[0] // Simple: round 1 uses quiz 1
          });
        } else {
          // Bye
          matches.push({
            id: `R1-M${i/2}`,
            p1: participants[i],
            p2: null,
            winner: participants[i],
            quizId: null
          });
        }
      }
      tournament.bracket = { rounds: [{ id: 1, matches }] };
    } else if (tournament.format === 'leaderboard_points') {
      tournament.bracket = { standings: tournament.participantIds.map(p => ({ user: p, points: 0 })) };
    }

    // Tell mongoose mixed type changed
    tournament.markModified('bracket');
    await tournament.save();
    res.json(tournament);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Sync tournament bracket with attempts (simple auto-advance logic)
router.post('/:id/sync', adminAuth, async (req, res) => {
  try {
    const tournament = await QuizTournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Not found' });

    if (tournament.format === 'single_elimination' && tournament.bracket?.rounds) {
      // Loop over rounds and matches, check QuizAttempts for the participants and the designated quiz
      for (let r = 0; r < tournament.bracket.rounds.length; r++) {
        let round = tournament.bracket.rounds[r];
        for (let m = 0; m < round.matches.length; m++) {
          let match = round.matches[m];
          if (!match.winner && match.p1 && match.p2 && match.quizId) {
            // Find attempts
            const a1 = await QuizAttempt.findOne({ quiz: match.quizId, user: match.p1, status: 'completed' }).sort('-score');
            const a2 = await QuizAttempt.findOne({ quiz: match.quizId, user: match.p2, status: 'completed' }).sort('-score');
            
            if (a1 && a2) {
              if (a1.score > a2.score) match.winner = match.p1;
              else if (a2.score > a1.score) match.winner = match.p2;
              else match.winner = match.p1; // Arbitrary tie break for simple implementation
              
              // Notify participants
              for (const pid of [match.p1, match.p2]) {
                const result = match.winner.toString() === pid.toString() ? 'Won' : 'Lost';
                await notificationService.createNotification({
                  userId: pid,
                  type: 'tournament_round_result',
                  title: `Tournament Round Result: ${result}`,
                  message: `You ${result} your match in round ${round.id}.`,
                  channel: 'both',
                  emailData: { tournamentName: tournament.name || 'Tournament', result },
                  actionUrl: `/tournaments/${tournament._id}`
                }, req.io);
              }
            }
          }
        }
      }
      tournament.markModified('bracket');
      await tournament.save();
    }
    
    res.json(tournament);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;


// Register for tournament
router.post('/:id/register', auth, async (req, res) => {
  try {
    const tournament = await QuizTournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Not found' });
    if (tournament.status === 'completed') return res.status(400).json({ error: 'Tournament completed' });
    
    if (!tournament.participantIds.includes(req.user.id)) {
      tournament.participantIds.push(req.user.id);
      await tournament.save();
    }
    res.json(tournament);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get standings
router.get('/:id/standings', async (req, res) => {
  try {
    const tournament = await QuizTournament.findById(req.params.id).populate('participantIds', 'username full_name avatar_url');
    if (!tournament) return res.status(404).json({ error: 'Not found' });

    // For a points-based leaderboard, aggregate all attempts by participants for the given quizzes
    const standings = [];
    for (const participant of tournament.participantIds) {
      const attempts = await QuizAttempt.find({
        user: participant._id,
        quiz: { $in: tournament.quizIds },
        status: 'completed'
      });
      
      const totalScore = attempts.reduce((acc, att) => acc + att.score, 0);
      const totalTime = attempts.reduce((acc, att) => acc + att.answers.reduce((t, a) => t + (a.timeTakenSeconds || 0), 0), 0);
      
      standings.push({
        user: participant,
        score: totalScore,
        timeTaken: totalTime,
        quizzesCompleted: attempts.length
      });
    }
    
    // Sort descending by score, ascending by time
    standings.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTaken - b.timeTaken;
    });

    res.json(standings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;