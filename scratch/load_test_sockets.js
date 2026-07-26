const { io } = require('socket.io-client');

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';
const NUM_CLIENTS = 150;
const SESSION_ID = 'load_test_session_123';

console.log(`Starting load test with ${NUM_CLIENTS} concurrent clients connecting to ${SOCKET_URL}`);

let connectedCount = 0;
let messageReceivedCount = 0;

for (let i = 0; i < NUM_CLIENTS; i++) {
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    forceNew: true
  });

  socket.on('connect', () => {
    connectedCount++;
    // Join the live session
    socket.emit('join_live_session', { sessionId: SESSION_ID, userId: `user_${i}` });
    
    // Simulate answering a question
    setTimeout(() => {
       socket.emit('submit_live_answer', {
          sessionId: SESSION_ID,
          userId: `user_${i}`,
          questionId: 'q_test_123',
          selectedOptionIndex: 1,
          timeTaken: 5000
       });
    }, 2000 + (Math.random() * 5000)); // staggered answers
  });

  socket.on('live_leaderboard_update', (data) => {
     messageReceivedCount++;
  });

  socket.on('connect_error', (err) => {
    console.error(`Connection error for client ${i}:`, err.message);
  });
}

// Stats reporter
const interval = setInterval(() => {
  console.log(`--- STATUS: ${connectedCount}/${NUM_CLIENTS} connected | Leaderboard broadcasts received: ${messageReceivedCount}`);
  if (connectedCount === NUM_CLIENTS && messageReceivedCount > NUM_CLIENTS * 0.5) {
      console.log('Load test completed successfully. The socket layer held up well under 150 concurrent users.');
      clearInterval(interval);
      process.exit(0);
  }
}, 3000);

setTimeout(() => {
   console.log('Load test timed out.');
   clearInterval(interval);
   process.exit(1);
}, 30000);
