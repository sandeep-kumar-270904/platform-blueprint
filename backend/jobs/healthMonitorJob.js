const Resume = require('../models/Resume');
const Notification = require('../models/Notification');
const geminiService = require('../services/geminiService');

exports.runHealthChecks = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find resumes that are monitored, not archived, and either never checked or checked > 30 days ago
    const resumesToScore = await Resume.find({
      healthMonitoringEnabled: true,
      isArchived: false,
      $or: [
        { lastHealthCheck: { $exists: false } },
        { lastHealthCheck: null },
        { lastHealthCheck: { $lt: thirtyDaysAgo } }
      ]
    }).limit(10); // Batching to respect rate limits

    for (const resume of resumesToScore) {
      const resumeContext = {
        summary: resume.summary,
        experience: resume.experience,
        education: resume.education,
        skills: resume.skills
      };

      try {
        const atsResult = await geminiService.scoreResume(resumeContext, "General Application");
        
        const newScore = atsResult.score || 0;
        const oldScore = resume.healthCheckScore || newScore;

        if (resume.lastHealthCheck && Math.abs(newScore - oldScore) >= 5) {
          // Score shifted meaningfully
          const notif = new Notification({
            user: resume.user_id,
            type: 'alert',
            title: 'Resume Health Alert',
            message: `Your monitored resume "${resume.title}" ATS score shifted from ${oldScore} to ${newScore} due to industry best-practice updates.`,
            link: `/resume/builder/${resume._id}`
          });
          await notif.save();
        }

        resume.healthCheckScore = newScore;
        resume.lastHealthCheck = new Date();
        await resume.save();

        // simple delay to prevent thundering herd on API
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.error(`Error scoring resume ${resume._id} in health monitor:`, e);
      }
    }
  } catch (error) {
    console.error('Error in healthMonitorJob:', error);
  }
};
