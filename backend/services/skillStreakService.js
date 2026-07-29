const SkillSession = require('../models/SkillSession');
const SkillOffer = require('../models/SkillOffer');
const SkillGoal = require('../models/SkillGoal');

// Helper to get week/year identifier
const getWeekIdentifier = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};

exports.calculateStreak = async (userId) => {
  // Find all completed sessions where user was a participant
  const sessions = await SkillSession.find({
    status: 'completed',
    participants: userId
  }).sort({ scheduledAt: -1 });

  if (!sessions || sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Extract unique weeks of activity
  const activeWeeks = [...new Set(sessions.map(s => getWeekIdentifier(new Date(s.scheduledAt))))];
  
  // Sort weeks descending (lexicographical works for YYYY-Www)
  activeWeeks.sort((a, b) => b.localeCompare(a));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const currentWeek = getWeekIdentifier(new Date());
  
  // Create an ordered list of all weeks from the earliest session to now
  // to properly check for gaps. (A simpler approach for demonstration)
  // We'll iterate through activeWeeks and find consecutive sequences.
  
  if (activeWeeks.length > 0) {
    // If the latest activity is not this week and not last week, current streak is 0
    // To simplify: we just count consecutive weeks backwards from the most recent active week.
    // If the most recent active week is older than last week, current is 0.

    const parseWeek = (weekStr) => {
      const [y, w] = weekStr.split('-W').map(Number);
      return { y, w };
    };

    const isConsecutive = (weekA, weekB) => {
      const a = parseWeek(weekA);
      const b = parseWeek(weekB);
      if (a.y === b.y && a.w === b.w + 1) return true;
      if (a.y === b.y + 1 && a.w === 1 && b.w >= 52) return true;
      return false;
    };

    let streakCount = 1;
    longestStreak = 1;

    for (let i = 0; i < activeWeeks.length - 1; i++) {
      if (isConsecutive(activeWeeks[i], activeWeeks[i+1])) {
        streakCount++;
        longestStreak = Math.max(longestStreak, streakCount);
      } else {
        streakCount = 1;
      }
    }

    // Check if current streak is alive
    const latestWeek = activeWeeks[0];
    const isAlive = (latestWeek === currentWeek) || isConsecutive(currentWeek, latestWeek);
    
    if (isAlive) {
      // Calculate current streak by counting backwards from index 0
      currentStreak = 1;
      for (let i = 0; i < activeWeeks.length - 1; i++) {
        if (isConsecutive(activeWeeks[i], activeWeeks[i+1])) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }
  }

  return { currentStreak, longestStreak };
};

exports.calculateGoalProgress = async (goal) => {
  const userId = goal.user;
  const now = new Date();
  let startDate = new Date();
  
  if (goal.period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (goal.period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  let progress = 0;

  if (goal.goalType === 'sessions-per-month') {
    progress = await SkillSession.countDocuments({
      status: 'completed',
      participants: userId,
      scheduledAt: { $gte: startDate }
    });
  } else if (goal.goalType === 'skills-to-learn') {
    // For this prototype, we'll check how many unique skills they've been taught
    // A session where they are the learner (we assume they learned if the offer was not theirs)
    const sessions = await SkillSession.find({
      status: 'completed',
      participants: userId,
      scheduledAt: { $gte: startDate }
    }).populate('request');
    
    const skillsLearned = new Set();
    sessions.forEach(s => {
      if (s.request && s.request.offer) {
        // If the offer doesn't belong to them, they are learning it
        skillsLearned.add(s.request.offer.toString());
      }
    });
    progress = skillsLearned.size;
  } else if (goal.goalType === 'skills-to-teach') {
    const offers = await SkillOffer.countDocuments({
      user: userId,
      createdAt: { $gte: startDate }
    });
    progress = offers;
  }

  return progress;
};
