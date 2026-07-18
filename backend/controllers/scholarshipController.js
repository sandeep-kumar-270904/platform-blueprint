const Scholarship = require('../models/Scholarship');
const SavedScholarship = require('../models/SavedScholarship');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

exports.getScholarships = async (req, res) => {
  try {
    const { 
      q, 
      minAmount, 
      academicLevel, 
      major, 
      location, 
      applicationMode, 
      tags,
      page = 1,
      limit = 10
    } = req.query;

    const query = { status: 'published' }; // public API only shows published

    if (q) {
      query.$text = { $search: q };
    }
    if (minAmount) {
      query['amount.min'] = { $gte: Number(minAmount) };
    }
    if (academicLevel) {
      query['eligibility.academicLevel'] = academicLevel;
    }
    if (major) {
      query['eligibility.majors'] = major;
    }
    if (location) {
      query['eligibility.location'] = location;
    }
    if (applicationMode) {
      query.applicationMode = applicationMode;
    }
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    const skip = (page - 1) * limit;

    const scholarships = await Scholarship.find(query)
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Scholarship.countDocuments(query);

    res.json({
      scholarships,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching scholarships', error: err.message });
  }
};

exports.getScholarshipDetails = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
    
    // increment view count
    scholarship.viewCount += 1;
    await scholarship.save();

    res.json(scholarship);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching scholarship', error: err.message });
  }
};

// Org submitting a scholarship
exports.submitScholarship = async (req, res) => {
  try {
    const data = { ...req.body, source: 'submission', submittedBy: req.user.id, status: 'pending_review' };
    const scholarship = new Scholarship(data);
    await scholarship.save();
    res.status(201).json(scholarship);
  } catch (err) {
    res.status(400).json({ message: 'Error submitting scholarship', error: err.message });
  }
};

// Toggle Save
exports.toggleSave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const existing = await SavedScholarship.findOne({ userId, scholarshipId: id });
    const scholarship = await Scholarship.findById(id);

    if (existing) {
      await SavedScholarship.deleteOne({ _id: existing._id });
      if (scholarship) {
        scholarship.saveCount = Math.max(0, scholarship.saveCount - 1);
        await scholarship.save();
      }
      return res.json({ saved: false });
    } else {
      await SavedScholarship.create({ userId, scholarshipId: id });
      if (scholarship) {
        scholarship.saveCount += 1;
        await scholarship.save();
      }
      return res.json({ saved: true });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error toggling save', error: err.message });
  }
};

exports.getSavedScholarships = async (req, res) => {
  try {
    const saves = await SavedScholarship.find({ userId: req.user.id }).populate('scholarshipId');
    res.json(saves.map(s => s.scholarshipId).filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved scholarships', error: err.message });
  }
};

// Apply or track external link
exports.apply = async (req, res) => {
  try {
    const { id } = req.params;
    const { responses, essayResponses, attachedResumeId, attachedRecommendationLetterId } = req.body;
    const scholarship = await Scholarship.findById(id);
    
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    let app = await ScholarshipApplication.findOne({ userId: req.user.id, scholarshipId: id });
    if (!app) {
      app = new ScholarshipApplication({ userId: req.user.id, scholarshipId: id });
      scholarship.applicationCount += 1;
      await scholarship.save();
    }

    if (scholarship.applicationMode === 'external_link') {
      app.status = 'link_opened';
    } else {
      app.status = 'submitted';
      app.responses = responses || [];
      app.essayResponses = essayResponses || [];
      app.attachedResumeId = attachedResumeId;
      
      if (attachedRecommendationLetterId) {
          const RecommendationLetter = require('../models/RecommendationLetter');
          const letter = await RecommendationLetter.findOne({ _id: attachedRecommendationLetterId, requestedBy: req.user.id });
          if (letter && letter.status === 'submitted') {
              app.attachedRecommendationLetterId = attachedRecommendationLetterId;
              app.attachedLetterSnapshot = {
                  relationship: letter.relationship,
                  content: letter.content,
                  writtenBy: letter.writtenBy,
                  externalEmail: letter.externalEmail,
                  snapshottedAt: new Date()
              };
          }
      }
      
      app.submittedAt = new Date();
    }
    
    await app.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Error tracking application', error: err.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const apps = await ScholarshipApplication.find({ userId: req.user.id }).populate('scholarshipId');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g., user updating external link to 'submitted'
    const app = await ScholarshipApplication.findOne({ _id: id, userId: req.user.id });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = status;
    await app.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Error updating application status', error: err.message });
  }
};

// Admin endpoints
exports.getPendingReviews = async (req, res) => {
  try {
    const scholarships = await Scholarship.find({ status: 'pending_review' }).populate('submittedBy', 'name email role');
    res.json(scholarships);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending scholarships', error: err.message });
  }
};

exports.reviewScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body; // status can be published, rejected
    const scholarship = await Scholarship.findById(id);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    scholarship.status = status;
    scholarship.reviewNotes = reviewNotes;
    scholarship.reviewedBy = req.user.id;
    scholarship.reviewedAt = new Date();
    await scholarship.save();

    // Trigger notification here via emailService/Notification model (skipping explicit email code for brevity)

    res.json(scholarship);
  } catch (err) {
    res.status(500).json({ message: 'Error reviewing scholarship', error: err.message });
  }
};

