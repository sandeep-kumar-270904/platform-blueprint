const jwt = require('jsonwebtoken');
const LiveSession = require('../models/LiveSession');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const gamificationService = require('../services/gamificationService');

const serializeQuizForTaking = (quiz) => {
  const qObj = quiz.toObject();
  qObj.questions = qObj.questions.map(q => {
    delete q.correctOptionIndex;
    delete q.explanation;
    return q;
  });
  return qObj;
};
// Map<sessionId, Map<userId, Set<socketId>>>
const activeSockets = new Map();

module.exports = (io, socket) => {
  socket.on('joinSession', async ({ joinCode, token }) => {
    try {
      if (!token) {
        socket.emit('sessionError', { message: 'Authentication required' });
        return;
      }
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        socket.emit('sessionError', { message: 'Invalid or expired token' });
        return;
      }
      const userId = decoded.id;

      const session = await LiveSession.findOne({ 
        joinCode: joinCode.toUpperCase(),
        status: { $in: ['scheduled', 'waiting_room', 'in_progress'] }
      }).populate('participants.user', 'username full_name avatar');

      const user = await require('../models/User').findById(userId);
      if (user && user.banned) {
        socket.emit('sessionError', { message: 'Your account is banned' });
        return;
      }

      if (session && session.kickedParticipants?.includes(userId)) {
        socket.emit('sessionError', { message: 'You have been removed from this session' });
        return;
      }

      if (!session) {
        socket.emit('sessionError', { message: 'Session not found or inactive' });
        return;
      }

      socket.join(`liveSession:${session._id}`);
      socket._userId = userId;
      socket._sessionId = session._id.toString();

      // Track socket in memory
      if (!activeSockets.has(socket._sessionId)) activeSockets.set(socket._sessionId, new Map());
      const sessionMap = activeSockets.get(socket._sessionId);
      if (!sessionMap.has(socket._userId)) sessionMap.set(socket._userId, new Set());
      sessionMap.get(socket._userId).add(socket.id);

      const isHost = session.hostedBy.toString() === userId;
      if (isHost) {
        socket._isHost = true;
        session.hostStatus = 'connected';
        await session.save();
        io.to(`liveSession:${session._id}`).emit('hostReconnected');
      } else {
        // Participant join logic
        const expectedStatus = session.status === 'in_progress' ? 'active' : 'waiting';
        const participantIndex = session.participants.findIndex(p => p.user && (p.user._id || p.user).toString() === userId);
        if (participantIndex === -1) {
          socket.emit('sessionError', { message: 'You must join the session via HTTP first' });
          return;
        } else {
          session.participants[participantIndex].status = expectedStatus;
          await session.save();
        }
      }

      // Re-fetch fully populated
      const updatedSession = await LiveSession.findById(session._id).populate('participants.user', 'username full_name avatar');

      // Broadcast update
      io.to(`liveSession:${session._id}`).emit('participantUpdate', {
        participants: updatedSession.participants.map(p => ({
          _id: p.user ? p.user._id : null,
          name: p.user ? (p.user.full_name || p.user.username || 'Unknown') : 'Unknown',
          avatar: p.user ? p.user.avatar : null,
          score: p.score,
          status: p.status
        }))
      });
      
      // Send current state to the joining user
      socket.emit('sessionState', {
        status: session.status,
        pacingMode: session.pacingMode,
        currentQuestionIndex: session.currentQuestionIndex,
        questionStartedAt: session.questionStartedAt
      });
      
      // If self-paced and they haven't finished, send them their current question
      if (session.pacingMode === 'self') {
        const participant = session.participants.find(p => p.user && p.user._id.toString() === userId);
        if (participant && participant.status !== 'finished') {
          const quiz = await Quiz.findById(session.quiz);
          const pIndex = participant.currentQuestionIndex || 0;
          if (quiz && quiz.questions[pIndex]) {
            const safeQuiz = serializeQuizForTaking(quiz);
            socket.emit('questionBroadcast', {
              questionIndex: pIndex,
              question: safeQuiz.questions[pIndex],
              timeLimit: safeQuiz.perQuestionTimeLimitSeconds || 20,
              questionStartedAt: new Date() // in self paced, maybe they resume from now?
            });
          }
        }
      } else if (session.status === 'in_progress' && session.currentQuestionIndex >= 0) {
        // If in progress, send the current question
        const quiz = await Quiz.findById(session.quiz);
        if (quiz && quiz.questions[session.currentQuestionIndex]) {
          const safeQuiz = serializeQuizForTaking(quiz);
          socket.emit('questionBroadcast', {
            questionIndex: session.currentQuestionIndex,
            question: safeQuiz.questions[session.currentQuestionIndex],
            timeLimit: safeQuiz.perQuestionTimeLimitSeconds || 20,
            questionStartedAt: session.questionStartedAt
          });
        }
      }
    } catch (err) {
      console.error('joinSession error:', err);
    }
  });

  socket.on('startSession', async ({ sessionId }) => {
    try {
      const hostId = socket._userId;

      const session = await LiveSession.findById(sessionId);
      if (!session) return;
      if (session.hostedBy.toString() !== hostId) return; // not host

      const quiz = await Quiz.findById(session.quiz);
      
      session.status = 'in_progress';
      session.startedAt = new Date();
      session.currentQuestionIndex = 0;
      session.questionStartedAt = new Date();
      await session.save();

      // Broadcast the state change
      io.to(`liveSession:${sessionId}`).emit('sessionState', {
        status: 'in_progress',
        currentQuestionIndex: 0
      });

      // Broadcast first question
      const safeQuiz = serializeQuizForTaking(quiz);
      io.to(`liveSession:${sessionId}`).emit('questionBroadcast', {
        questionIndex: 0,
        question: safeQuiz.questions[0],
        timeLimit: safeQuiz.perQuestionTimeLimitSeconds || 20,
        questionStartedAt: session.questionStartedAt
      });

    } catch (err) {
      console.error('startSession error:', err);
    }
  });

  socket.on('advanceQuestion', async ({ sessionId }) => {
    try {
      const hostId = socket._userId;

      const session = await LiveSession.findById(sessionId).populate('participants.user', 'username full_name');
      if (!session || session.hostedBy.toString() !== hostId) return;

      const quiz = await Quiz.findById(session.quiz);
      
      const nextIndex = session.currentQuestionIndex + 1;
      
      if (nextIndex >= quiz.questions.length) {
        // Session complete
        session.status = 'completed';
        session.completedAt = new Date();
        
        // Mark active participants as finished
        session.participants.forEach(p => {
          if (p.status !== 'disconnected') p.status = 'finished';
        });
        
        await session.save();
        
        // Generate QuizAttempts for each participant
        const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        
        const notificationService = require('../services/notificationService');
        for (const p of session.participants) {
          if (p.answers.length > 0) {
            let percentage = (p.score / totalPoints) * 100;
            // Cap at 100 in case speed bonus pushed it over
            if (percentage > 100) percentage = 100;
            
            const newAttempt = await QuizAttempt.create({
              quiz: quiz._id,
              sourceLiveSession: session._id,
              user: p.user._id,
              answers: p.answers,
              score: p.score,
              totalPossibleScore: totalPoints,
              percentageScore: percentage,
              startedAt: session.startedAt,
              completedAt: session.completedAt,
              status: 'completed'
            });

            // Trigger results notification
            await notificationService.createNotification({
              userId: p.user._id,
              type: 'live_session_results',
              relatedQuiz: quiz._id,
              relatedLiveSession: session._id,
              message: `The live quiz "${quiz.title}" has concluded. Your final score is ${Math.round(percentage)}%.`,
              actionUrl: `/attempts/${newAttempt._id}/results`,
              channel: 'both',
              emailData: {
                quizTitle: quiz.title,
                score: `${Math.round(percentage)}%`
              }
            });

            // Trigger gamification (Streaks, Points, Badges)
            await gamificationService.processQuizCompletion(p.user._id, newAttempt._id, io);
            io.to(`user:${p.user._id}`).emit('quiz_dashboard_updated', { reason: 'live_session_completed' });
          }
        }
        
        // Update quiz stats
        let totalPercentage = 0;
        let activeParticipantsCount = 0;
        
        session.participants.forEach(p => {
          if (p.answers.length > 0) {
            activeParticipantsCount++;
            let percentage = (p.score / totalPoints) * 100;
            if (percentage > 100) percentage = 100;
            totalPercentage += percentage;
          }
        });

        if (activeParticipantsCount > 0) {
          const oldCount = quiz.attemptCount || 0;
          const oldAvg = quiz.averageScore || 0;
          
          quiz.averageScore = ((oldAvg * oldCount) + totalPercentage) / (oldCount + activeParticipantsCount);
          quiz.attemptCount = oldCount + activeParticipantsCount;
          await quiz.save();
        }

        io.to(`liveSession:${sessionId}`).emit('sessionEnded', {
          leaderboard: session.participants.map(p => ({
            name: p.user ? (p.user.full_name || p.user.username || 'Unknown') : 'Unknown',
            score: p.score
          })).sort((a, b) => b.score - a.score)
        });

      } else {
        // Advance
        session.currentQuestionIndex = nextIndex;
        session.questionStartedAt = new Date();
        await session.save();

        // Broadcast the next question
        const safeQuiz = serializeQuizForTaking(quiz);
        io.to(`liveSession:${sessionId}`).emit('questionBroadcast', {
          questionIndex: nextIndex,
          question: safeQuiz.questions[nextIndex],
          timeLimit: safeQuiz.perQuestionTimeLimitSeconds || 20,
          questionStartedAt: session.questionStartedAt
        });
        
        // Tell clients we advanced
        io.to(`liveSession:${sessionId}`).emit('sessionState', {
          currentQuestionIndex: nextIndex
        });
      }

    } catch (err) {
      console.error('advanceQuestion error:', err);
    }
  });

  socket.on('advanceSelfPaced', async ({ sessionId }) => {
    try {
      const userId = socket._userId;

      const session = await LiveSession.findById(sessionId).populate('participants.user', 'username full_name avatar');
      if (!session || session.pacingMode !== 'self') return;
      
      const participantIndex = session.participants.findIndex(p => p.user && p.user._id.toString() === userId);
      if (participantIndex === -1) return;
      const participant = session.participants[participantIndex];
      
      const quiz = await Quiz.findById(session.quiz);
      
      const nextIndex = (participant.currentQuestionIndex || 0) + 1;
      
      if (nextIndex >= quiz.questions.length) {
        participant.status = 'finished';
        await session.save();
        
        // Generate QuizAttempts for this single participant
        const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        const notificationService = require('../services/notificationService');
        
        if (participant.answers.length > 0) {
          let percentage = (participant.score / totalPoints) * 100;
          if (percentage > 100) percentage = 100;
          
          const newAttempt = await QuizAttempt.create({
            quiz: quiz._id,
            sourceLiveSession: session._id,
            user: participant.user._id,
            answers: participant.answers,
            score: participant.score,
            totalPossibleScore: totalPoints,
            percentageScore: percentage,
            startedAt: participant.joinedAt,
            completedAt: new Date(),
            status: 'completed'
          });

          await notificationService.createNotification({
            userId: participant.user._id,
            type: 'live_session_results',
            relatedQuiz: quiz._id,
            relatedLiveSession: session._id,
            message: `You completed the self-paced quiz "${quiz.title}". Your final score is ${Math.round(percentage)}%.`,
            actionUrl: `/attempts/${newAttempt._id}/results`,
            channel: 'both',
            emailData: {
              quizTitle: quiz.title,
              score: `${Math.round(percentage)}%`
            }
          });

          await gamificationService.processQuizCompletion(participant.user._id, newAttempt._id, io);
          io.to(`user:${participant.user._id}`).emit('quiz_dashboard_updated', { reason: 'live_session_completed' });

          // Update quiz stats
          const oldAvg = quiz.averageScore || 0;
          const oldCount = quiz.attemptCount || 0;
          quiz.averageScore = ((oldAvg * oldCount) + percentage) / (oldCount + 1);
          quiz.attemptCount = oldCount + 1;
          await quiz.save();
        }

        socket.emit('sessionState', { status: 'completed' });
        
      } else {
        participant.currentQuestionIndex = nextIndex;
        await session.save();
        
        const safeQuiz = serializeQuizForTaking(quiz);
        socket.emit('questionBroadcast', {
          questionIndex: nextIndex,
          question: safeQuiz.questions[nextIndex],
          timeLimit: safeQuiz.perQuestionTimeLimitSeconds || 20,
          questionStartedAt: new Date()
        });
      }
    } catch (err) {
      console.error('advanceSelfPaced error:', err);
    }
  });

  socket.on('submitAnswer', async ({ sessionId, questionIndex, selectedOptionIndex }) => {
    try {
      const userId = socket._userId;

      const session = await LiveSession.findById(sessionId).populate('participants.user', 'username full_name avatar');
      if (!session) return;
      
      const participantIndex = session.participants.findIndex(p => p.user && p.user._id.toString() === userId);
      if (participantIndex === -1) return;
      const participant = session.participants[participantIndex];

      if (session.pacingMode === 'self') {
        if (participant.currentQuestionIndex !== questionIndex) return; // late or invalid
      } else {
        if (session.status !== 'in_progress') return;
        if (session.currentQuestionIndex !== questionIndex) return; // late or invalid
      }

      const quiz = await Quiz.findById(session.quiz);
      const question = quiz.questions[questionIndex];
      
      // Prevent double answering
      if (participant.answers.some(a => a.questionIndex === questionIndex)) return;

      const now = new Date();
      let qStart = session.questionStartedAt;
      if (session.pacingMode === 'self') {
        // approximate time taken for self paced if we didn't track per-user questionStartedAt in schema strictly
        qStart = new Date(now.getTime() - 5000); 
      }
      
      const timeTakenSeconds = (now.getTime() - new Date(qStart).getTime()) / 1000;
      const isCorrect = selectedOptionIndex === question.correctOptionIndex;
      const basePoints = question.points || 1;
      const timeLimit = quiz.perQuestionTimeLimitSeconds || 20;

      let awardedPoints = 0;
      if (isCorrect) {
        // points * max(0.5, 1 - (timeTakenSeconds / questionTimeLimitSeconds) * 0.5)
        let multiplier = 1 - (timeTakenSeconds / timeLimit) * 0.5;
        if (multiplier < 0.5) multiplier = 0.5;
        if (multiplier > 1) multiplier = 1; // if timeTaken is somehow negative
        awardedPoints = Math.round(basePoints * multiplier);
      }

      participant.answers.push({
        questionIndex,
        selectedOptionIndex,
        isCorrect,
        answeredAt: now,
        timeTakenSeconds
      });
      
      participant.score += awardedPoints;
      
      // Update session without full doc save to avoid concurrency overwrites from multiple users
      await LiveSession.updateOne(
        { _id: sessionId, 'participants._id': participant._id },
        { 
          $push: { 'participants.$.answers': participant.answers[participant.answers.length - 1] },
          $inc: { 'participants.$.score': awardedPoints }
        }
      );
      
      // Re-fetch to get updated scores for leaderboard
      const updatedSession = await LiveSession.findById(sessionId).populate('participants.user', 'username full_name avatar');
      
      const leaderboard = updatedSession.participants.map(p => ({
        _id: p.user ? p.user._id : null,
        name: p.user ? (p.user.full_name || p.user.username || 'Unknown') : 'Unknown',
        avatar: p.user ? p.user.avatar : null,
        score: p.score
      })).sort((a, b) => b.score - a.score).slice(0, 10); // top 10

      io.to(`liveSession:${sessionId}`).emit('leaderboardUpdate', { leaderboard });

      // Reply back to user whether they were correct
      socket.emit('answerResult', { isCorrect, awardedPoints });

    } catch (err) {
      console.error('submitAnswer error:', err);
    }
  });

  socket.on('kickParticipant', async ({ sessionId, targetUserId }) => {
    try {
      const hostId = socket._userId;

      if (!socket._isHost) return;
      const session = await LiveSession.findById(sessionId);
      if (!session || session.hostedBy.toString() !== hostId) return;

      if (!session.kickedParticipants) session.kickedParticipants = [];
      if (!session.kickedParticipants.includes(targetUserId)) {
        session.kickedParticipants.push(targetUserId);
      }
      
      const p = session.participants.find(p => p.user && p.user.toString() === targetUserId);
      if (p) p.status = 'disconnected'; // or 'kicked' if we had it, but disconnected is fine
      await session.save();

      io.to(`liveSession:${sessionId}`).emit('participantLeft', { userId: targetUserId });
      
      // Notify specifically the kicked user sockets
      if (activeSockets.has(sessionId)) {
        const sessionMap = activeSockets.get(sessionId);
        if (sessionMap.has(targetUserId)) {
          for (const sId of sessionMap.get(targetUserId)) {
            io.to(sId).emit('kicked', { sessionId });
            const s = io.sockets.sockets.get(sId);
            if (s) s.leave(`liveSession:${sessionId}`);
          }
        }
      }
    } catch (e) {
      console.error('kickParticipant error:', e);
    }
  });

  socket.on('disconnecting', async () => {
    if (socket._userId && socket._sessionId) {
      try {
        const sId = socket._sessionId;
        const uId = socket._userId;
        
        if (activeSockets.has(sId)) {
          const sessionMap = activeSockets.get(sId);
          if (sessionMap.has(uId)) {
            sessionMap.get(uId).delete(socket.id);
            
            // If no more sockets for this user in this session, they are fully disconnected
            if (sessionMap.get(uId).size === 0) {
              sessionMap.delete(uId);
              if (sessionMap.size === 0) activeSockets.delete(sId);
              
              const session = await LiveSession.findById(sId);
              if (session && session.status !== 'completed' && session.status !== 'cancelled') {
                if (socket._isHost) {
                  session.hostStatus = 'disconnected';
                  await session.save();
                  io.to(`liveSession:${sId}`).emit('hostDisconnected');
                } else {
                  const p = session.participants.find(p => p.user && p.user.toString() === uId);
                  if (p) {
                    p.status = 'disconnected';
                    await session.save();
                    io.to(`liveSession:${session._id}`).emit('participantLeft', { userId: uId });
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Socket cleanup error:', e);
      }
    }
  });
};
