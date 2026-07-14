const express = require('express');
const router = express.Router();
const LearningPath = require('../models/LearningPath');
const LearningPathEnrollment = require('../models/LearningPathEnrollment');
const CourseEnrollment = require('../models/CourseEnrollment');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// GET /api/learning-paths (List paths)
router.get('/', async (req, res) => {
  try {
    const { category, level, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { goal: { $regex: search, $options: 'i' } }
      ];
    }

    const paths = await LearningPath.find(query).sort({ createdAt: -1 });
    res.json(paths);
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/learning-paths/:id (Detail)
router.get('/:id', async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id).populate('courseIds');
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }
    res.json(path);
  } catch (error) {
    console.error('Error fetching learning path:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/learning-paths (Admin)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const newPath = new LearningPath(req.body);
    const savedPath = await newPath.save();
    res.status(201).json(savedPath);
  } catch (error) {
    console.error('Error creating learning path:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/learning-paths/:id (Admin)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const updatedPath = await LearningPath.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }
    res.json(updatedPath);
  } catch (error) {
    console.error('Error updating learning path:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/learning-paths/:id (Admin)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const path = await LearningPath.findByIdAndDelete(req.params.id);
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }
    // Delete enrollments for this path
    await LearningPathEnrollment.deleteMany({ pathId: req.params.id });
    res.json({ message: 'Learning path deleted' });
  } catch (error) {
    console.error('Error deleting learning path:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/learning-paths/:id/enroll (Auth required)
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    // 1. Enroll in the learning path (idempotent due to unique index, so handle gracefully)
    try {
      await LearningPathEnrollment.create({
        userId: req.user.id,
        pathId: path._id
      });
    } catch (err) {
      if (err.code !== 11000) {
        throw err;
      }
    }

    // 2. Auto-enroll in all courses in the path
    const courseIds = path.courseIds;
    const existingEnrollments = await CourseEnrollment.find({
      userId: req.user.id,
      courseId: { $in: courseIds }
    }).select('courseId');

    const existingCourseIds = existingEnrollments.map(e => e.courseId.toString());
    const newCourseIdsToEnroll = courseIds.filter(id => !existingCourseIds.includes(id.toString()));

    if (newCourseIdsToEnroll.length > 0) {
      const enrollmentsToCreate = newCourseIdsToEnroll.map(cId => ({
        userId: req.user.id,
        courseId: cId,
        status: 'enrolled',
        progressPercent: 0
      }));
      await CourseEnrollment.insertMany(enrollmentsToCreate);

      // Increment totalEnrollments for each newly enrolled course
      const Course = require('../models/Course');
      await Course.updateMany(
        { _id: { $in: newCourseIdsToEnroll } },
        { $inc: { totalEnrollments: 1 } }
      );
    }

    res.json({ message: 'Successfully enrolled in learning path and its courses' });
  } catch (error) {
    console.error('Error enrolling in learning path:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
