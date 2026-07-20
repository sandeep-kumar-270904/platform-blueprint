const Scholarship = require('../models/Scholarship');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const AwardeeStory = require('../models/AwardeeStory');
const ScholarshipReview = require('../models/ScholarshipReview');
const ScholarshipCircle = require('../models/ScholarshipCircle');
const ComplianceCheck = require('../models/ComplianceCheck');
const ScamPatternRule = require('../models/ScamPatternRule');
const geminiService = require('../services/geminiService');

exports.getPriorityReports = async (req, res) => {
  try {
    // Basic stub for priority reports
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.markAtRisk = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Not found' });

    scholarship.isScamFlagged = !scholarship.isScamFlagged;
    
    // Automatically unpublish if scam flagged
    if (scholarship.isScamFlagged && scholarship.status === 'published') {
      scholarship.status = 'draft'; 
    }
    
    await scholarship.save();
    res.json(scholarship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStackingRules = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Not found' });

    const { canCombineWithOthers, excludedScholarshipIds, notes } = req.body;
    scholarship.stackingRules = {
      canCombineWithOthers: canCombineWithOthers !== undefined ? canCombineWithOthers : scholarship.stackingRules.canCombineWithOthers,
      excludedScholarshipIds: excludedScholarshipIds || scholarship.stackingRules.excludedScholarshipIds,
      notes: notes !== undefined ? notes : scholarship.stackingRules.notes
    };

    await scholarship.save();
    res.json(scholarship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createScamPattern = async (req, res) => {
  try {
    const { patternText, matchType, severity } = req.body;
    const rule = new ScamPatternRule({
      patternText,
      matchType,
      severity,
      createdBy: req.user.id
    });
    await rule.save();
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getScamPatterns = async (req, res) => {
  try {
    const rules = await ScamPatternRule.find({ isActive: true }).populate('createdBy', 'name');
    res.json(rules);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateScamPattern = async (req, res) => {
  try {
    const rule = await ScamPatternRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Not found' });

    const { isActive, severity } = req.body;
    if (isActive !== undefined) rule.isActive = isActive;
    if (severity !== undefined) rule.severity = severity;

    await rule.save();
    res.json(rule);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.relinkCycle = async (req, res) => {
  try {
    const newScholarship = await Scholarship.findById(req.params.id);
    if (!newScholarship) return res.status(404).json({ message: 'New scholarship not found' });

    const { previousScholarshipId } = req.body;
    const previousScholarship = await Scholarship.findById(previousScholarshipId);
    if (!previousScholarship) return res.status(404).json({ message: 'Previous scholarship not found' });

    let groupId = previousScholarship.recurringGroupId;
    if (!groupId) {
      groupId = previousScholarship._id;
      previousScholarship.recurringGroupId = groupId;
      await previousScholarship.save();
    }

    newScholarship.recurringGroupId = groupId;
    await newScholarship.save();

    res.json(newScholarship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.translateScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Not found' });

    const { targetLanguage } = req.body;
    if (!targetLanguage) return res.status(400).json({ message: 'targetLanguage required' });

    const existingIndex = scholarship.translations.findIndex(t => t.language === targetLanguage);

    const prompt = `Translate the following scholarship title and description into ${targetLanguage}. 
    Title: "${scholarship.title}"
    Description: "${scholarship.description}"
    
    Return the result exactly as a JSON object with keys "title" and "description" and NO markdown formatting.`;

    const jsonStr = await geminiService.generateText(prompt);
    
    let parsed;
    try {
      parsed = JSON.parse(jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim());
    } catch (e) {
      return res.status(500).json({ message: 'Failed to parse translation JSON from AI', raw: jsonStr });
    }

    const newTranslation = {
      language: targetLanguage,
      title: parsed.title || scholarship.title,
      description: parsed.description || scholarship.description,
      translationSource: 'gemini',
      translatedAt: new Date()
    };

    if (existingIndex > -1) {
      scholarship.translations[existingIndex] = newTranslation;
    } else {
      scholarship.translations.push(newTranslation);
    }

    await scholarship.save();
    res.json(scholarship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateTranslation = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Not found' });

    const lang = req.params.language;
    const { title, description } = req.body;

    const existingIndex = scholarship.translations.findIndex(t => t.language === lang);
    if (existingIndex === -1) {
      return res.status(404).json({ message: 'Translation not found to update' });
    }

    scholarship.translations[existingIndex].title = title || scholarship.translations[existingIndex].title;
    scholarship.translations[existingIndex].description = description || scholarship.translations[existingIndex].description;
    scholarship.translations[existingIndex].translationSource = 'manual';
    scholarship.translations[existingIndex].translatedAt = new Date();

    await scholarship.save();
    res.json(scholarship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateRenewalRequirements = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Not found' });

    if (scholarship.institutionAllocation?.institutionId && req.user.role !== 'admin') {
      if (!req.user.institutionId || req.user.institutionId.toString() !== scholarship.institutionAllocation.institutionId.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const { minGPAToMaintain, enrollmentStatusRequired, reportingRequired, reportingFrequency } = req.body;
    
    scholarship.renewalRequirements = {
      minGPAToMaintain: minGPAToMaintain !== undefined ? minGPAToMaintain : scholarship.renewalRequirements?.minGPAToMaintain,
      enrollmentStatusRequired: enrollmentStatusRequired !== undefined ? enrollmentStatusRequired : scholarship.renewalRequirements?.enrollmentStatusRequired,
      reportingRequired: reportingRequired !== undefined ? reportingRequired : scholarship.renewalRequirements?.reportingRequired,
      reportingFrequency: reportingFrequency !== undefined ? reportingFrequency : scholarship.renewalRequirements?.reportingFrequency
    };

    await scholarship.save();
    res.json(scholarship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { isAuthentic, scholarshipId } = req.query;
    const filter = {};
    if (isAuthentic !== undefined) filter.isAuthentic = isAuthentic === 'true';
    if (scholarshipId) filter.scholarshipId = scholarshipId;
    
    const reviews = await ScholarshipReview.find(filter).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getCircles = async (req, res) => {
  try {
    const circles = await ScholarshipCircle.find({}).populate('members.userId', 'name').sort({ createdAt: -1 });
    res.json(circles);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAwardeeStories = async (req, res) => {
  try {
    const { isVerified } = req.query;
    const filter = {};
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const stories = await AwardeeStory.find(filter).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getComplianceChecks = async (req, res) => {
  try {
    const { status, pastDue } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (pastDue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'verified' };
    }

    const checks = await ComplianceCheck.find(filter).populate({
      path: 'applicationId',
      populate: { path: 'scholarshipId userId', select: 'title name email' }
    }).sort({ dueDate: 1 });
    res.json(checks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.checkDataConsistency = async (req, res) => {
  try {
    const allSchIds = await Scholarship.find({}, '_id').distinct('_id');
    const schIdSet = new Set(allSchIds.map(id => id.toString()));

    const allAppIds = await ScholarshipApplication.find({}, '_id').distinct('_id');
    const appIdSet = new Set(allAppIds.map(id => id.toString()));

    // 1. Orphaned Applications
    const apps = await ScholarshipApplication.find({}, 'scholarshipId _id');
    const orphanedApps = apps.filter(app => !app.scholarshipId || !schIdSet.has(app.scholarshipId.toString()));

    // 2. Orphaned Stories
    const stories = await AwardeeStory.find({}, 'applicationId _id');
    const orphanedStories = stories.filter(story => !story.applicationId || !appIdSet.has(story.applicationId.toString()));

    // 3. Orphaned Reviews
    const reviews = await ScholarshipReview.find({}, 'scholarshipId _id');
    const orphanedReviews = reviews.filter(review => !review.scholarshipId || !schIdSet.has(review.scholarshipId.toString()));

    // 4. Orphaned Compliance Checks
    const complianceChecks = await ComplianceCheck.find({}, 'applicationId _id');
    const orphanedCompliance = complianceChecks.filter(check => !check.applicationId || !appIdSet.has(check.applicationId.toString()));

    // 5. Pool Allocation Issues
    const scholarships = await Scholarship.find({});
    const poolIssues = [];
    const counterIssues = [];
    const staleDeadlines = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const sch of scholarships) {
      if (sch.institutionAllocation && sch.institutionAllocation.institutionId) {
        if (sch.institutionAllocation.remainingPoolAmount < 0) {
          poolIssues.push({ scholarshipId: sch._id, issue: 'Negative remaining pool' });
        }
        if (sch.institutionAllocation.remainingPoolAmount > sch.institutionAllocation.totalPoolAmount) {
          poolIssues.push({ scholarshipId: sch._id, issue: 'Remaining pool exceeds total' });
        }
      }

      // Check non-recurring passed deadlines
      if (!sch.isRecurring && sch.status === 'published' && sch.applicationDeadline && new Date(sch.applicationDeadline) < today) {
        staleDeadlines.push(sch._id);
      }

      // Counter checks (applicationCount)
      const realAppCount = await ScholarshipApplication.countDocuments({ scholarshipId: sch._id });
      if (sch.applicationCount !== undefined && sch.applicationCount !== realAppCount) {
        counterIssues.push({ scholarshipId: sch._id, field: 'applicationCount', stored: sch.applicationCount, real: realAppCount });
      }
    }

    res.json({
      orphanedApplicationsCount: orphanedApps.length,
      orphanedApplications: orphanedApps.map(a => a._id),
      orphanedStoriesCount: orphanedStories.length,
      orphanedStories: orphanedStories.map(s => s._id),
      orphanedReviewsCount: orphanedReviews.length,
      orphanedReviews: orphanedReviews.map(r => r._id),
      orphanedComplianceCount: orphanedCompliance.length,
      orphanedCompliance: orphanedCompliance.map(c => c._id),
      poolIssues,
      counterIssues,
      staleDeadlines,
      status: (orphanedApps.length === 0 && orphanedStories.length === 0 && orphanedReviews.length === 0 && orphanedCompliance.length === 0 && poolIssues.length === 0 && counterIssues.length === 0 && staleDeadlines.length === 0) ? 'clean' : 'inconsistent'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.moderateAwardeeStory = async (req, res) => {
  try {
    const story = await AwardeeStory.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });
    const { action } = req.body;
    if (action === 'approve') {
      story.status = 'published';
    } else if (action === 'reject') {
      story.status = 'rejected';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
    await story.save();
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyComplianceCheck = async (req, res) => {
  try {
    const check = await ComplianceCheck.findById(req.params.id);
    if (!check) return res.status(404).json({ message: 'Not found' });
    check.status = 'verified';
    await check.save();
    res.json(check);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.flagComplianceCheck = async (req, res) => {
  try {
    const check = await ComplianceCheck.findById(req.params.id);
    if (!check) return res.status(404).json({ message: 'Not found' });
    check.status = 'flagged';
    await check.save();
    res.json(check);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getEcosystemHealth = async (req, res) => {
  try {
    const ScholarshipBuddy = require('../models/ScholarshipBuddy');
    
    const buddiesLooking = await ScholarshipBuddy.countDocuments({ status: 'looking' });
    const buddiesMatched = await ScholarshipBuddy.countDocuments({ status: 'matched' });
    
    const circlesActive = await ScholarshipCircle.countDocuments();
    
    res.json({
      buddiesLooking,
      buddiesMatched,
      circlesActive
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
