const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CompanyPrep = require('../models/CompanyPrep');
const InterviewExperience = require('../models/InterviewExperience');
const InterviewPrepProgress = require('../models/InterviewPrepProgress');

// @route   GET /api/interview-prep/companies
// @desc    Get all companies with search and filters
// @access  Private
router.get('/companies', auth, async (req, res) => {
  try {
    const { search, type } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (type && type !== 'all') {
      query.companyType = type;
    }

    const companies = await CompanyPrep.find(query).lean();
    
    // Aggregate experiences count and guides count for each
    const result = await Promise.all(companies.map(async (company) => {
      const expCount = await InterviewExperience.countDocuments({ companyId: company._id, status: 'approved' });
      const guideCount = (company.technicalQuestions?.length || 0) + (company.hrTips?.length || 0);
      return {
        ...company,
        experienceCount: expCount,
        guideCount
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/interview-prep/companies/:id
// @desc    Get specific company prep details
// @access  Private
router.get('/companies/:id', auth, async (req, res) => {
  try {
    const company = await CompanyPrep.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }
    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/interview-prep/companies/:id/experiences
// @desc    Get approved experiences for a company
// @access  Private
router.get('/companies/:id/experiences', auth, async (req, res) => {
  try {
    const experiences = await InterviewExperience.find({ companyId: req.params.id, status: 'approved' })
      .populate('author', 'full_name username avatarUrl')
      .sort({ createdAt: -1 });
    res.json(experiences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/interview-prep/companies/:id/experiences
// @desc    Submit a new interview experience
// @access  Private
router.post('/companies/:id/experiences', auth, async (req, res) => {
  try {
    const { title, outcome, rounds } = req.body;
    const newExperience = new InterviewExperience({
      companyId: req.params.id,
      author: req.user.id,
      title,
      outcome,
      rounds,
      status: 'approved' // auto-approve for now
    });
    const saved = await newExperience.save();
    
    // populate author before returning to immediately display
    await saved.populate('author', 'full_name username avatarUrl');
    res.json(saved);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/interview-prep/progress/:companyId
// @desc    Get user's progress for a company
// @access  Private
router.get('/progress/:companyId', auth, async (req, res) => {
  try {
    let progress = await InterviewPrepProgress.findOne({ user_id: req.user.id, company_id: req.params.companyId });
    if (!progress) {
      progress = { reviewed_tech: [], reviewed_hr: [] };
    }
    res.json(progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/interview-prep/progress/:companyId/toggle
// @desc    Toggle a question/tip as reviewed
// @access  Private
router.post('/progress/:companyId/toggle', auth, async (req, res) => {
  try {
    const { type, questionId, reviewed } = req.body; // type: 'tech' or 'hr'
    let progress = await InterviewPrepProgress.findOne({ user_id: req.user.id, company_id: req.params.companyId });
    
    if (!progress) {
      progress = new InterviewPrepProgress({ 
        user_id: req.user.id, 
        company_id: req.params.companyId,
        reviewed_tech: [],
        reviewed_hr: []
      });
    }

    const arrName = type === 'tech' ? 'reviewed_tech' : 'reviewed_hr';
    
    if (reviewed) {
      if (!progress[arrName].includes(questionId)) {
        progress[arrName].push(questionId);
      }
    } else {
      progress[arrName] = progress[arrName].filter(id => id.toString() !== questionId.toString());
    }

    await progress.save();
    res.json({ reviewed_tech: progress.reviewed_tech, reviewed_hr: progress.reviewed_hr });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
