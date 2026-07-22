const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const PlacementOnboarding = require('../models/PlacementOnboarding');
const DSAProgress = require('../models/DSAProgress');
const MentorBooking = require('../models/MentorBooking');
const ResumeVersion = require('../models/ResumeVersion');

// Utility to generate a plan based on user preferences
const generatePrepPlan = (preferences, existingPlans = []) => {
  const { dsa_comfort, has_mock_exp, resume_ready, placement_date, weekly_hours } = preferences;
  
  const now = new Date();
  const targetDate = placement_date ? new Date(placement_date) : new Date(now.setMonth(now.getMonth() + 3));
  const weeksUntil = Math.max(1, Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24 * 7)));
  
  // Validation for unrealistic timeline
  if (weeksUntil < 4 && weekly_hours < 5) {
    const error = new Error('UNREALISTIC_TIMELINE');
    error.code = 'UNREALISTIC_TIMELINE';
    throw error;
  }
  
  // Scale problem counts based on hours (e.g., 2 problems per hour)
  const dsaTargetPerWeek = Math.max(2, Math.floor(weekly_hours * 1.5));

  const phases = [];
  
  if (weeksUntil < 4) {
    // CRASH PLAN
    phases.push({
      timeframe: `Weeks 1-${weeksUntil}`,
      title: 'Crash Course: High Impact Prep',
      description: 'Your placement is very close. We are bypassing foundational learning to focus purely on high-ROI activities like Mock Interviews and top-priority company questions.',
      tasks: [
        { 
          title: `Solve ${dsaTargetPerWeek * weeksUntil} top frequent DSA questions`, 
          link: '/placement/dsa?sort=frequency', 
          dynamic_link: '/placement/dsa?sort=frequency',
          auto_verify: true, 
          verify_type: 'dsa_any', 
          verify_target: dsaTargetPerWeek * weeksUntil,
          is_completed: false 
        },
        { 
          title: 'Complete 2 Mock Interviews immediately', 
          link: '/placement/mock-interviews', 
          auto_verify: true, 
          verify_type: 'mock_completed', 
          verify_target: 2,
          is_completed: false 
        },
        ...(!resume_ready ? [{ 
          title: 'Finalize Resume for ATS parsing', 
          link: '/placement/resume', 
          auto_verify: true,
          verify_type: 'resume_updated',
          verify_target: 1,
          is_completed: false 
        }] : [])
      ]
    });
  } else {
    // STANDARD PLAN
    // Phase 1: Foundation (Depends on DSA comfort)
    let p1Weeks = Math.max(1, Math.floor(weeksUntil * 0.4));
    let p1Tasks = [];
    
    if (dsa_comfort === 'Beginner' || dsa_comfort === 'None') {
      p1Tasks.push({ 
        title: `Solve ${dsaTargetPerWeek} Easy & ${Math.max(1, Math.floor(dsaTargetPerWeek/2))} Medium Array/String problems per week`, 
        link: '/placement/dsa?difficulty=Easy', 
        dynamic_link: '/placement/dsa?difficulty=Easy',
        auto_verify: true, 
        verify_type: 'dsa_easy', 
        verify_target: dsaTargetPerWeek * p1Weeks,
        is_completed: false 
      });
    } else {
      p1Tasks.push({ 
        title: `Solve ${dsaTargetPerWeek} Medium & ${Math.max(1, Math.floor(dsaTargetPerWeek/4))} Hard Graph/DP problems per week`, 
        link: '/placement/dsa?difficulty=Medium', 
        dynamic_link: '/placement/dsa?difficulty=Medium',
        auto_verify: true, 
        verify_type: 'dsa_medium', 
        verify_target: dsaTargetPerWeek * p1Weeks,
        is_completed: false 
      });
      // Advanced users spend less time on Phase 1
      p1Weeks = Math.max(1, Math.floor(weeksUntil * 0.2)); 
    }
    
    if (!resume_ready) {
      p1Tasks.push({ 
        title: 'Draft and format your resume', 
        link: '/placement/resume', 
        auto_verify: true, 
        verify_type: 'resume_updated', 
        verify_target: 1,
        is_completed: false 
      });
    }
    
    phases.push({
      timeframe: `Weeks 1-${p1Weeks}`,
      title: dsa_comfort === 'Advanced' ? 'DSA Review & Advanced Patterns' : 'DSA Fundamentals & Core Concepts',
      description: 'Build a strong foundation for technical rounds.',
      tasks: p1Tasks
    });

    // Phase 2: Company-Specific Prep & Mocks
    const p2Start = p1Weeks + 1;
    const p2Weeks = Math.max(p2Start, Math.floor(weeksUntil * 0.8));
    phases.push({
      timeframe: `Weeks ${p2Start}-${p2Weeks}`,
      title: 'Company-Specific Prep & Mock Interviews',
      description: 'Focus on your target companies and start practicing verbal communication.',
      tasks: [
        { title: 'Review Interview Experiences for target companies', link: '/placement/interview-prep', is_completed: false },
        { title: 'Practice Technical Questions from top priority companies', link: '/placement/interview-prep', is_completed: false },
        { 
          title: 'Book a mock interview', 
          link: '/placement/mock-interviews', 
          auto_verify: true, 
          verify_type: 'mock_completed', 
          verify_target: 1,
          is_completed: false 
        }
      ]
    });

    // Phase 3: Revision & Final Polish
    const p3Start = p2Weeks + 1;
    phases.push({
      timeframe: `Weeks ${p3Start}-${weeksUntil}`,
      title: 'Revision & Final Polish',
      description: 'Consolidate your knowledge and address weak points.',
      tasks: [
        { title: 'Review your resume using the ATS tool', link: '/placement/resume', is_completed: false },
        { title: 'Request referrals from alumni', link: '/placement/dashboard?tab=referrals', is_completed: false },
        { title: 'Revise CS fundamentals (OS, DBMS, Networks)', link: '/placement/dsa', is_completed: false }
      ]
    });
  }

  const nextVersion = existingPlans.length > 0 ? Math.max(...existingPlans.map(p => p.version)) + 1 : 1;
  
  // Carry forward completed manually-tracked tasks from the previous plan (if names match exactly)
  if (existingPlans.length > 0) {
    const lastPlan = existingPlans.reduce((prev, curr) => curr.version > prev.version ? curr : prev);
    const completedManualTasks = new Set();
    
    lastPlan.phases.forEach(ph => {
      ph.tasks.forEach(t => {
        if (t.is_completed && !t.auto_verify) {
          completedManualTasks.add(t.title);
        }
      });
    });
    
    phases.forEach(ph => {
      ph.tasks.forEach(t => {
        if (!t.auto_verify && completedManualTasks.has(t.title)) {
          t.is_completed = true;
        }
      });
    });
  }

  return { 
    version: nextVersion,
    phases, 
    start_date: new Date(), 
    current_week: 1 
  };
};

