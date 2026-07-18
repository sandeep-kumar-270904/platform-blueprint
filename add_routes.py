import os

file_path = "backend/server.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = "app.use('/api/resumes', require('./routes/resumes'));"
replacement = "app.use('/api/resumes', require('./routes/resumes'));\napp.use('/api/portfolios', require('./routes/portfolios'));\napp.use('/api/resume-feedback', require('./routes/feedback'));"

content = content.replace(target, replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated server.js with portfolio and feedback routes")
