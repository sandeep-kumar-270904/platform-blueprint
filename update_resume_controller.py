import os

file_path = "backend/controllers/resumeController.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add InterviewSession require
if "const InterviewSession" not in content:
    content = content.replace("const JobApplication = require('../models/JobApplication');", "const JobApplication = require('../models/JobApplication');\nconst InterviewSession = require('../models/InterviewSession');")

# 2. Add Interview Readiness logic to getInsights
interview_logic = """
    // 6. Interview Readiness (Phase 7)
    const interviewSessions = await InterviewSession.find({ userId: req.user.id, status: 'completed' });
    let interviewReadiness = { sessionsCompleted: interviewSessions.length, commonImprovementAreas: [] };
    
    if (interviewSessions.length > 0) {
      let areaFreq = {};
      interviewSessions.forEach(session => {
        session.questions.forEach(q => {
          if (q.aiEvaluation && q.aiEvaluation.improvementAreas) {
            q.aiEvaluation.improvementAreas.forEach(area => {
              // Simple normalization for grouping similar areas (very basic)
              const key = area.toLowerCase().substring(0, 30);
              areaFreq[area] = (areaFreq[area] || 0) + 1;
            });
          }
        });
      });
      // Sort and take top 3
      interviewReadiness.commonImprovementAreas = Object.entries(areaFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
    }
"""

if "interviewReadiness" not in content:
    # Insert before tailoringEffectiveness
    content = content.replace("const tailoringEffectiveness = {", interview_logic + "\n    const tailoringEffectiveness = {")
    content = content.replace("nextSteps,", "nextSteps,\n      interviewReadiness,")

# 3. Add exportLinkedIn method
export_linkedin_method = """
// LinkedIn Export (Phase 7)
exports.exportLinkedIn = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const resumeContext = JSON.stringify({
      experience: resume.experience,
      projects: resume.projects,
      skills: resume.skills
    });
    
    const linkedinData = await geminiService.exportLinkedInSummary(resumeContext);
    res.json(linkedinData);
  } catch (error) {
    logger.error('LinkedIn Export Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
"""

if "exports.exportLinkedIn" not in content:
    content += "\n" + export_linkedin_method

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated resumeController.js with interview readiness and linkedin export")