// GET /api/placement-onboarding
router.get('/', authMiddleware, async (req, res) => {
  try {
    let onboarding = await PlacementOnboarding.findOne({ user: req.user.id })
      .populate('preferences.target_companies', 'name logoUrl')
      .populate('preferences.top_priority_companies', 'name logoUrl');
      
    if (!onboarding) {
      onboarding = await PlacementOnboarding.create({ user: req.user.id });
      return res.json(onboarding);
    }
    
    // Perform Auto-Verification for active plan
    const activePlan = onboarding.active_plan;
    if (activePlan) {
      let madeChanges = false;
      const planStartDate = activePlan.start_date;
      
      // Fetch required data for verification since plan start date
      const dsaProgress = await DSAProgress.findOne({ user_id: req.user.id }).populate('solved_problems');
      const recentDSA = dsaProgress ? dsaProgress.solved_problems.filter(p => new Date(p.solvedAt || p.createdAt) >= planStartDate) : [];
      
      const recentMocks = await MentorBooking.countDocuments({
        menteeId: req.user.id,
        status: 'completed',
        updatedAt: { $gte: planStartDate }
      });
      
      const recentResumes = await ResumeVersion.countDocuments({
        user: req.user.id,
        createdAt: { $gte: planStartDate }
      });

      // Find the actual plan in the array to modify
      const planIndex = onboarding.plans.findIndex(p => p._id.toString() === activePlan._id.toString());
      
      if (planIndex !== -1) {
        onboarding.plans[planIndex].phases.forEach(phase => {
          phase.tasks.forEach(task => {
            if (task.auto_verify && !task.is_completed) {
              let currentCount = 0;
              
              if (task.verify_type === 'dsa_easy') {
                currentCount = recentDSA.filter(p => p.difficulty === 'Easy').length;
              } else if (task.verify_type === 'dsa_medium') {
                currentCount = recentDSA.filter(p => p.difficulty === 'Medium').length;
              } else if (task.verify_type === 'dsa_any') {
                currentCount = recentDSA.length;
              } else if (task.verify_type === 'mock_completed') {
                currentCount = recentMocks;
              } else if (task.verify_type === 'resume_updated') {
                currentCount = recentResumes;
              }
              
              if (currentCount >= task.verify_target) {
                task.is_completed = true;
                madeChanges = true;
              }
            }
          });
        });
      }
      
      if (madeChanges) {
        await onboarding.save();
      }
    }

    res.json(onboarding);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/placement-onboarding
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    let onboarding = await PlacementOnboarding.findOne({ user: req.user.id });
    if (!onboarding) {
      onboarding = new PlacementOnboarding({ user: req.user.id });
    }
    
    try {
      const newPlan = generatePrepPlan(preferences, onboarding.plans);
      
      onboarding.has_completed = true;
      onboarding.preferences = preferences;
      onboarding.plans.push(newPlan);
      
      await onboarding.save();
      res.json(onboarding);
      
    } catch (generateErr) {
      if (generateErr.code === 'UNREALISTIC_TIMELINE') {
        return res.status(400).json({ 
          message: 'Your placement date is very close but your weekly time commitment is too low. Please increase your hours to generate a feasible Crash Plan.' 
        });
      }
      throw generateErr;
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/placement-onboarding/skip
router.post('/skip', authMiddleware, async (req, res) => {
  try {
    const defaultPreferences = {
      dsa_comfort: 'Beginner',
      has_mock_exp: false,
      resume_ready: false,
      weekly_hours: 10
    };
    
    let onboarding = await PlacementOnboarding.findOne({ user: req.user.id });
    if (!onboarding) {
      onboarding = new PlacementOnboarding({ user: req.user.id });
    }
    
    const newPlan = generatePrepPlan(defaultPreferences, onboarding.plans);
    
    onboarding.has_completed = true;
    onboarding.preferences = defaultPreferences;
    onboarding.plans.push(newPlan);
    
    await onboarding.save();
    res.json(onboarding);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/placement-onboarding/task/:taskId
router.put('/task/:taskId', authMiddleware, async (req, res) => {
  try {
    const { is_completed } = req.body;
    
    const onboarding = await PlacementOnboarding.findOneAndUpdate(
      { user: req.user.id, "plans.phases.tasks._id": req.params.taskId },
      { $set: { "plans.$[].phases.$[].tasks.$[task].is_completed": is_completed } },
      { arrayFilters: [{ "task._id": req.params.taskId }], new: true }
    );
    
    res.json(onboarding);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
