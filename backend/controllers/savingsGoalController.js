const SavingsGoal = require('../models/SavingsGoal');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const { sendNotification } = require('../services/notificationService');

exports.upsertSavingsGoal = async (req, res) => {
  try {
    const { targetAmount, targetDate, linkedInstitutionName } = req.body;
    let goal = await SavingsGoal.findOne({ userId: req.user.id });

    if (goal) {
      if (targetAmount !== undefined) goal.targetAmount = targetAmount;
      if (targetDate !== undefined) goal.targetDate = targetDate;
      if (linkedInstitutionName !== undefined) goal.linkedInstitutionName = linkedInstitutionName;
      await goal.save();
    } else {
      goal = new SavingsGoal({
        userId: req.user.id,
        targetAmount,
        targetDate,
        linkedInstitutionName
      });
      await goal.save();
    }

    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSavingsGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({ userId: req.user.id });
    if (!goal) return res.status(404).json({ message: 'No savings goal found' });

    // Reusing the exact same aggregation as Phase 6's my-funding endpoint
    const applications = await ScholarshipApplication.find({ userId: req.user.id })
      .populate('scholarshipId', 'amount')
      .lean();

    let awardedSum = 0;
    applications.forEach(app => {
      if (!app.scholarshipId || !app.scholarshipId.amount) return;
      if (app.status === 'awarded') {
        const amt = app.scholarshipId.amount.fixedValue || app.scholarshipId.amount.maxValue || app.scholarshipId.amount.minValue || 0;
        awardedSum += amt;
      }
    });

    res.json({ goal, awardedSum });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateSavingsGoal = async (req, res) => {
  try {
    const { targetAmount, targetDate, linkedInstitutionName } = req.body;
    const goal = await SavingsGoal.findOne({ userId: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Not found' });

    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (targetDate !== undefined) goal.targetDate = targetDate;
    if (linkedInstitutionName !== undefined) goal.linkedInstitutionName = linkedInstitutionName;

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Internal service function triggered on award
exports.checkSavingsMilestones = async (userId) => {
  try {
    const goal = await SavingsGoal.findOne({ userId });
    if (!goal) return;

    const applications = await ScholarshipApplication.find({ userId })
      .populate('scholarshipId', 'amount')
      .lean();

    let awardedSum = 0;
    applications.forEach(app => {
      if (!app.scholarshipId || !app.scholarshipId.amount) return;
      if (app.status === 'awarded') {
        const amt = app.scholarshipId.amount.fixedValue || app.scholarshipId.amount.maxValue || app.scholarshipId.amount.minValue || 0;
        awardedSum += amt;
      }
    });

    const progressPercent = (awardedSum / goal.targetAmount) * 100;
    const thresholds = [100, 75, 50, 25];
    
    // Find the highest threshold crossed
    let thresholdToNotify = null;
    for (const t of thresholds) {
      if (progressPercent >= t) {
        thresholdToNotify = t;
        break;
      }
    }

    if (thresholdToNotify && (goal.lastMilestoneNotified === null || goal.lastMilestoneNotified < thresholdToNotify)) {
      // Fire notifications for all thresholds crossed that haven't been notified yet
      for (let i = thresholds.length - 1; i >= 0; i--) {
        const t = thresholds[i];
        if (progressPercent >= t && (goal.lastMilestoneNotified === null || goal.lastMilestoneNotified < t)) {
          await sendNotification({
            userId,
            type: 'savings_milestone',
            message: `Congratulations! You've reached ${t}% of your savings goal!`,
            relatedContentId: goal._id
          });
        }
      }
      goal.lastMilestoneNotified = thresholdToNotify;
      await goal.save();
    }
  } catch (err) {
    console.error('Error checking savings milestones:', err);
  }
};
