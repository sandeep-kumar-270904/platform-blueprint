import os

file_path = "backend/server.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

imports = """
const testimonialRoutes = require('./routes/testimonials');
const recommendationRoutes = require('./routes/recommendations');
const simulatorRoutes = require('./routes/careerSimulator');
"""

registrations = """
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/simulator', simulatorRoutes);
"""

if "testimonialRoutes" not in content:
    content = content.replace("const resumeRoutes = require('./routes/resumes');", "const resumeRoutes = require('./routes/resumes');\n" + imports)
    content = content.replace("app.use('/api/resumes', resumeRoutes);", "app.use('/api/resumes', resumeRoutes);\n" + registrations)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated server.js with Phase 9 routes")
