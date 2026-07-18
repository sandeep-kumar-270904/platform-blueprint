import os

file_path = "backend/controllers/resumeController.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will replace the getInsights method completely to include tailored stats.
new_func = """
// Career Insights Endpoint
exports.getInsights = async (req, res) => {
  try {
    const resumes = await Resume.find({ user_id: req.user.id });
    if (resumes.length === 0) return res.status(404).json({ message: 'No resumes found' });

    // 1. Gather all unique skills
    let userSkills = new Set();
    resumes.forEach(r => {
      (r.skills || []).forEach(group => {
        (group.items || []).forEach(skill => userSkills.add(skill.toLowerCase()));
      });
    });

    // 2. Gather skills from Jobs the user applied to
    // Use the correct reference field for Job on JobApplication, which is 'job'
    const applications = await JobApplication.find({ applicant: req.user.id }).populate('job').populate('resumeId');
    let requiredSkills = {};
    
    // Tailoring effectiveness tracking
    let tailoredAppsCount = 0;
    let tailoredAppsInterviewCount = 0;
    let untailoredAppsCount = 0;
    let untailoredAppsInterviewCount = 0;

    applications.forEach(app => {
      if (app.job && app.job.skills) {
        app.job.skills.forEach(skill => {
          const s = skill.toLowerCase();
          requiredSkills[s] = (requiredSkills[s] || 0) + 1;
        });
      }
      
      // Track tailoring effectiveness
      const isInterviewed = ['shortlisted', 'interview', 'offered', 'hired'].includes(app.status);
      const isTailored = app.resumeId && app.resumeId.tailoredForJobId && app.resumeId.tailoredForJobId.toString() === app.job._id.toString();
      
      if (isTailored) {
        tailoredAppsCount++;
        if (isInterviewed) tailoredAppsInterviewCount++;
      } else {
        untailoredAppsCount++;
        if (isInterviewed) untailoredAppsInterviewCount++;
      }
    });

    // 3. Find Gaps (skills required by applied jobs but missing in user's resumes)
    let gaps = [];
    for (const [skill, count] of Object.entries(requiredSkills)) {
      if (!userSkills.has(skill)) {
        gaps.push({ skill, demand: count });
      }
    }
    gaps.sort((a, b) => b.demand - a.demand);

    // 4. ATS Trend
    const atsTrend = resumes
      .filter(r => r.atsScore && r.atsScore.score > 0)
      .map(r => ({ date: r.atsScore.lastCalculatedAt || r.updated_at, score: r.atsScore.score }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 5. Ask Gemini for next steps
    const nextSteps = await geminiService.generateCareerNextSteps(gaps.slice(0, 5).map(g => g.skill), req.user.id);
    
    const tailoringEffectiveness = {
      tailored: {
        total: tailoredAppsCount,
        interviewed: tailoredAppsInterviewCount,
        rate: tailoredAppsCount > 0 ? (tailoredAppsInterviewCount / tailoredAppsCount) * 100 : 0
      },
      untailored: {
        total: untailoredAppsCount,
        interviewed: untailoredAppsInterviewCount,
        rate: untailoredAppsCount > 0 ? (untailoredAppsInterviewCount / untailoredAppsCount) * 100 : 0
      }
    };

    res.json({
      skillGaps: gaps,
      atsTrend,
      nextSteps,
      tailoringEffectiveness
    });
  } catch (error) {
    logger.error('Insights Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
"""

# We need to replace the existing getInsights block.
# Since it might be tricky to substring, let's use regex or find indices.
start_str = "// Career Insights Endpoint"
end_str = "// Export formats"

if start_str in content and end_str in content:
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    content = content[:start_idx] + new_func + "\n  " + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated getInsights to include tailoring effectiveness")
