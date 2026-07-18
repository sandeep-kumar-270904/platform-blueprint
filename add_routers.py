import os

file_path = "backend/server.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = "const resumesRouter = require('./routes/resumes');"
replacement = """const resumesRouter = require('./routes/resumes');
const certificationsRouter = require('./routes/certifications');
const successStoriesRouter = require('./routes/successStories');"""

content = content.replace(target, replacement)

target2 = "app.use('/api/resumes', resumesRouter);"
replacement2 = """app.use('/api/resumes', resumesRouter);
app.use('/api/certifications', certificationsRouter);
app.use('/api/success-stories', successStoriesRouter);"""

content = content.replace(target2, replacement2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Wired up certifications and successStories routers")
