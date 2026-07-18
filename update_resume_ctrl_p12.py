import os

routes_path = "backend/routes/resumes.js"
with open(routes_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Panic Rebuild route
panic_route = """
// POST /api/resumes/:id/panic-rebuild
router.post('/:id/panic-rebuild', authMiddleware, resumeController.panicRebuild);
"""
if "panic-rebuild" not in content:
    content = content.replace("module.exports = router;", panic_route + "\nmodule.exports = router;")

# 2. Add Skill Clusters route
clusters_route = """
// GET /api/resumes/skills/clusters
router.get('/skills/clusters', authMiddleware, resumeController.getSkillClusters);
"""
if "skills/clusters" not in content:
    # Make sure we don't accidentally conflict with /:id by placing it before /:id (but after specific endpoints)
    content = content.replace("router.get('/:id', authMiddleware, resumeController.getResumeById);", clusters_route + "\nrouter.get('/:id', authMiddleware, resumeController.getResumeById);")

with open(routes_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated resumes.js routes")


controller_path = "backend/controllers/resumeController.js"
with open(controller_path, "r", encoding="utf-8") as f:
    ctrl_content = f.read()

controller_additions = """
const SkillCluster = require('../models/SkillCluster');
const CertificationRecord = require('../models/CertificationRecord');
const User = require('../models/User');

exports.panicRebuild = async (req, res) => {
  try {
    const { targetRole, focus, topSkills } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const resumeContext = {
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects
    };

    const restructuredData = await geminiService.panicRebuild(resumeContext, targetRole, focus, topSkills);

    const panicVariant = new Resume({
      ...resume.toObject(),
      _id: undefined,
      title: `[Panic Mode] ${targetRole} - ${resume.title}`,
      variantType: 'panic_mode',
      summary: restructuredData.summary,
      experience: restructuredData.experience || [],
      education: restructuredData.education || [],
      skills: restructuredData.skills || [],
      projects: restructuredData.projects || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await panicVariant.save();

    res.json(panicVariant);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSkillClusters = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('verifiedSkills');
    const certs = await CertificationRecord.find({ user: req.user.id, status: 'verified' });
    
    // Normalize user's verified items
    const userSkills = new Set([
      ...(user.verifiedSkills || []).map(s => s.toLowerCase()),
      ...certs.map(c => c.name.toLowerCase())
    ]);

    const allClusters = await SkillCluster.find();
    const unlocked = [];

    for (const cluster of allClusters) {
      let matchCount = 0;
      for (const reqTag of cluster.requiredTags) {
        if (userSkills.has(reqTag.toLowerCase())) {
          matchCount++;
        }
      }
      
      // If user has 3+ matching verified skills/certs for this cluster
      if (matchCount >= 3) {
        unlocked.push(cluster);
      }
    }

    res.json(unlocked);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
"""

if "exports.panicRebuild" not in ctrl_content:
    ctrl_content = ctrl_content.replace(
        "const Notification = require('../models/Notification');",
        "const Notification = require('../models/Notification');\n" + controller_additions
    )
    with open(controller_path, "w", encoding="utf-8") as f:
        f.write(ctrl_content)
    print("Updated resumeController.js")

