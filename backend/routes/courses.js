const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const CourseRating = require('../models/CourseRating');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin'); // Assuming admin middleware exists, else I need to create one or use auth + check role.

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    const { search, category, level, sort, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    if (level) {
      query.level = level;
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'rating') sortObj = { rating: -1 };
    if (sort === 'enrollments') sortObj = { totalEnrollments: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const courses = await Course.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Course.countDocuments(query);

    res.json({
      courses,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
});

// GET /api/courses/recommendations
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const EventRegistration = require('../models/EventRegistration');
    const LearningPath = require('../models/LearningPath');
    
    const user = await User.findById(req.user.id).populate('savedColleges');
    
    let interestedCategories = new Set();
    
    // Infer interests from saved colleges
    if (user && user.savedColleges) {
      user.savedColleges.forEach(col => {
        if (col.type === 'Tech' || col.type === 'Engineering' || (col.name && col.name.includes('Tech'))) {
          interestedCategories.add('Technology');
          interestedCategories.add('Programming');
        } else if (col.type === 'Business') {
          interestedCategories.add('Business');
        } else if (col.type === 'Art' || col.type === 'Design') {
          interestedCategories.add('Design');
        }
      });
    }

    // Infer interests from registered events
    const registrations = await EventRegistration.find({ userId: req.user.id }).populate('eventId');
    registrations.forEach(reg => {
      if (reg.eventId && reg.eventId.tags) {
        reg.eventId.tags.forEach(tag => {
          const t = tag.toLowerCase();
          if (t.includes('tech') || t.includes('code') || t.includes('hack')) interestedCategories.add('Programming');
          if (t.includes('design') || t.includes('ui')) interestedCategories.add('Design');
          if (t.includes('business') || t.includes('startup')) interestedCategories.add('Business');
        });
      }
    });

    const categoriesArray = Array.from(interestedCategories);
    
    // Find matching courses not enrolled
    const enrollments = await CourseEnrollment.find({ userId: req.user.id });
    const enrolledCourseIds = enrollments.map(e => e.courseId);

    let recommendedCourses = [];
    if (categoriesArray.length > 0) {
      recommendedCourses = await Course.find({
        category: { $in: categoriesArray },
        _id: { $nin: enrolledCourseIds }
      }).limit(5);
    }
    
    // Fallback to top rated/most enrolled
    if (recommendedCourses.length < 5) {
      const fallback = await Course.find({
        _id: { $nin: [...enrolledCourseIds, ...recommendedCourses.map(c => c._id)] }
      }).sort({ rating: -1, totalEnrollments: -1 }).limit(5 - recommendedCourses.length);
      recommendedCourses = [...recommendedCourses, ...fallback];
    }
    
    const topPaths = await LearningPath.find().sort({ createdAt: -1 }).limit(2);
    
    res.json({ recommendedCourses, topPaths });

  } catch (error) {
    console.error('Error fetching course recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Optionally fetch recent reviews here if requested, but base detail is fine.
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/courses (Admin)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Server error creating course' });
  }
});

// PUT /api/courses/:id (Admin)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error updating course' });
  }
});

// DELETE /api/courses/:id (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Cleanup enrollments and ratings
    await CourseEnrollment.deleteMany({ courseId: req.params.id });
    await CourseRating.deleteMany({ courseId: req.params.id });
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
});

// POST /api/courses/:id/enroll
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    let enrollment = await CourseEnrollment.findOne({ courseId, userId });
    if (enrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    enrollment = new CourseEnrollment({
      userId,
      courseId,
      status: 'enrolled',
      progressPercent: 0
    });
    
    await enrollment.save();

    // Increment totalEnrollments
    course.totalEnrollments += 1;
    await course.save();

    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error enrolling:', error);
    res.status(500).json({ message: 'Server error enrolling in course' });
  }
});

// PUT /api/courses/:id/progress
router.put('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    const { progressPercent } = req.body;

    if (progressPercent === undefined || progressPercent < 0 || progressPercent > 100) {
      return res.status(400).json({ message: 'Invalid progress percentage (0-100)' });
    }

    let enrollment = await CourseEnrollment.findOne({ courseId, userId });
    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    enrollment.progressPercent = progressPercent;
    enrollment.lastProgressUpdateAt = new Date();
    
    if (progressPercent === 100) {
      enrollment.status = 'completed';
      if (!enrollment.completedAt) enrollment.completedAt = new Date();
    } else if (progressPercent > 0) {
      enrollment.status = 'in_progress';
      enrollment.completedAt = null; // if they revert progress
    } else {
      enrollment.status = 'enrolled';
      enrollment.completedAt = null;
    }

    await enrollment.save();

    // Streak Logic
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const user = await User.findById(userId);
    
    if (user) {
      const now = new Date();
      // Start of today (local or UTC, we'll use UTC date string for simplicity)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let currentStreak = user.learningStreak?.current || 0;
      let longestStreak = user.learningStreak?.longest || 0;
      let lastActive = user.learningStreak?.lastActiveDate;

      if (!lastActive) {
        currentStreak = 1;
      } else {
        const lastActiveDate = new Date(lastActive);
        const lastActiveStart = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());
        
        const diffTime = Math.abs(today - lastActiveStart);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // It was yesterday, increment
          currentStreak += 1;
        } else if (diffDays > 1) {
          // Missed a day, reset
          currentStreak = 1;
        }
        // If diffDays === 0, it's today, no change to streak
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      user.learningStreak = {
        current: currentStreak,
        longest: longestStreak,
        lastActiveDate: now
      };

      // Extract skills if completed
      if (progressPercent === 100) {
        const Course = require('../models/Course');
        const course = await Course.findById(courseId);
        
        if (course) {
          const skillsToGains = new Set([...(course.tags || []), course.category]);
          skillsToGains.delete(undefined);
          skillsToGains.delete(null);
          skillsToGains.delete('');
          
          if (!user.skills) user.skills = [];
          
          skillsToGains.forEach(skillName => {
            let existingSkill = user.skills.find(s => s.skillName === skillName);
            if (existingSkill) {
              if (!existingSkill.sourceCourses.includes(courseId)) {
                existingSkill.sourceCourses.push(courseId);
              }
            } else {
              user.skills.push({
                skillName,
                sourceCourses: [courseId]
              });
            }
          });
        }
      }

      await user.save();

      // Check milestones
      const milestones = [7, 30, 100];
      const diffTime = lastActive ? Math.floor(Math.abs(today - new Date(new Date(lastActive).getFullYear(), new Date(lastActive).getMonth(), new Date(lastActive).getDate())) / (1000 * 60 * 60 * 24)) : 1000;
      
      // Only notify if we JUST hit the milestone today
      if (milestones.includes(currentStreak) && (diffTime === 1 || !lastActive)) {
        await Notification.create({
          userId,
          type: 'course_streak_milestone',
          message: `🔥 Incredible! You've hit a ${currentStreak}-day learning streak! Keep up the great work.`
        });
      }
    }
    res.json(enrollment);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Server error updating progress' });
  }
});

