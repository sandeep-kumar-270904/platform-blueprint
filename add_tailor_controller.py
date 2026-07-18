import os

file_path = "backend/controllers/resumeController.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_func = """
const mongoose = require('mongoose');

// Tailor resume for a job
exports.tailorResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { jobId, jobDescription } = req.body;
    
    const originalResume = await Resume.findById(id);
    if (!originalResume || originalResume.user_id.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Clone the resume
    const tailoredResume = new Resume(originalResume.toObject());
    tailoredResume._id = new mongoose.Types.ObjectId();
    tailoredResume.isNew = true;
    tailoredResume.title = `${originalResume.title} (Tailored)`;
    tailoredResume.isDefault = false;
    tailoredResume.tailoredForJobId = jobId;
    
    // Get suggestions
    let descriptionToUse = jobDescription;
    if (jobId && !jobDescription) {
      const job = await Job.findById(jobId);
      if (job) descriptionToUse = job.description;
    }

    if (descriptionToUse) {
      const suggestions = await geminiService.generateTailoringSuggestions(originalResume, descriptionToUse, req.user.id);
      tailoredResume.tailorSuggestions = suggestions.map(s => ({ ...s, status: 'pending' }));
    }

    await tailoredResume.save();
    res.json(tailoredResume);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
"""

# Insert before exports.getResumes to avoid messing up bottom bracket if any
content = content.replace("exports.getResumes = async (req, res) => {", new_func + "\nexports.getResumes = async (req, res) => {")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added tailorResume to resumeController.js")
