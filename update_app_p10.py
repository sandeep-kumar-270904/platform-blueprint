import os

file_path = "src/App.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

imports = """
import { ResumeWorkshops } from './pages/ResumeWorkshops';
import { WorkshopSession } from './pages/WorkshopSession';
import { DeveloperSettings } from './pages/DeveloperSettings';
"""

routes = """
        <Route path="/resume/workshops" element={<ResumeWorkshops />} />
        <Route path="/resume/workshops/:id" element={<WorkshopSession />} />
        <Route path="/resume/developer" element={<DeveloperSettings />} />
"""

if "ResumeWorkshops" not in content:
    content = content.replace("import { CareerInsightsPage } from './pages/CareerInsightsPage';", "import { CareerInsightsPage } from './pages/CareerInsightsPage';\n" + imports)
    content = content.replace("</Routes>", routes + "      </Routes>")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated App.tsx with Phase 10 routes")
