import os

routes_path = "backend/routes/quizzes.js"
with open(routes_path, "r", encoding="utf-8") as f:
    routes_content = f.read()

check_skill = """
// GET /api/quizzes/check-skill?skill=X
router.get('/check-skill', authMiddleware, async (req, res) => {
  try {
    const { skill } = req.query;
    if (!skill) return res.status(400).json({ message: 'Skill required' });
    
    // Check if any quiz category exactly matches (case-insensitive) the skill
    const quiz = await Quiz.findOne({ category: { $regex: new RegExp(`^${skill}$`, 'i') }, status: 'published' });
    if (quiz) {
      return res.json({ exists: true, quizId: quiz._id });
    }
    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
"""

if "router.get('/check-skill'" not in routes_content:
    routes_content = routes_content.replace(
        "module.exports = router;",
        check_skill + "\nmodule.exports = router;"
    )
    with open(routes_path, "w", encoding="utf-8") as f:
        f.write(routes_content)
    print("Updated quizzes.js routes")

