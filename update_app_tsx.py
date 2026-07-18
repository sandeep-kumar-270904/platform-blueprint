import os

file_path = "src/App.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

import_target = 'import ResumeEditorPage from "./pages/ResumeEditorPage";'
import_repl = 'import ResumeEditorPage from "./pages/ResumeEditorPage";\nimport PortfolioEditorPage from "./pages/PortfolioEditorPage";\nimport PublicPortfolioPage from "./pages/PublicPortfolioPage";\nimport CareerInsightsPage from "./pages/CareerInsightsPage";'

content = content.replace(import_target, import_repl)

route_target = '<Route path="/resume-builder/editor/:id" element={<ProtectedRoute><ResumeEditorPage /></ProtectedRoute>} />'
route_repl = route_target + '\n            <Route path="/resume-builder/portfolio" element={<ProtectedRoute><PortfolioEditorPage /></ProtectedRoute>} />\n            <Route path="/resume-builder/insights" element={<ProtectedRoute><CareerInsightsPage /></ProtectedRoute>} />\n            <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />'

content = content.replace(route_target, route_repl)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated App.tsx with new routes")
