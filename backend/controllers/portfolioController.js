const PortfolioPage = require('../models/PortfolioPage');
const Resume = require('../models/Resume');

exports.getMyPortfolio = async (req, res) => {
  try {
    let portfolio = await PortfolioPage.findOne({ userId: req.user.id });
    if (!portfolio) {
      // Return empty 404 or create default? 
      // Better to return 404 and let frontend create
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createOrUpdatePortfolio = async (req, res) => {
  try {
    const { slug, resumeId, theme, syncMode, sections, customBlocks, isPublished } = req.body;
    
    // Check if slug is taken by another user
    const existingSlug = await PortfolioPage.findOne({ slug });
    if (existingSlug && existingSlug.userId.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Slug is already taken' });
    }

    let portfolio = await PortfolioPage.findOne({ userId: req.user.id });
    if (portfolio) {
      portfolio.slug = slug;
      portfolio.resumeId = resumeId;
      portfolio.theme = theme;
      portfolio.syncMode = syncMode;
      portfolio.sections = sections;
      portfolio.customBlocks = customBlocks;
      if (isPublished !== undefined) {
        if (isPublished && !portfolio.isPublished) portfolio.publishedAt = new Date();
        portfolio.isPublished = isPublished;
      }
      await portfolio.save();
    } else {
      portfolio = new PortfolioPage({
        userId: req.user.id,
        slug, resumeId, theme, syncMode, sections, customBlocks,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null
      });
      await portfolio.save();
    }
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPublicPortfolio = async (req, res) => {
  try {
    const { slug } = req.params;
    const portfolio = await PortfolioPage.findOne({ slug, isPublished: true });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found or not published' });
    }

    // Increment view count
    portfolio.viewCount += 1;
    await portfolio.save();

    let portfolioData = portfolio.toObject();

    // If syncMode is 'sync-from-resume' and resumeId exists, fetch resume data
    if (portfolio.syncMode === 'sync-from-resume' && portfolio.resumeId) {
      const resume = await Resume.findById(portfolio.resumeId);
      if (resume) {
        portfolioData.syncedResume = resume.toObject();
      }
    }

    // Return the portfolio along with potentially synced resume data
    res.json(portfolioData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Achievement Timeline (Phase 7)
exports.getTimeline = async (req, res) => {
  try {
    const { slug } = req.params;
    const portfolio = await PortfolioPage.findOne({ slug });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
    if (!portfolio.isPublic && (!req.user || req.user.id !== portfolio.user_id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const userId = portfolio.user_id;
    let timeline = [];

    // 1. Resume Data (Experience, Education)
    // For simplicity, we just grab the first resume if it exists or use the linked resume
    // If portfolio has sections, we can use that, but portfolio just renders a resume directly in some cases
    const Resume = require('../models/Resume');
    const resumes = await Resume.find({ user_id: userId, isDefault: true }).limit(1);
    if (resumes.length > 0) {
      const resume = resumes[0];
      (resume.experience || []).forEach(exp => {
        if (exp.startDate) {
          timeline.push({
            type: 'experience',
            title: `${exp.role} at ${exp.company}`,
            date: exp.startDate,
            endDate: exp.endDate,
            description: exp.description || ''
          });
        }
      });
      (resume.education || []).forEach(edu => {
        if (edu.startDate) {
          timeline.push({
            type: 'education',
            title: `${edu.degree} from ${edu.institution}`,
            date: edu.startDate,
            endDate: edu.endDate,
            description: edu.description || ''
          });
        }
      });
    }

    // 2. Certifications
    try {
      const CertificationRecord = require('../models/CertificationRecord');
      const certs = await CertificationRecord.find({ userId });
      certs.forEach(cert => {
        timeline.push({
          type: 'certification',
          title: `Earned ${cert.name} (${cert.issuer})`,
          date: cert.issueDate,
          description: cert.verificationStatus === 'platform_verified' ? 'Verified by Platform' : ''
        });
      });
    } catch (e) {
      console.warn("Certifications not loaded", e.message);
    }

    // 3. Quizzes (Platform Native)
    try {
      const QuizAttempt = require('../models/QuizAttempt');
      const quizzes = await QuizAttempt.find({ user: userId, status: 'completed' }).populate('quiz');
      quizzes.forEach(q => {
        if (q.percentageScore >= 80) { // Only show good scores
          timeline.push({
            type: 'quiz_achievement',
            title: `Passed ${q.quiz ? q.quiz.title : 'Quiz'} with ${q.percentageScore}%`,
            date: q.completedAt,
            description: 'Platform Quiz'
          });
        }
      });
    } catch (e) {
      console.warn("Quizzes not loaded", e.message);
    }

    // 4. Sort chronologically (descending)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(timeline);
  } catch (error) {
    console.error('Timeline Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
