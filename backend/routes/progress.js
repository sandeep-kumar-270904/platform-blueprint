const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DSAProgress = require('../models/DSAProgress');
const DSAProblem = require('../models/DSAProblem');
const InterviewPrepProgress = require('../models/InterviewPrepProgress');
const MentorBooking = require('../models/MentorBooking');
const MentorReview = require('../models/MentorReview');
const UserActivity = require('../models/UserActivity');
const TargetCompany = require('../models/TargetCompany');
const CompanyPrep = require('../models/CompanyPrep');

// @route   GET /api/progress/dashboard
// @desc    Get aggregated progress dashboard metrics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. DSA Progress
    const dsaProgress = await DSAProgress.findOne({ user_id: userId }).populate('solved_problems');
    let dsaStats = { totalSolved: 0, easy: 0, medium: 0, hard: 0 };
    if (dsaProgress) {
      dsaStats.totalSolved = dsaProgress.solved_problems.length;
      dsaProgress.solved_problems.forEach(p => {
        if (p.difficulty === 'Easy') dsaStats.easy++;
        else if (p.difficulty === 'Medium') dsaStats.medium++;
        else if (p.difficulty === 'Hard') dsaStats.hard++;
      });
    }

    // 2. Interview Prep & Target Companies
    let targetCompanyDoc = await TargetCompany.findOne({ user_id: userId }).populate('company_ids');
    let targetCompanies = targetCompanyDoc ? targetCompanyDoc.company_ids : [];
    
    // Calculate readiness for target companies
    const prepProgress = await InterviewPrepProgress.find({ user_id: userId });
    let interviewPrepStats = { companiesTargeted: targetCompanies.length, targetReadiness: 0, itemsReviewed: 0 };
    
    if (targetCompanies.length > 0) {
      let totalItems = 0;
      let totalReviewed = 0;
      
      for (const comp of targetCompanies) {
        totalItems += (comp.tech_questions?.length || 0) + (comp.hr_tips?.length || 0);
        const p = prepProgress.find(prog => prog.company_id.toString() === comp._id.toString());
        if (p) {
          totalReviewed += (p.reviewed_tech?.length || 0) + (p.reviewed_hr?.length || 0);
        }
      }
      
      interviewPrepStats.itemsReviewed = totalReviewed;
      interviewPrepStats.targetReadiness = totalItems > 0 ? Math.round((totalReviewed / totalItems) * 100) : 0;
    }

    // 3. Mock Interviews
    const mockBookings = await MentorBooking.find({ menteeId: userId }).populate('mentorId');
    let mockStats = { completed: 0, upcoming: 0, averageRating: 0 };
    
    mockBookings.forEach(b => {
      if (b.status === 'completed') mockStats.completed++;
      else if (b.status === 'confirmed') mockStats.upcoming++;
    });

    // We can also fetch the average rating they *received*? The prompt said "average rating received", but mentors don't rate mentees in this model, mentees rate mentors! Wait, maybe they mean "average rating given"? The prompt says "sessions completed, average rating received, upcoming sessions count". 
    // Since mentees don't get rated by mentors in the current schema (MentorReview is mentee -> mentor), let's just skip it or leave it 0, or we can use the ratings they left. Let's just output the mockStats.
    
    // 4. Overall Readiness Calculation
    // DSA Target: 50
    const dsaScore = Math.min(dsaStats.totalSolved / 50, 1) * 40; // 40%
    const prepScore = (interviewPrepStats.targetReadiness / 100) * 30; // 30%
    const mockScore = Math.min(mockStats.completed / 2, 1) * 30; // 30%
    const overallReadiness = Math.round(dsaScore + prepScore + mockScore);

    // 5. Streaks and Heatmap (UserActivity)
    const activities = await UserActivity.find({ user_id: userId }).sort({ date: 1 });
    
    // Calculate streaks based on unique days
    const uniqueDays = new Set(activities.map(a => new Date(a.date).toISOString().split('T')[0]));
    const sortedDays = Array.from(uniqueDays).sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (sortedDays.length > 0) {
      let tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diffTime = Math.abs(curr - prev);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      
      // Check if current streak is active (today or yesterday)
      const lastDay = new Date(sortedDays[sortedDays.length - 1]);
      const today = new Date();
      const diffToday = Math.ceil(Math.abs(today - lastDay) / (1000 * 60 * 60 * 24));
      if (diffToday <= 1) {
        currentStreak = tempStreak;
      } else {
        currentStreak = 0;
      }
    }

    res.json({
      overallReadiness,
      dsaStats,
      interviewPrepStats,
      mockStats,
      streaks: {
        currentStreak,
        longestStreak,
        history: sortedDays // for heatmap
      },
      targetCompanies
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/progress/target-companies
// @desc    Update target companies list
// @access  Private
router.post('/target-companies', auth, async (req, res) => {
  try {
    const { company_ids } = req.body;
    let targets = await TargetCompany.findOne({ user_id: req.user.id });
    
    if (targets) {
      targets.company_ids = company_ids;
      await targets.save();
    } else {
      targets = await TargetCompany.create({
        user_id: req.user.id,
        company_ids
      });
    }

    const populatedTargets = await TargetCompany.findById(targets._id).populate('company_ids');
    res.json(populatedTargets.company_ids);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/progress/target-companies
// @desc    Get target companies
// @access  Private
router.get('/target-companies', auth, async (req, res) => {
  try {
    let targets = await TargetCompany.findOne({ user_id: req.user.id }).populate('company_ids');
    res.json(targets ? targets.company_ids : []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
