import os
import re

# Update resumes.js
resumes_path = "backend/routes/resumes.js"
with open(resumes_path, "r", encoding="utf-8") as f:
    res_content = f.read()

new_res_routes = """
// Phase 10
router.get('/insights/benchmark', auth, resumeController.getIndustryBenchmark);
router.put('/:id/archive', auth, resumeController.archiveResume);
router.put('/:id/restore', auth, resumeController.unarchiveResume);
"""

if "archiveResume" not in res_content:
    res_content = res_content.replace("module.exports = router;", new_res_routes + "\nmodule.exports = router;")
    with open(resumes_path, "w", encoding="utf-8") as f:
        f.write(res_content)

# Update server.js
server_path = "backend/server.js"
with open(server_path, "r", encoding="utf-8") as f:
    srv_content = f.read()

new_srv_imports = """
const workshopsRouter = require('./routes/workshops');
const developerApiRouter = require('./routes/developerApi');
"""

new_srv_mounts = """
app.use('/api/workshops', workshopsRouter);
app.use('/api/dev', developerApiRouter);
"""

if "workshopsRouter" not in srv_content:
    srv_content = srv_content.replace("const resumesRouter = require('./routes/resumes');", "const resumesRouter = require('./routes/resumes');\n" + new_srv_imports)
    srv_content = srv_content.replace("app.use('/api/resumes', resumesRouter);", "app.use('/api/resumes', resumesRouter);\n" + new_srv_mounts)
    with open(server_path, "w", encoding="utf-8") as f:
        f.write(srv_content)

print("Updated resumes.js and server.js with Phase 10 routes")
