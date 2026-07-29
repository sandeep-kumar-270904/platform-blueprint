const SkillCircle = require('../models/SkillCircle');
const SkillCircleMessage = require('../models/SkillCircleMessage');

module.exports = function(io, socket) {
  socket.on('join_circle_room', async ({ circleId, userId }) => {
    if (!userId) return;

    try {
      // Verify access (must be a member of the circle)
      const circle = await SkillCircle.findById(circleId);
      if (!circle) {
        socket.emit('circle_chat_error', { message: 'Circle not found' });
        return;
      }

      const isMember = circle.members.some(memberId => memberId.toString() === userId);
      if (!isMember) {
        socket.emit('circle_chat_error', { message: 'Unauthorized access to circle chat' });
        return;
      }

      // Join socket room
      const roomName = `circle_${circleId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} (User: ${userId}) joined ${roomName}`);
      
      socket.emit('circle_room_joined', { circleId });
    } catch (err) {
      console.error('Error joining circle room:', err);
    }
  });

  socket.on('leave_circle_room', ({ circleId }) => {
    const roomName = `circle_${circleId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left ${roomName}`);
  });

  socket.on('send_circle_message', async ({ circleId, userId, content }) => {
    try {
      // Validate access
      const circle = await SkillCircle.findById(circleId);
      if (!circle) return;

      const isMember = circle.members.some(memberId => memberId.toString() === userId);
      if (!isMember) return;

      // Create message
      const message = new SkillCircleMessage({
        circle: circleId,
        sender: userId,
        content: content || ''
      });

      await message.save();
      const populatedMessage = await message.populate('sender', 'username full_name avatar_url');

      // Broadcast to room
      io.to(`circle_${circleId}`).emit('new_circle_message', populatedMessage);
    } catch (err) {
      console.error('Error sending circle message:', err);
    }
  });
};
