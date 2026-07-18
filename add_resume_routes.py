import os

file_path = "backend/routes/resumes.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = "router.get('/', resumeController.getResumes);"
replacement = "router.get('/insights', resumeController.getInsights);\nrouter.get('/', resumeController.getResumes);"

content = content.replace(target, replacement)

target2 = "router.post('/:id/export', resumeController.trackExport);"
replacement2 = "router.post('/:id/export', resumeController.trackExport);\nrouter.get('/:id/export/:format', resumeController.exportFormat);"

content = content.replace(target2, replacement2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated resumes.js with insights and format export routes")
