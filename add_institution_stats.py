import os

file_path = "backend/routes/institutions.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "Resume" not in content:
    content = content.replace("const MentorBooking = require('../models/MentorBooking');", "const MentorBooking = require('../models/MentorBooking');\nconst Resume = require('../models/Resume');")

new_route = """
// Institutional Resume Review Tools (Phase 6)
router.get('/:id/resumes/stats', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.institutionId || admin.institutionId.toString() !== req.params.id) {
      if (admin.role !== 'admin') { // Super admin can bypass
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Find all users belonging to this institution
    const students = await User.find({ institutionId: req.params.id, tier: 'pro' }).select('_id');
    const studentIds = students.map(s => s._id);

    // Aggregate resume stats for these students
    const resumes = await Resume.find({ user_id: { $in: studentIds }, 'atsScore.score': { $gt: 0 } });
    
    let totalScore = 0;
    let weaknessCounts = {};

    resumes.forEach(r => {
      totalScore += r.atsScore.score;
      if (r.atsScore.tips) {
        r.atsScore.tips.forEach(tip => {
          if (tip.severity === 'high') {
            weaknessCounts[tip.issue] = (weaknessCounts[tip.issue] || 0) + 1;
          }
        });
      }
    });

    const avgScore = resumes.length > 0 ? (totalScore / resumes.length).toFixed(1) : 0;
    const topWeaknesses = Object.entries(weaknessCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    res.json({
      studentCount: studentIds.length,
      resumesAnalyzed: resumes.length,
      avgAtsScore: avgScore,
      topWeaknesses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
"""

# Insert before // --- COHORTS ---
content = content.replace("// --- COHORTS ---", new_route + "\n// --- COHORTS ---")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated institutions.js with resume stats route")
