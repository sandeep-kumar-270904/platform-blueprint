const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Connect to MongoDB
connectDB().then(async () => {
  try {
    const cronService = require('./services/cronService');
    cronService.init();
    
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    // Seed default admin user for testing
    const adminExists = await User.findOne({ email: 'admin@studenthub.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await User.create({
        email: 'admin@studenthub.com',
        password: hashedPassword,
        username: 'admin',
        full_name: 'Admin User',
        role: 'admin',
        isEmailVerified: true
      });
      console.log('Seeded default admin user: admin@studenthub.com / admin123');
    }

    const Event = require('./models/Event');

    // --- 24-Hour Event Reminder Cron Job ---
    // Runs every hour (3600000 ms)
    setInterval(async () => {
      try {
        const EventRegistration = require('./models/EventRegistration');
        const notificationService = require('./services/notificationService');
        
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        // Find events starting between 24 and 25 hours from now that haven't been reminded
        const events = await Event.find({
          startDate: { $gte: in24Hours, $lt: in25Hours },
          reminded24h: false,
          status: 'approved'
        });

        for (const event of events) {
          const attendees = await EventRegistration.find({ eventId: event._id, status: 'registered' });
          for (const attendee of attendees) {
            await notificationService.createNotification({
              userId: attendee.userId,
              type: 'event_reminder',
              relatedContentId: event._id,
              message: `Reminder: The event "${event.title}" is starting in 24 hours!`
            });
          }
          event.reminded24h = true;
          await event.save();
        }

        // --- Mark events as completed and request feedback ---
        // Find approved events where endDate + endTime is in the past
        const allApprovedEvents = await Event.find({ status: 'approved' });
        for (const event of allApprovedEvents) {
          // Parse endDate and endTime
          // Note: Event.endDate is stored as Date, but might be midnight. endTime is "HH:mm".
          const endDate = new Date(event.endDate);
          if (event.endTime) {
            const [hours, minutes] = event.endTime.split(':');
            endDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          }
          
          if (endDate < now) {
            // Event has passed, mark as completed
            event.status = 'completed';
            await event.save();
            
            // Notify attendees to leave feedback
            const attendees = await EventRegistration.find({ eventId: event._id, status: 'registered' });
            for (const attendee of attendees) {
              await notificationService.createNotification({
                userId: attendee.userId,
                type: 'event_feedback_request',
                relatedContentId: event._id,
                message: `How was "${event.title}"? Share your feedback!`
              });
            }
          }
        }

      } catch (err) {
        console.error('Error in 24h event reminder cron:', err);
      }
    }, 60 * 60 * 1000); // Check every hour
  } catch (err) {
    console.error('Seed events error:', err);
  }
});

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
const allowedOrigins = ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Webhooks must be parsed as raw body for signature verification
const webhooksRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhooksRoutes);

app.use(express.json());
const cookieParser = require('cookie-parser');
const sanitizeMiddleware = require('./middleware/sanitize');

// Security middlewares
app.use(sanitizeMiddleware);
const session = require('express-session');
const passport = require('./auth/passport');

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

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
app.get('/', (req, res) => res.send('Student Hub backend is running'));
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // stricter limit for auth routes
  message: { message: 'Too many auth requests from this IP, please try again after 15 minutes' }
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/settings', authLimiter, settingsRoutes);
app.use('/api/notes', require('./routes/notes'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/qa', require('./routes/qa'));
app.use('/api/events', require('./routes/events'));
app.use('/api/search', require('./routes/search'));
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
app.use('/api/admin', require('./routes/adminJobs'));
app.use('/api/recruiter', require('./routes/recruiter'));
app.use('/api/innovation', require('./routes/innovation'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/college-qa', require('./routes/collegeQA'));
app.use('/api/ideas', require('./routes/ideas')); // kept for any backwards compatibility
app.use('/api/amas', require('./routes/amas'));
app.use('/api/video', require('./routes/video'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/admin/career-opportunities', require('./routes/adminCareerOpportunities'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/study-sessions', require('./routes/studySessions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/learning-paths', require('./routes/learningPaths'));
app.use('/api/mentors', require('./routes/mentors'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/job-alerts', require('./routes/jobAlerts'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/insights', require('./routes/insights'));

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

  socket.on('join_user_room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user:${userId}`);
  });

  socket.on('join_recruiter_room', (userId) => {
    socket.join(`recruiter:${userId}`);
    console.log(`Socket ${socket.id} joined recruiter:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global Error Handler (Item 6 & 7)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err); // Server-side logging
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ message: 'Internal Server Error' });
  } else {
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
