import os

file_path = "backend/routes/resumes.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure to put /discovery BEFORE /:id to prevent parameter matching issue
new_routes = """
// Phase 8 Routes
router.get('/discovery', resumeController.getDiscoveryFeed);
router.post('/trigger-health-nudges', resumeController.triggerHealthNudges);
router.post('/:id/discovery-view', resumeController.trackDiscoveryView);
router.get('/:id/completeness', resumeController.getCompleteness);
router.post('/:id/translate', resumeController.translateResume);
"""

if "router.get('/discovery'" not in content:
    content = content.replace("router.get('/', resumeController.getResumes);", "router.get('/', resumeController.getResumes);\n" + new_routes)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated resumes.js with Phase 8 routes")
