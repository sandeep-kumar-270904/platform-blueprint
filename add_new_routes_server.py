import os

file_path = "backend/server.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add routers
if "require('./routes/interviews')" not in content:
    content = content.replace("app.use('/api/resumes', require('./routes/resumes'));", "app.use('/api/resumes', require('./routes/resumes'));\napp.use('/api/interviews', require('./routes/interviews'));\napp.use('/api/negotiation', require('./routes/negotiation'));")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added interviews and negotiation routes to server.js")