exports.getAdminAnalytics = async (req, res) => {
  try {
      // Aggregate Funnel View
      const totalScholarships = await Scholarship.countDocuments({ status: 'published' });
      
      const applications = await ScholarshipApplication.find({});
      let appsStarted = 0;
      let appsSubmitted = 0;
      let appsAwarded = 0;
      let linkOpened = 0;

      applications.forEach(a => {
          if (a.status === 'draft') appsStarted++;
          if (a.status === 'submitted') appsSubmitted++;
          if (a.status === 'awarded') appsAwarded++;
          if (a.status === 'link_opened') linkOpened++;
      });

      // Categories Breakdown
      const categoriesRaw = await Scholarship.aggregate([
          { $match: { status: 'published' } },
          { $unwind: "$categories" },
          { $group: { _id: "$categories", count: { $sum: 1 } } }
      ]);

      const categories = categoriesRaw.map(c => ({ name: c._id, count: c.count }));

      // Source Breakdown
      const sourceRaw = await Scholarship.aggregate([
          { $match: { status: 'published' } },
          { $group: { _id: "$submittedByAdmin", count: { $sum: 1 } } }
      ]);
      const source = { admin: 0, org: 0 };
      sourceRaw.forEach(s => {
          if (s._id) source.admin = s.count;
          else source.org = s.count;
      });

      // Expiring / Stale flags
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const expiringSoon = await Scholarship.find({
          status: 'published',
          applicationDeadline: { $gt: now, $lt: nextWeek }
      }).select('title provider applicationDeadline');

      const stale = await Scholarship.find({
          status: 'published',
          saveCount: 0,
          applicationCount: 0,
          applicationDeadline: { $lt: now }
      }).select('title provider applicationDeadline');

      res.json({
          funnel: {
              totalScholarships,
              appsStarted,
              appsSubmitted,
              appsAwarded,
              linkOpened
          },
          categories,
          source,
          expiringSoon,
          stale
      });

  } catch (err) {
      res.status(500).json({ message: 'Error fetching admin analytics', error: err.message });
  }
};

// Match explanation using Gemini
exports.getMatchExplanation = async (req, res) => {
  try {
    const { id } = req.params;
    const scholarship = await Scholarship.findById(id);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = {
      major: user.major || 'Computer Science',
      gpa: user.gpa || 3.8,
      location: user.location || 'New York',
      academicLevel: 'undergraduate',
      bio: user.bio || 'First-generation college student interested in STEM.'
    };

    const explanation = await geminiService.generateScholarshipExplanation(profile, scholarship.eligibility, req.user.id);
    res.json({ explanation });
  } catch (err) {
    // Graceful fallback is just sending 500, frontend will handle and show rule-based
    res.status(500).json({ message: 'Failed to generate explanation', error: err.message });
  }
};