// POST /api/courses/:id/rate
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    const { rating, reviewText } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify enrollment
    const enrollment = await CourseEnrollment.findOne({ courseId, userId });
    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled to rate this course' });
    }

    // Upsert rating
    const courseRating = await CourseRating.findOneAndUpdate(
      { courseId, userId },
      { rating, reviewText },
      { new: true, upsert: true }
    );

    // Recalculate average rating
    const allRatings = await CourseRating.find({ courseId });
    const totalRatings = allRatings.length;
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    const course = await Course.findById(courseId);
    course.totalRatings = totalRatings;
    course.rating = Math.round(avgRating * 10) / 10;
    await course.save();

    res.json({ message: 'Rating submitted successfully', courseRating, courseAvg: course.rating });
  } catch (error) {
    console.error('Error rating course:', error);
    res.status(500).json({ message: 'Server error rating course' });
  }
});

// GET /api/courses/:id/ratings
router.get('/:id/ratings', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const ratings = await CourseRating.find({ courseId: req.params.id })
      .populate('userId', 'name username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await CourseRating.countDocuments({ courseId: req.params.id });

    res.json({
      ratings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ message: 'Server error fetching ratings' });
  }
});

// GET /api/courses/:id/paths
router.get('/:id/paths', async (req, res) => {
  try {
    const LearningPath = require('../models/LearningPath');
    const paths = await LearningPath.find({ courseIds: req.params.id })
      .select('title category level thumbnailImage');
    res.json(paths);
  } catch (error) {
    console.error('Error fetching course paths:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/:id/certificate
router.get('/:id/certificate', authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    const enrollment = await CourseEnrollment.findOne({ courseId, userId }).populate('courseId').populate('userId');
    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    if (enrollment.status !== 'completed' || enrollment.progressPercent !== 100) {
      return res.status(403).json({ message: 'Course must be 100% completed to earn a certificate.' });
    }

    const course = enrollment.courseId;
    const user = enrollment.userId;

    // We send metadata and a styled HTML template string that the frontend can render and capture.
    const certificateData = {
      studentName: user.name || user.username || 'Student',
      courseTitle: course.title,
      provider: course.provider,
      instructor: course.instructor,
      completionDate: enrollment.completedAt,
      certificateId: enrollment._id.toString() // unique identifier for verification
    };

    const htmlTemplate = `
      <div style="width: 800px; height: 600px; padding: 40px; text-align: center; border: 10px solid #78716c; background: #fff; font-family: sans-serif; position: relative;">
        <div style="border: 2px solid #78716c; padding: 40px; height: 100%; box-sizing: border-box;">
          <h1 style="font-size: 40px; color: #1c1917; margin-bottom: 10px;">Certificate of Completion</h1>
          <p style="font-size: 20px; color: #57534e; margin-bottom: 40px;">This is to certify that</p>
          <h2 style="font-size: 36px; color: #0c4a6e; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; display: inline-block; padding-bottom: 10px;">
            ${certificateData.studentName}
          </h2>
          <p style="font-size: 20px; color: #57534e; margin-bottom: 20px;">has successfully completed the online course</p>
          <h3 style="font-size: 28px; color: #1c1917; margin-bottom: 10px;">${certificateData.courseTitle}</h3>
          <p style="font-size: 18px; color: #78716c;">Provided by ${certificateData.provider}</p>
          
          <div style="position: absolute; bottom: 80px; left: 80px; text-align: center;">
            <p style="border-bottom: 1px solid #1c1917; padding-bottom: 5px; margin-bottom: 5px; font-size: 18px;">${new Date(certificateData.completionDate).toLocaleDateString()}</p>
            <p style="font-size: 14px; color: #78716c;">Date of Completion</p>
          </div>
          
          <div style="position: absolute; bottom: 80px; right: 80px; text-align: center;">
            <p style="border-bottom: 1px solid #1c1917; padding-bottom: 5px; margin-bottom: 5px; font-size: 18px;">${certificateData.instructor || 'Antigravity Platform'}</p>
            <p style="font-size: 14px; color: #78716c;">Instructor / Platform</p>
          </div>
          
          <div style="position: absolute; bottom: 20px; right: 20px; font-size: 10px; color: #a8a29e;">
            ID: ${certificateData.certificateId}
          </div>
        </div>
      </div>
    `;

    res.json({
      metadata: certificateData,
      html: htmlTemplate
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Server error generating certificate' });
  }
});

module.exports = router;
