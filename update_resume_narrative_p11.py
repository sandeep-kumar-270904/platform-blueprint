import os

file_path = "backend/controllers/resumeController.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

narrative_func = """
exports.generateNarrative = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const narrative = await geminiService.generateNarrative({
      title: resume.title,
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      projects: resume.projects,
      skills: resume.skills
    });

    resume.narrativeDraft = narrative;
    await resume.save();

    res.json({ narrativeDraft: narrative });
  } catch (error) {
    console.error('Error generating narrative:', error);
    res.status(500).json({ message: 'Failed to generate narrative' });
  }
};
"""

if "exports.generateNarrative" not in content:
    content += "\n" + narrative_func
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated resumeController.js with generateNarrative")

# Also add to routes
routes_path = "backend/routes/resumes.js"
with open(routes_path, "r", encoding="utf-8") as f:
    r_content = f.read()

if "router.post('/:id/narrative'" not in r_content:
    r_content = r_content.replace(
        "module.exports = router;",
        "router.post('/:id/narrative', auth, resumeController.generateNarrative);\n\nmodule.exports = router;"
    )
    with open(routes_path, "w", encoding="utf-8") as f:
        f.write(r_content)
    print("Updated resumes.js routes with /:id/narrative")

