const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

// Determine environment
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : 
                process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env';
dotenv.config({ path: envFile });


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

// Connect to MongoDB
connectDB().then(async () => {
  try {
    const cronService = require('./services/cronService');
    cronService.init(io);
    
    const notificationService = require('./services/notificationService');
    notificationService.init(io);
    
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

    // Seed DSA problems if empty
    const DSAProblem = require('./models/DSAProblem');
    const problemCount = await DSAProblem.countDocuments();
    if (problemCount === 0) {
      const problems = [
        { title: "Two Sum", difficulty: "Easy", topic: "Arrays", companies: ["Google", "Amazon", "Facebook"], link: "https://leetcode.com/problems/two-sum/" },
        { title: "Best Time to Buy and Sell Stock", difficulty: "Easy", topic: "Arrays", companies: ["Amazon", "Microsoft"], link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
        { title: "Contains Duplicate", difficulty: "Easy", topic: "Arrays", companies: ["Google", "Apple"], link: "https://leetcode.com/problems/contains-duplicate/" },
        { title: "Product of Array Except Self", difficulty: "Medium", topic: "Arrays", companies: ["Facebook", "Amazon"], link: "https://leetcode.com/problems/product-of-array-except-self/" },
        { title: "Maximum Subarray", difficulty: "Medium", topic: "Arrays", companies: ["Microsoft", "LinkedIn"], link: "https://leetcode.com/problems/maximum-subarray/" },
        { title: "Climbing Stairs", difficulty: "Easy", topic: "DP", companies: ["Amazon", "Google"], link: "https://leetcode.com/problems/climbing-stairs/" },
        { title: "Coin Change", difficulty: "Medium", topic: "DP", companies: ["Amazon", "Microsoft"], link: "https://leetcode.com/problems/coin-change/" },
        { title: "Longest Increasing Subsequence", difficulty: "Medium", topic: "DP", companies: ["Google", "Facebook"], link: "https://leetcode.com/problems/longest-increasing-subsequence/" },
        { title: "Word Break", difficulty: "Medium", topic: "DP", companies: ["Amazon", "Facebook"], link: "https://leetcode.com/problems/word-break/" },
        { title: "Number of Islands", difficulty: "Medium", topic: "Graphs", companies: ["Amazon", "Google", "Facebook"], link: "https://leetcode.com/problems/number-of-islands/" },
        { title: "Clone Graph", difficulty: "Medium", topic: "Graphs", companies: ["Facebook", "Amazon"], link: "https://leetcode.com/problems/clone-graph/" },
        { title: "Course Schedule", difficulty: "Medium", topic: "Graphs", companies: ["Google", "Amazon"], link: "https://leetcode.com/problems/course-schedule/" },
        { title: "Alien Dictionary", difficulty: "Hard", topic: "Graphs", companies: ["Facebook", "Google"], link: "https://leetcode.com/problems/alien-dictionary/" },
        { title: "Invert Binary Tree", difficulty: "Easy", topic: "Trees", companies: ["Google"], link: "https://leetcode.com/problems/invert-binary-tree/" },
        { title: "Maximum Depth of Binary Tree", difficulty: "Easy", topic: "Trees", companies: ["Amazon", "Microsoft"], link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
        { title: "Binary Tree Level Order Traversal", difficulty: "Medium", topic: "Trees", companies: ["Facebook", "Amazon"], link: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
        { title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", topic: "Trees", companies: ["Google", "Amazon"], link: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/" }
      ];
      await DSAProblem.insertMany(problems);
      console.log('Seeded DSA problems.');
    }

    // Seed Company Prep data if empty
    const CompanyPrep = require('./models/CompanyPrep');
    const companyCount = await CompanyPrep.countDocuments();
    if (companyCount === 0) {
      const companies = [
        {
          name: "Google",
          logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
          companyType: "Product-based",
          overview: {
            hiringStages: ["Online Assessment", "Phone Screen", "Onsite Interviews (4-5 rounds)"],
            eligibilityCriteria: "B.Tech/M.Tech with 70%+ aggregate. Strong problem solving skills.",
            typicalRoles: ["Software Engineer", "Site Reliability Engineer"]
          },
          technicalQuestions: [
            { question: "Design a distributed rate limiter.", approach: "Use Token Bucket algorithm with Redis for state storage. Discuss scalability and latency.", difficulty: "Hard", category: "System Design" },
            { question: "Find median of two sorted arrays.", approach: "Use binary search on the smaller array to partition them equally.", difficulty: "Hard", category: "Arrays" }
          ],
          hrTips: [
            { question: "Tell me about a time you failed.", guidance: "Focus on what you learned and how you adapted. Be honest and show a growth mindset.", category: "Behavioral" }
          ]
        },
        {
          name: "Amazon",
          logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
          companyType: "Product-based",
          overview: {
            hiringStages: ["Online Assessment (2 coding questions + LP)", "Phone Interview", "Loop Interviews (3-4 rounds)"],
            eligibilityCriteria: "B.Tech/M.Tech in CS/IT. No active backlogs.",
            typicalRoles: ["SDE I", "Cloud Support Associate"]
          },
          technicalQuestions: [
            { question: "Implement an LRU Cache.", approach: "Use a doubly linked list combined with a hash map for O(1) operations.", difficulty: "Medium", category: "Design" },
            { question: "Number of Islands.", approach: "Use BFS or DFS to traverse the matrix and count connected components of 1s.", difficulty: "Medium", category: "Graphs" }
          ],
          hrTips: [
            { question: "Amazon Leadership Principles", guidance: "Prepare a story for each of the 16 Leadership Principles using the STAR method.", category: "Behavioral" }
          ]
        },
        {
          name: "TCS",
          logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg",
          companyType: "Service-based",
          overview: {
            hiringStages: ["NQT (Cognitive + Coding)", "Technical Interview", "HR Interview"],
            eligibilityCriteria: "Minimum 60% throughout academics. Maximum 1 active backlog.",
            typicalRoles: ["Ninja Developer", "Digital Innovator"]
          },
          technicalQuestions: [
            { question: "Reverse a linked list.", approach: "Use three pointers (prev, curr, next) to reverse links iteratively.", difficulty: "Easy", category: "Linked List" },
            { question: "Difference between abstract class and interface.", approach: "Explain multiple inheritance, default methods, and constructor presence in abstract classes.", difficulty: "Easy", category: "OOP" }
          ],
          hrTips: [
            { question: "Why TCS?", guidance: "Mention their global presence, learning opportunities, and work culture.", category: "Motivation" }
          ]
        }
      ];
      await CompanyPrep.insertMany(companies);
      console.log('Seeded Company Prep data.');
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

      // --- Quiz Difficulty Calibration Cron Job ---
      try {
        const calibrateDifficulty = require('./jobs/quizCalibrationJob');
        await calibrateDifficulty();
      } catch (err) {
        console.error('Error in Quiz Calibration Job:', err);
      }
    }, 60 * 60 * 1000); // Check every hour
  } catch (err) {
    console.error('Seed events error:', err);
  }
});



// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL] // No wildcards or localhost in production
  : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean);

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

// Request Logging using Morgan + Winston
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

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

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'ok',
      timestamp: new Date(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
});

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const disputeRoutes = require('./routes/disputes');
const platformReferralRoutes = require('./routes/platformReferrals');
const adminMentorsOverviewRoutes = require('./routes/adminMentorsOverview');

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
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/coach', require('./routes/coach'));

