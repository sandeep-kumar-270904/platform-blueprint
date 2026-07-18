import os

file_path = "src/App.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
if "SuccessStoriesPage" not in content:
    content = content.replace("import PortfolioEditorPage from \"./pages/PortfolioEditorPage\";", "import PortfolioEditorPage from \"./pages/PortfolioEditorPage\";\nimport SuccessStoriesPage from \"./pages/SuccessStoriesPage\";")

# Add Route
if "SuccessStoriesPage />" not in content:
    content = content.replace("<Route path=\"/portfolio/:slug\" element={<PublicPortfolioPage />} />", "<Route path=\"/portfolio/:slug\" element={<PublicPortfolioPage />} />\n          <Route path=\"/success-stories\" element={<SuccessStoriesPage />} />")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added SuccessStoriesPage to App.tsx")
