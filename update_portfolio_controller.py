import os

file_path = "backend/controllers/portfolioController.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add getTimeline method
timeline_method = """
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
"""

if "exports.getTimeline" not in content:
    content += "\n" + timeline_method

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated portfolioController.js with getTimeline")
