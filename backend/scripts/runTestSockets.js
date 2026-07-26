const { io } = require('socket.io-client');
require('dotenv').config();

async function testSockets() {
  console.log('Testing Live Sessions (Socket.io)...');
  
  // Need to get the join code for a live session.
  const res = await fetch('http://localhost:5000/api/quizzes');
  const data = await res.json();
  // Fetch quizzes with live sessions. Our seed data created a live session for Quiz 2.
  // Actually, we can fetch live sessions directly if there's an API, or we can just fetch the quiz and grab the active session.
  // Wait, our seed data hardcoded the joinCode to 'SYS123'. Let's use that!
  
  // We need a userId to pass to the socket (or auth token). The socket uses `socket.on('joinSession', async ({ joinCode, userId }) ...)`
  const userId = data.quizzes[0].createdBy; // Using admin user

  const socket = io('http://localhost:5000');

  socket.on('connect', () => {
    console.log(`Connected to socket with ID: ${socket.id}`);
    
    // Join Session
    console.log(`Joining session SYS123 as ${userId}...`);
    socket.emit('joinSession', { joinCode: 'SYS123', userId });
  });

  socket.on('sessionState', (state) => {
    console.log('Received sessionState event:', state.status);
    
    // Let's change the state if we are the host. But we don't have the host endpoint readily available in this simple script.
    // We just want to ensure we don't crash when joining.
    if (state.status === 'scheduled') {
      console.log('✅ Successfully joined scheduled session.');
      socket.disconnect();
      console.log('✅ All Socket API tests passed.');
      process.exit(0);
    }
  });

  socket.on('sessionError', (err) => {
    console.error('Session Error:', err);
    socket.disconnect();
    process.exit(1);
  });
  
  socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
    process.exit(1);
  });

  // Timeout
  setTimeout(() => {
    console.error('❌ Test timed out');
    process.exit(1);
  }, 5000);
}

testSockets();
