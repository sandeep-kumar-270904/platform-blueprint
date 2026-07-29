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

const PROGRESS_WEIGHTS = {
  dsaTarget: 50,
  dsaWeight: 0.40,
  prepTargetScore: 100, // 100% readiness
  prepWeight: 0.30,
  mockTarget: 2,
  mockWeight: 0.30
};

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
    let targetCompanies = targetCompanyDoc ? targetCompanyDoc.company_ids.filter(c => c != null) : [];
    
    // Calculate readiness for target companies
    const prepProgress = await InterviewPrepProgress.find({ user_id: userId });
    let interviewPrepStats = { companiesTargeted: targetCompanies.length, targetReadiness: 0, itemsReviewed: 0 };
    
    if (targetCompanies.length > 0) {
      let totalItems = 0;
      let totalReviewed = 0;
      
      const userSolvedIds = new Set(dsaProgress ? dsaProgress.solved_problems.map(p => p._id.toString()) : []);
      const targetCompanyNames = targetCompanies.map(c => c.name);
      const targetDSAProblems = await DSAProblem.find({ companies: { $in: targetCompanyNames } });
      
      for (const comp of targetCompanies) {
        // Interview Prep Items
        let compTotal = (comp.tech_questions?.length || 0) + (comp.hr_tips?.length || 0);
        let compReviewed = 0;
        const p = prepProgress.find(prog => prog.company_id.toString() === comp._id.toString());
        if (p) {
          compReviewed += (p.reviewed_tech?.length || 0) + (p.reviewed_hr?.length || 0);
        }
        
        // DSA Items for this company
        const compDSA = targetDSAProblems.filter(prob => prob.companies.includes(comp.name));
        compTotal += compDSA.length;
        compReviewed += compDSA.filter(prob => userSolvedIds.has(prob._id.toString())).length;
        
        totalItems += compTotal;
        totalReviewed += compReviewed;
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

    // 4. Overall Readiness Calculation
    const dsaScore = Math.min(dsaStats.totalSolved / PROGRESS_WEIGHTS.dsaTarget, 1) * (PROGRESS_WEIGHTS.dsaWeight * 100);
    const prepScore = (interviewPrepStats.targetReadiness / PROGRESS_WEIGHTS.prepTargetScore) * (PROGRESS_WEIGHTS.prepWeight * 100);
    const mockScore = Math.min(mockStats.completed / PROGRESS_WEIGHTS.mockTarget, 1) * (PROGRESS_WEIGHTS.mockWeight * 100);
    const overallReadiness = Math.round(dsaScore + prepScore + mockScore);

    // 5. Raw Activities (Streaks calculated on frontend for timezone accuracy)
    const activities = await UserActivity.find({ user_id: userId }).sort({ date: 1 });
    const history = activities.map(a => a.date);
    
    // 6. Focus Area Detection (Server-Side Rules)
    const focusAreas = [];
    if (dsaStats.totalSolved < 10) {
      focusAreas.push({
        title: "Low DSA Progress",
        desc: "Solve more problems to build foundational logic.",
        link: "/placement/dsa",
        btnText: "Practice DSA"
      });
    }
    if (interviewPrepStats.companiesTargeted === 0) {
      focusAreas.push({
        title: "No Target Companies",
        desc: "Select companies to track interview-specific readiness.",
        link: "#targets",
        btnText: "Select Targets"
      });
    } else if (interviewPrepStats.targetReadiness < 50) {
      focusAreas.push({
        title: "Target Prep is Low",
        desc: "Review more technical and HR questions for your target companies.",
        link: "/placement/interview-prep",
        btnText: "Review Prep"
      });
    }
    if (mockStats.completed === 0) {
      focusAreas.push({
        title: "No Mock Interviews",
        desc: "Practice with professionals to reduce real-world anxiety.",
        link: "/placement/mock-interviews",
        btnText: "Book Session"
      });
    }

    res.json({
      overallReadiness,
      dsaStats,
      interviewPrepStats,
      mockStats,
      history,
      focusAreas,
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
    let targetCompanyDoc = await TargetCompany.findOne({ user_id: req.user.id }).populate('company_ids');
    let targetCompanies = targetCompanyDoc ? targetCompanyDoc.company_ids.filter(c => c != null) : [];
    res.json(targetCompanies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
