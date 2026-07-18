import os

file_path = "src/App.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
if "InstitutionResumeStats" not in content:
    content = content.replace("import SuccessStoriesPage from \"./pages/SuccessStoriesPage\";", "import SuccessStoriesPage from \"./pages/SuccessStoriesPage\";\nimport InstitutionResumeStats from \"./pages/InstitutionResumeStats\";")

# Add Route
if "InstitutionResumeStats />" not in content:
    content = content.replace("<Route path=\"/success-stories\" element={<SuccessStoriesPage />} />", "<Route path=\"/success-stories\" element={<SuccessStoriesPage />} />\n          <Route path=\"/institution-dashboard\" element={<InstitutionResumeStats />} />")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added InstitutionResumeStats to App.tsx")