const applicationsRoutes = require('./routes/applications');
const resumesRoutes = require('./routes/resumes');
const mentorsRoutes = require('./routes/mentors');
const scholarshipRoutes = require('./routes/scholarships');
const scholarshipTrustRoutes = require('./routes/scholarshipTrust');
const jobRoutes = require('./routes/jobs');
const quizzesRoutes = require('./routes/quizzes');

app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/applications', applicationsRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/mentors', mentorsRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/scholarships', scholarshipTrustRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/quizzes', quizzesRoutes);

// app.use('/api/classes', require('./routes/classes'));
// app.use('/api/courses', require('./routes/courses'));
// app.use('/api/skills', require('./routes/skills'));
// app.use('/api/projects', require('./routes/projects'));
// app.use('/api/companies', require('./routes/companies'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/scholarships/circles', require('./routes/scholarshipCircles'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/study-groups', require('./routes/studyGroups'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/negotiation', require('./routes/negotiation'));
app.use('/api/portfolios', require('./routes/portfolios'));
app.use('/api/resume-feedback', require('./routes/feedback'));
app.use('/api/cover-letters', require('./routes/coverLetters'));
app.use('/api/events', require('./routes/events'));
app.use('/api/search', require('./routes/search'));
app.use('/api/community', require('./routes/community'));
app.use('/api/mentors', require('./routes/mentors'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/scholarships', require('./routes/scholarships'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/negotiation', require('./routes/negotiation'));
app.use('/api/portfolios', require('./routes/portfolios'));
app.use('/api/resume-feedback', require('./routes/feedback'));
app.use('/api/cover-letters', require('./routes/coverLetters'));
app.use('/api/study-groups', require('./routes/studyGroups'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/dsa', require('./routes/dsa'));
app.use('/api/interview-prep', require('./routes/interviewPrep'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/roadmaps', require('./routes/roadmaps'));
app.use('/api/learning-sessions', require('./routes/learningSessions'));
app.use('/api/learning-progress', require('./routes/learningProgress'));
app.use('/api/note-comments', require('./routes/noteComments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/adminJobs'));
app.use('/api/admin/mentors', require('./routes/adminMentorsOverview'));
app.use('/api/admin/moderation', require('./routes/adminModeration'));
app.use('/api/admin/community', require('./routes/adminCommunity'));
app.use('/api/admin/financials', require('./routes/adminFinancials'));
app.use('/api/admin/quiz-review', require('./routes/adminQuizReview'));
app.use('/api/recruiter', require('./routes/recruiter'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/innovation', require('./routes/innovation'));
app.use('/api/career', require('./routes/careerSimulator'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/college-qa', require('./routes/collegeQA'));
app.use('/api/ideas', require('./routes/ideas'));
app.use('/api/brainstorm', require('./routes/brainstorm'));
app.use('/api/idea-circles', require('./routes/ideaCircles'));
app.use('/api/direct-messages', require('./routes/directMessages'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/amas', require('./routes/amas'));
app.use('/api/video', require('./routes/video'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/admin/career-opportunities', require('./routes/adminCareerOpportunities'));
app.use('/api/admin/resumes', require('./routes/adminResumes'));
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
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/admin/jobs', require('./routes/adminJobs'));
app.use('/api/admin/quiz-reports', require('./routes/adminQuizReports'));
app.use('/api/admin/resumes', require('./routes/adminResumes'));
app.use('/api/live-sessions', require('./routes/liveSessions'));
app.use('/api/news', require('./routes/news'));
app.use('/api/leaderboards', require('./routes/leaderboards'));
app.use('/api/creators', require('./routes/creators'));
app.use('/api/admin/quizzes-overview', require('./routes/adminQuizzesOverview'));
app.use('/api/question-bank', require('./routes/questionBank'));
app.use('/api/me', require('./routes/me'));
app.use('/api/mentor-community', require('./routes/mentorCommunity'));
app.use('/api/ai-paths', require('./routes/aiPaths'));
app.use('/api/institutions', require('./routes/institutions'));
app.use('/api/essays', require('./routes/essays'));
  app.use('/api/essay-bank', require('./routes/essayBank'));
  app.use('/api/essay-templates', require('./routes/essayTemplates'));
  app.use('/api/scholarships/savings-goal', require('./routes/savingsGoals'));
  app.use('/api/scholarship-coach', require('./routes/scholarshipCoach'));
  app.use('/api/awardee-stories', require('./routes/awardeeStories'));
  app.use('/api/admin/scholarships', require('./routes/scholarshipAdmin'));
  app.use('/api/scholarship-buddies', require('./routes/scholarshipBuddies'));
  app.use('/api/institutions/:institutionId/scholarships', require('./routes/institutionScholarships'));
  app.use('/api/compliance-checks', require('./routes/complianceChecks'));
  app.use('/api/disputes', disputeRoutes);
  app.use('/api/platform-referrals', platformReferralRoutes);
  app.use('/api/alt-funding-resources', require('./routes/altFunding'));
  app.use('/api/admin/alt-funding-resources', require('./routes/adminAltFunding'));
  app.use('/api/scholarships', require('./routes/providerFeedback'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/admin/mentors-overview', adminMentorsOverviewRoutes);

// Optional integration (mocked if unused)

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

  socket.on('join_brainstorm_session', (sessionId) => {
    socket.join(`brainstorm_${sessionId}`);
    console.log(`Socket ${socket.id} joined brainstorm_${sessionId}`);
  });

  socket.on('leave_brainstorm_session', (sessionId) => {
    socket.leave(`brainstorm_${sessionId}`);
    console.log(`Socket ${socket.id} left brainstorm_${sessionId}`);
  });

  // Attach Live Session socket handlers
  require('./sockets/liveSessions')(io, socket);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global Error Handler (Item 6 & 7)
app.use((err, req, res, next) => {
  // Determine if it's a client error or internal server error
  const statusCode = err.statusCode || 500;
  
  if (statusCode >= 500) {
    logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, { stack: err.stack });
  } else {
    logger.warn(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }
  
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({ message: statusCode >= 500 ? 'Internal Server Error' : err.message });
  } else {
    res.status(statusCode).json({ message: err.message, stack: err.stack });
  }
});

const PORT = process.env.PORT || 5000;

const serverInstance = server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful Shutdown Logic
const shutdown = () => {
  logger.info('Received shutdown signal, shutting down gracefully...');
  serverInstance.close(async () => {
    logger.info('Closed out remaining connections.');
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', err);
      process.exit(1);
    }
  });

  // Force close if it takes too long
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);


