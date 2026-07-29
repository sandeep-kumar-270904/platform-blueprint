const Job = require('../models/Job');
const Resume = require('../models/Resume');
const geminiService = require('../services/geminiService');

exports.getSalaryInsightsAndNegotiation = async (req, res) => {
  try {
    const { resumeId, role, location, offerAmount } = req.body;
    
    // Fetch resume
    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    // 1. Fetch Salary Insights from Job Board
    // Find published jobs with matching role/location (simple matching for this implementation)
    // We only want jobs that have a defined salary
    const jobs = await Job.find({ 
      title: { $regex: new RegExp(role, 'i') },
      location: { $regex: new RegExp(location, 'i') },
      status: 'published',
      'salary.min': { $exists: true }
    });

    let marketData = null;
    if (jobs.length > 0) {
      let totalMin = 0;
      let totalMax = 0;
      let count = 0;
      jobs.forEach(j => {
        if (j.salary && j.salary.min) {
          totalMin += j.salary.min;
          totalMax += (j.salary.max || j.salary.min);
          count++;
        }
      });
      if (count > 0) {
        marketData = {
          avgMin: Math.round(totalMin / count),
          avgMax: Math.round(totalMax / count),
          dataPoints: count
        };
      }
    }

    // 2. Generate Negotiation Talking Points using Gemini
    // Focus on quantified impact bullets in the resume
    const resumeContext = JSON.stringify({
      experience: resume.experience,
      projects: resume.projects,
      skills: resume.skills
    });
    
    const talkingPoints = await geminiService.generateNegotiationPoints(resumeContext, role, offerAmount, marketData);

    // Everything is ephemeral, return directly
    res.json({
      marketData,
      talkingPoints
    });
  } catch (error) {
    console.error('Negotiation Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
