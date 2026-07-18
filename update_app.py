import os

app_path = "src/App.tsx"
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

imports_to_add = """import { FeedbackThreads } from "./pages/FeedbackThreads";
import { CampaignTracker } from "./pages/CampaignTracker";
import { PeerBenchmarking } from "./pages/PeerBenchmarking";
"""

if "FeedbackThreads" not in app_content:
    app_content = app_content.replace(
        'import ResumeEditorPage from "./pages/ResumeEditorPage";',
        'import ResumeEditorPage from "./pages/ResumeEditorPage";\n' + imports_to_add
    )

routes_to_add = """          <Route path="/resume-builder/feedback" element={<ProtectedRoute><FeedbackThreads /></ProtectedRoute>} />
          <Route path="/resume-builder/campaigns" element={<ProtectedRoute><CampaignTracker /></ProtectedRoute>} />
          <Route path="/resume-builder/benchmarking" element={<ProtectedRoute><PeerBenchmarking /></ProtectedRoute>} />
"""

if "/resume-builder/feedback" not in app_content:
    app_content = app_content.replace(
        '<Route path="/resume-builder/portfolio" element={<ProtectedRoute><PortfolioEditorPage /></ProtectedRoute>} />',
        '<Route path="/resume-builder/portfolio" element={<ProtectedRoute><PortfolioEditorPage /></ProtectedRoute>} />\n' + routes_to_add
    )

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_content)
print("Updated App.tsx")
