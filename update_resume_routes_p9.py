import os

file_path = "backend/routes/resumes.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

edit_route = """
router.post('/:id/edit-propose', resumeController.proposeResumeEdit);
"""

if "edit-propose" not in content:
    content = content.replace("module.exports = router;", edit_route + "\nmodule.exports = router;")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated resumes.js with edit-propose route")
