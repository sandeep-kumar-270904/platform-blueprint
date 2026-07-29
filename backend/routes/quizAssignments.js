const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const QuizAssignment = require('../models/QuizAssignment');
const ClassRoster = require('../models/ClassRoster');
const QuizAttempt = require('../models/QuizAttempt');
const notificationService = require('../services/notificationService');

// Create a new assignment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { quizId, classRosterId, dueDate } = req.body;

    // Verify user owns/teaches this roster or is an admin
    const roster = await ClassRoster.findById(classRosterId);
    if (!roster) return res.status(404).json({ error: 'Roster not found' });
    
    if (roster.teacherId.toString() !== req.user.id) {
       // Ideally check admin status too, but keeping strict to teacher for now
       return res.status(403).json({ error: 'You are not the teacher of this roster' });
    }

    const assignment = new QuizAssignment({
      quiz: quizId,
      classRoster: classRosterId,
      assignedBy: req.user.id,
      dueDate
    });

    await assignment.save();

    // Notify students
    for (let studentId of roster.studentIds) {
      await notificationService.sendNotification({
        userId: studentId,
        type: 'new_quiz_assigned',
        relatedContentId: assignment._id,
        actorId: req.user.id
      });
    }

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assignments for a roster (status overview)
router.get('/roster/:rosterId', authMiddleware, async (req, res) => {
  try {
    const roster = await ClassRoster.findById(req.params.rosterId).populate('studentIds', 'username email');
    if (!roster) return res.status(404).json({ error: 'Roster not found' });
    
    const assignments = await QuizAssignment.find({ classRoster: req.params.rosterId })
      .populate('quiz', 'title category')
      .sort({ createdAt: -1 });

    const results = [];

    for (let assign of assignments) {
       const attempts = await QuizAttempt.find({ 
           quiz: assign.quiz._id, 
           user: { $in: roster.studentIds.map(s => s._id) }
       });

       const studentStatuses = roster.studentIds.map(student => {
          const studentAttempt = attempts.find(a => a.user.toString() === student._id.toString());
          let status = 'not_started';
          let score = null;
          
          if (studentAttempt) {
             status = studentAttempt.status === 'completed' ? 'completed' : 'in_progress';
             if (status === 'completed') {
                score = studentAttempt.percentageScore;
             }
          }
          
          return {
             student,
             status,
             score
          };
       });

       results.push({
          assignment: assign,
          rosterStatus: studentStatuses
       });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
