import os

file_path = "backend/controllers/resumeController.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

edit_method = """
// Phase 9: AI Chat Editing
exports.proposeResumeEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const { instruction } = req.body;
    
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const resumeContext = {
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
      services: resume.services
    };

    const diff = await geminiService.proposeResumeEdit(resumeContext, instruction);
    res.json({ diff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
"""

if "exports.proposeResumeEdit" not in content:
    content += "\n" + edit_method

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added proposeResumeEdit to resumeController.js")
