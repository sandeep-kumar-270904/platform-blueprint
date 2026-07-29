const GDLiveSession = require('../models/GDLiveSession');
const Quiz = require('../models/Quiz');

module.exports = (io, socket) => {
  socket.on('join_gd_session', async ({ sessionId, userId }) => {
    try {
      const session = await GDLiveSession.findById(sessionId).populate('quizId');
      if (!session) return socket.emit('gdError', { message: 'Session not found' });
      
      socket.join(`gdSession_${sessionId}`);
      
      if (session.mode === 'collaborative_quiz' && session.quizId) {
        // Find if we already have state in memory for this session, if not init
        // For simplicity, we just emit the quiz structure to everyone
        const quizObj = session.quizId.toObject();
        quizObj.questions.forEach(q => { delete q.correctOptionIndex; delete q.explanation; });
        socket.emit('gdQuizState', { quiz: quizObj });
      }
      
      console.log(`User ${userId} joined gdSession_${sessionId}`);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('gd_vote_option', ({ sessionId, userId, questionIndex, optionIndex }) => {
    // Broadcast the vote to the room
    io.to(`gdSession_${sessionId}`).emit('gd_user_voted', { userId, questionIndex, optionIndex });
  });

  socket.on('gd_host_advance', ({ sessionId, nextIndex }) => {
    io.to(`gdSession_${sessionId}`).emit('gd_question_advanced', { nextIndex });
  });

  socket.on('gd_chat_message', ({ sessionId, user, text }) => {
    io.to(`gdSession_${sessionId}`).emit('gd_chat_received', { user, text, timestamp: new Date() });
  });
};
