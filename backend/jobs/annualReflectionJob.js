const User = require('../models/User');
const Resume = require('../models/Resume');
const ResumeVersion = require('../models/ResumeVersion');
const Notification = require('../models/Notification');
const geminiService = require('../services/geminiService');

exports.runAnnualReflections = async () => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // Find all users created on this day and month in previous years
    // and who haven't had a reflection this year
    const users = await User.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$createdAt" }, currentMonth + 1] },
          { $eq: [{ $dayOfMonth: "$createdAt" }, currentDay] },
          { $lt: [{ $year: "$createdAt" }, currentYear] }
        ]
      },
      $or: [
        { lastAnnualReflection: { $exists: false } },
        { lastAnnualReflection: null },
        { $expr: { $lt: [{ $year: "$lastAnnualReflection" }, currentYear] } }
      ]
    });

    for (const user of users) {
      try {
        const activeResumes = await Resume.find({ userId: user._id, isArchived: false });
        if (activeResumes.length === 0) continue;

        const mainResume = activeResumes[0];

        // Gather diff from VersionHistory
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(currentYear - 1);

        const history = await ResumeVersion.find({
          resumeId: mainResume._id,
          createdAt: { $gte: oneYearAgo }
        }).sort({ createdAt: 1 });

        let prompt = `You are a career coach doing an annual reflection for a user.
        They joined ${currentYear - user.createdAt.getFullYear()} years ago today.
        Summarize their growth over the past year in 2-3 short, encouraging sentences based on these version history checkpoints:
        History: ${JSON.stringify(history.map(h => ({ changes: h.changes, score: h.snapshot?.healthCheckScore })), null, 2)}
        Current Data: ${JSON.stringify({ skills: mainResume.skills, experience: mainResume.experience })}
        Suggest a specific section they might want to update (e.g., "It looks like you haven't added a new project recently.").
        Keep it brief and actionable.`;

        let summary = "Happy Anniversary! Take a moment to review and update your resume.";
        if (history.length > 0) {
          try {
            // Using standard gemini direct call for brevity in the job
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            summary = (await result.response).text().trim();
          } catch (e) {
             console.error("Gemini err in reflection:", e);
          }
        }

        const notif = new Notification({
          user: user._id,
          type: 'annual_reflection',
          title: 'Your Annual Career Reflection',
          message: summary,
          link: `/resume/builder/${mainResume._id}` // They can open the modal from the dashboard or editor
        });
        await notif.save();

        user.lastAnnualReflection = new Date();
        await user.save();
      } catch (e) {
        console.error(`Error processing reflection for user ${user._id}:`, e);
      }
    }
  } catch (error) {
    console.error('Error in annualReflectionJob:', error);
  }
};
