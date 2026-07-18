import os

dashboard_path = "src/pages/ResumeDashboard.tsx"
with open(dashboard_path, "r", encoding="utf-8") as f:
    content = f.read()

panic_button = """
                  <div className="flex justify-between items-center mt-4">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/resume/builder/${r._id}`)}>Edit</Button>
                    <Button variant="destructive" size="sm" className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-200 dark:border-red-900" onClick={() => navigate(`/resume/panic/${r._id}`)}>
                      Panic Rebuild
                    </Button>
                  </div>
"""

# Replace the edit button in the resume card footer. Currently it looks like:
# <Button variant="outline" onClick={() => navigate(`/resume/builder/${r._id}`)}>Edit</Button>
if "Panic Rebuild" not in content:
    import re
    # We find where Edit button is and replace it with a flex container holding both Edit and Panic buttons
    content = re.sub(
        r'(<Button variant="outline" onClick=\{\(\) => navigate\(`/resume/builder/\$\{r\._id\}`\)\}>Edit</Button>)',
        r'<div className="flex gap-2 w-full">\n                        \1\n                        <Button variant="destructive" size="sm" className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-200 dark:border-red-900" onClick={() => navigate(`/resume/panic/${r._id}`)}>Panic Rebuild</Button>\n                      </div>',
        content
    )
    with open(dashboard_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated ResumeDashboard.tsx")

# Add to App.tsx
app_path = "src/App.tsx"
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

if "PanicModeWizard" not in app_content:
    app_content = app_content.replace(
        "import ResumeDashboard from './pages/ResumeDashboard';",
        "import ResumeDashboard from './pages/ResumeDashboard';\nimport PanicModeWizard from './pages/PanicModeWizard';"
    )
    app_content = app_content.replace(
        "<Route path=\"/resume/builder/:id\" element={<ResumeEditor />} />",
        "<Route path=\"/resume/builder/:id\" element={<ResumeEditor />} />\n          <Route path=\"/resume/panic/:id\" element={<PanicModeWizard />} />"
    )
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(app_content)
    print("Updated App.tsx")
