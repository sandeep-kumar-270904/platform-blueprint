import os

file_path = "backend/routes/resumes.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "router.post('/:id/linkedin-export'" not in content:
    content = content.replace("router.post('/:id/tailor', resumeController.tailorResume);", "router.post('/:id/tailor', resumeController.tailorResume);\nrouter.post('/:id/linkedin-export', resumeController.exportLinkedIn);")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added linkedin-export to resumes router")
