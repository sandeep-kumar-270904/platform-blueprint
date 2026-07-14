const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Review = require('../models/Review');
const CollegeQuestion = require('../models/CollegeQuestion');
const CollegeAnswer = require('../models/CollegeAnswer');

// Note: Real follower schema would typically involve a separate Follow model.
// For the UI demonstration purposes, we will mock a successful response.

// POST /api/users/:id/follow
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    // Check if user exists
    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) return res.status(404).json({ message: 'User not found' });
    
    // In a full DB setup, you'd add this to a 'Follows' collection
    // await Follow.create({ follower_id: req.user.id, following_id: req.params.id });
    
    res.json({ message: 'Followed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/users/me/reviews
router.get('/me/reviews', authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .populate('collegeId', 'name location')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching reviews', error: error.message });
  }
});

// GET /api/users/me/questions
router.get('/me/questions', authMiddleware, async (req, res) => {
  try {
    const questions = await CollegeQuestion.find({ userId: req.user.id })
      .populate('collegeId', 'name location')
      .sort({ createdAt: -1 });
      
    // Count answers for each question
    const questionsWithCount = await Promise.all(questions.map(async (q) => {
      const answersCount = await CollegeAnswer.countDocuments({ questionId: q._id });
      return { ...q.toObject(), answersCount };
    }));
      
    res.json({ questions: questionsWithCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching questions', error: error.message });
  }
});

// GET /api/users/me/answers
router.get('/me/answers', authMiddleware, async (req, res) => {
  try {
    const answers = await CollegeAnswer.find({ userId: req.user.id })
      .populate({
        path: 'questionId',
        select: 'questionText collegeId',
        populate: {
          path: 'collegeId',
          select: 'name location'
        }
      })
      .sort({ createdAt: -1 });
    res.json({ answers });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching answers', error: error.message });
  }
});

// GET /api/users/me/events/hosting
router.get('/me/events/hosting', authMiddleware, async (req, res) => {
  try {
    const Event = require('../models/Event');
    const events = await Event.find({ hostedBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching events', error: error.message });
  }
});

// GET /api/users/me/events/registered
router.get('/me/events/registered', authMiddleware, async (req, res) => {
  try {
    const EventRegistration = require('../models/EventRegistration');
    const Event = require('../models/Event');
    
    // Find all registrations for this user
    const registrations = await EventRegistration.find({ userId: req.user.id });
    const eventIds = registrations.map(r => r.eventId);
    
    // Find all the corresponding events
    const events = await Event.find({ _id: { $in: eventIds } });
    
    const now = new Date();
    
    // Group them into upcoming and past
    const upcoming = [];
    const past = [];
    
    // We attach the registration status so the frontend can see if they are waitlisted
    events.forEach(event => {
      const reg = registrations.find(r => r.eventId.toString() === event._id.toString());
      const eventWithRegStatus = { ...event.toObject(), registrationStatus: reg.status, registrationId: reg._id };
      
      if (new Date(event.endDate) >= now) {
        upcoming.push(eventWithRegStatus);
      } else {
        past.push(eventWithRegStatus);
      }
    });
    
    // Sort upcoming (soonest first), past (most recently ended first)
    upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    past.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    
    res.json({ upcoming, past });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching registered events', error: error.message });
  }
});

// GET /api/users/:id/profile
router.get('/:id/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username full_name avatar_url university degree graduation_year');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/notification-preferences
router.get('/me/notification-preferences', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.notificationPreferences || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/me/notification-preferences
router.put('/me/notification-preferences', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.notificationPreferences = { ...user.notificationPreferences, ...req.body };
    await user.save();
    
    res.json(user.notificationPreferences);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/courses
router.get('/me/courses', authMiddleware, async (req, res) => {
  try {
    const CourseEnrollment = require('../models/CourseEnrollment');
    const Notification = require('../models/Notification');
    const User = require('../models/User');

    const user = await User.findById(req.user.id).select('learningStreak');

    const enrollments = await CourseEnrollment.find({ userId: req.user.id })
      .populate('courseId')
      .sort({ updatedAt: -1 });

    const result = {
      enrolled: [],
      in_progress: [],
      completed: [],
      learningStreak: user?.learningStreak || { current: 0, longest: 0, lastActiveDate: null }
    };

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    for (let enrollment of enrollments) {
      // Logic for stalled and 5-day reminders
      if (enrollment.status === 'in_progress') {
        const lastUpdate = enrollment.lastProgressUpdateAt ? new Date(enrollment.lastProgressUpdateAt) : new Date(enrollment.updatedAt);
        const diffDays = Math.floor(Math.abs(now - lastUpdate) / msPerDay);
        
        enrollment = enrollment.toObject();
        enrollment.daysSinceUpdate = diffDays;
        
        if (diffDays >= 30) {
          enrollment.isStalled = true;
        }

        // 5-day gentle reminder logic
        // If it's been exactly 5 days (or 6, to give a buffer), we notify. 
        // We ensure we don't spam by checking if a notification for this course already exists recently.
        if (diffDays === 5 || diffDays === 6) {
          const recentNotification = await Notification.findOne({
            userId: req.user.id,
            type: 'course_reminder',
            relatedContentId: enrollment.courseId._id,
            createdAt: { $gte: new Date(now.getTime() - 3 * msPerDay) } // within last 3 days
          });

          if (!recentNotification) {
            await Notification.create({
              userId: req.user.id,
              type: 'course_reminder',
              relatedContentId: enrollment.courseId._id,
              message: `Pick up where you left off in ${enrollment.courseId.title}. You've got this!`
            });
          }
        }
      } else {
        enrollment = enrollment.toObject();
      }

      if (enrollment.status === 'enrolled') result.enrolled.push(enrollment);
      else if (enrollment.status === 'in_progress') result.in_progress.push(enrollment);
      else if (enrollment.status === 'completed') result.completed.push(enrollment);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/learning-paths
router.get('/me/learning-paths', authMiddleware, async (req, res) => {
  try {
    const LearningPathEnrollment = require('../models/LearningPathEnrollment');
    const CourseEnrollment = require('../models/CourseEnrollment');
    
    const enrollments = await LearningPathEnrollment.find({ userId: req.user.id })
      .populate('pathId')
      .sort({ createdAt: -1 });

    const results = [];

    // Calculate progress for each path
    for (let enrollment of enrollments) {
      if (!enrollment.pathId) continue;
      const path = enrollment.pathId;
      const courseIds = path.courseIds || [];
      
      let completedCount = 0;
      if (courseIds.length > 0) {
        const completedCourses = await CourseEnrollment.countDocuments({
          userId: req.user.id,
          courseId: { $in: courseIds },
          status: 'completed'
        });
        completedCount = completedCourses;
      }

      const progressPercent = courseIds.length > 0 
        ? Math.round((completedCount / courseIds.length) * 100) 
        : 0;

      results.push({
        _id: enrollment._id,
        path: path,
        progressPercent,
        completedCourses: completedCount,
        totalCourses: courseIds.length,
        enrolledAt: enrollment.enrolledAt
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching user learning paths:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
