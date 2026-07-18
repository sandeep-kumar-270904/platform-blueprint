import os

file_path = "backend/controllers/resumeController.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add User require if missing (JobBoard opt in check needs it)
if "const User = require('../models/User')" not in content:
    content = content.replace("const Resume = require('../models/Resume');", "const Resume = require('../models/Resume');\nconst User = require('../models/User');")
if "const Notification = require('../models/Notification')" not in content:
    content = content.replace("const User = require('../models/User');", "const User = require('../models/User');\nconst Notification = require('../models/Notification');")


new_methods = """
// Phase 8: Gamification / Completeness
exports.getCompleteness = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    let score = 0;
    const maxScore = 100;
    let missing = [];

    // Basic fields
    if (resume.personalInfo) {
      if (resume.personalInfo.name) score += 10; else missing.push('Name');
      if (resume.personalInfo.email) score += 10; else missing.push('Email');
      if (resume.personalInfo.phone) score += 5;
    } else {
      missing.push('Personal Info');
    }

    if (resume.summary) score += 15; else missing.push('Summary');

    if (resume.experience && resume.experience.length > 0) {
      score += 20;
      // Bonus for bullets
      let hasBullets = false;
      let hasMetrics = false;
      resume.experience.forEach(exp => {
        if (exp.description && exp.description.length > 10) hasBullets = true;
        if (/\\d+%|\\$\\d+|\\d+x/i.test(exp.description)) hasMetrics = true;
      });
      if (hasBullets) score += 10; else missing.push('Experience Descriptions');
      if (hasMetrics) score += 10; else missing.push('Quantified Metrics in Experience');
    } else {
      missing.push('Work Experience');
    }

    if (resume.education && resume.education.length > 0) score += 10; else missing.push('Education');
    if (resume.skills && resume.skills.length > 0) score += 10; else missing.push('Skills');

    score = Math.min(score, maxScore);

    res.json({ score, missing, badges: resume.gamificationBadges });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Phase 8: Translation
exports.translateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetLanguage } = req.body;
    
    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const resumeDataToTranslate = {
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      projects: resume.projects,
      skills: resume.skills
    };

    const translatedData = await geminiService.translateResume(resumeDataToTranslate, targetLanguage);

    const translatedResume = new Resume({
      user_id: req.user.id,
      title: `${resume.title} (${targetLanguage})`,
      personalInfo: resume.personalInfo,
      ...translatedData,
      language: targetLanguage,
      translatedFrom: resume._id,
      translationStatus: 'ai_translated',
      gamificationBadges: resume.gamificationBadges
    });

    await translatedResume.save();
    res.status(201).json(translatedResume);
  } catch (error) {
    console.error('Translation Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Phase 8: Employer Discovery Feed
exports.getDiscoveryFeed = async (req, res) => {
  try {
    // Only recruiters should access this
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized for discovery feed' });
    }

    // Find users who opted in to candidate search
    const users = await User.find({ 'careerVisibility.visibleToRecruiters': true }).select('_id');
    const userIds = users.map(u => u._id);

    // Find their best resume (either explicitly marked, or we just grab one per user)
    // For simplicity, we grab isDiscoveryResume = true OR isDefault = true
    const resumes = await Resume.find({
      user_id: { $in: userIds },
      $or: [{ isDiscoveryResume: true }, { isDefault: true }]
    })
    .populate('user_id', 'name email profilePicture')
    .sort('-updatedAt')
    .limit(50);

    // Filter to one per user
    const uniqueResumes = [];
    const seenUsers = new Set();
    for (const r of resumes) {
      if (!seenUsers.has(r.user_id._id.toString())) {
        uniqueResumes.push(r);
        seenUsers.add(r.user_id._id.toString());
      }
    }

    res.json(uniqueResumes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.trackDiscoveryView = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await Resume.findByIdAndUpdate(id, { $inc: { discoveryViews: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Phase 8: Health Nudges
exports.triggerHealthNudges = async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const staleResumes = await Resume.find({ updatedAt: { $lt: twoWeeksAgo } });
    const notifiedUsers = new Set();
    let count = 0;

    for (const resume of staleResumes) {
      if (!notifiedUsers.has(resume.user_id.toString())) {
        const notif = new Notification({
          user: resume.user_id,
          type: 'system_alert',
          title: 'Resume Health Check',
          message: `Your resume "${resume.title}" hasn't been updated in over 2 weeks. Keeping it fresh helps you stand out!`,
          link: `/resume/builder/${resume._id}`
        });
        await notif.save();
        notifiedUsers.add(resume.user_id.toString());
        count++;
      }
    }
    res.json({ message: `Triggered ${count} health nudges.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
"""

if "exports.getCompleteness" not in content:
    content += "\n" + new_methods

# Hook into saveResume for gamification
save_logic = """
    // Gamification Checks
    const user = await User.findById(req.user.id);
    let newBadges = [];
    if (!resume.gamificationBadges.includes('First Resume Complete') && resume.experience && resume.experience.length > 0 && resume.education && resume.education.length > 0) {
      resume.gamificationBadges.push('First Resume Complete');
      newBadges.push('First Resume Complete');
      if (user && !user.badges.find(b => b.badgeId === 'First Resume Complete')) {
        user.badges.push({ badgeId: 'First Resume Complete' });
        await user.save();
      }
    }
    if (!resume.gamificationBadges.includes('Added 3 Projects') && resume.projects && resume.projects.length >= 3) {
      resume.gamificationBadges.push('Added 3 Projects');
      newBadges.push('Added 3 Projects');
      if (user && !user.badges.find(b => b.badgeId === 'Added 3 Projects')) {
        user.badges.push({ badgeId: 'Added 3 Projects' });
        await user.save();
      }
    }
"""

if "Gamification Checks" not in content:
    content = content.replace("Object.assign(resume, updateData);", "Object.assign(resume, updateData);\n" + save_logic)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated resumeController.js with Phase 8 endpoints")
