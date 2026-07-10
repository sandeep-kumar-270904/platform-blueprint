const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');
const path = require('path');
const fs = require('fs');

dotenv.config();

// Connect to MongoDB
connectDB();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all in dev
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Serve static files from uploads folder
app.use('/uploads', express.static(uploadsDir));

// Attach io to req for routes to use
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/qa', require('./routes/qa'));
app.use('/api/events', require('./routes/events'));
app.use('/api/community', require('./routes/community'));
app.use('/api/mentors', require('./routes/mentors'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/study-groups', require('./routes/studyGroups'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/roadmaps', require('./routes/roadmaps'));
app.use('/api/learning-sessions', require('./routes/learningSessions'));
app.use('/api/learning-progress', require('./routes/learningProgress'));
app.use('/api/note-comments', require('./routes/noteComments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/innovation', require('./routes/innovation'));
app.use('/api/ideas', require('./routes/ideas')); // kept for any backwards compatibility
app.use('/api/amas', require('./routes/amas'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/study-sessions', require('./routes/studySessions'));
app.use('/api/users', require('./routes/users'));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_classroom', (classroomId) => {
    socket.join(`classroom_${classroomId}`);
    console.log(`Socket ${socket.id} joined classroom_${classroomId}`);
  });
  
  socket.on('leave_classroom', (classroomId) => {
    socket.leave(`classroom_${classroomId}`);
    console.log(`Socket ${socket.id} left classroom_${classroomId}`);
  });

  socket.on('join_forum_thread', (threadId) => {
    socket.join(`forum_thread_${threadId}`);
    console.log(`Socket ${socket.id} joined forum_thread_${threadId}`);
  });
  
  socket.on('leave_forum_thread', (threadId) => {
    socket.leave(`forum_thread_${threadId}`);
    console.log(`Socket ${socket.id} left forum_thread_${threadId}`);
  });

  socket.on('join_qa_question', (questionId) => {
    socket.join(`qa_question_${questionId}`);
    console.log(`Socket ${socket.id} joined qa_question_${questionId}`);
  });
  
  socket.on('leave_qa_question', (questionId) => {
    socket.leave(`qa_question_${questionId}`);
    console.log(`Socket ${socket.id} left qa_question_${questionId}`);
  });

  socket.on('join_community_post', (postId) => {
    socket.join(`community_post_${postId}`);
    console.log(`Socket ${socket.id} joined community_post_${postId}`);
  });
  
  socket.on('leave_community_post', (postId) => {
    socket.leave(`community_post_${postId}`);
    console.log(`Socket ${socket.id} left community_post_${postId}`);
  });

  socket.on('join_group_room', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group_${groupId}`);
  });
  
  socket.on('leave_group_room', (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`Socket ${socket.id} left group_${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
