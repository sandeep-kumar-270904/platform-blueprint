const Team = require('../models/Team');
const TeamApplication = require('../models/TeamApplication');
const TeamMessage = require('../models/TeamMessage');

module.exports = function(io, socket) {
  socket.on('join_team_room', async ({ teamId, userId }) => {
    if (!userId) return;

    try {
      // 1. Verify access (must be creator or accepted member)
      const team = await Team.findById(teamId);
      if (!team) {
        socket.emit('team_chat_error', { message: 'Team not found' });
        return;
      }

      let hasAccess = false;
      if (team.creator.toString() === userId) {
        hasAccess = true;
      } else {
        const applicant = await TeamApplication.findOne({ team: teamId, applicant: userId, status: 'accepted' });
        if (applicant) hasAccess = true;
      }

      if (!hasAccess) {
        socket.emit('team_chat_error', { message: 'Unauthorized access to team chat' });
        return;
      }

      // 2. Join socket room
      const roomName = `team_${teamId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} (User: ${userId}) joined ${roomName}`);
      
      socket.emit('team_room_joined', { teamId });
    } catch (err) {
      console.error('Error joining team room:', err);
    }
  });

  socket.on('leave_team_room', ({ teamId }) => {
    const roomName = `team_${teamId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left ${roomName}`);
  });

  socket.on('send_team_message', async ({ teamId, userId, content, type = 'text', attachments = [] }) => {
    try {
      // Validate access again (extra security layer)
      const team = await Team.findById(teamId);
      if (!team) return;

      let hasAccess = false;
      if (team.creator.toString() === userId) {
        hasAccess = true;
      } else {
        const applicant = await TeamApplication.findOne({ team: teamId, applicant: userId, status: 'accepted' });
        if (applicant) hasAccess = true;
      }

      if (!hasAccess) return;

      // Create message
      const message = new TeamMessage({
        team: teamId,
        sender: userId,
        content: content || '',
        type,
        attachments,
        readBy: [{ user: userId, readAt: Date.now() }]
      });

      await message.save();
      const populatedMessage = await message.populate('sender', 'username full_name avatar_url');

      // Broadcast
      io.to(`team_${teamId}`).emit('new_team_message', populatedMessage);
    } catch (err) {
      console.error('Error sending team message:', err);
    }
  });

  socket.on('mark_team_read', async ({ messageId, userId }) => {
    try {
      const message = await TeamMessage.findById(messageId);
      if (!message) return;

      const alreadyRead = message.readBy.some(r => r.user.toString() === userId);
      if (!alreadyRead) {
        message.readBy.push({ user: userId, readAt: Date.now() });
        await message.save();
      }
    } catch (err) {
      console.error('Error marking message read:', err);
    }
  });
};
