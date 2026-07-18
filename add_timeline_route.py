import os

file_path = "backend/routes/portfolios.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "router.get('/public/:slug/timeline'" not in content:
    content = content.replace("router.get('/public/:slug', portfolioController.getPublicPortfolio);", "router.get('/public/:slug', portfolioController.getPublicPortfolio);\nrouter.get('/public/:slug/timeline', portfolioController.getTimeline);")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added timeline to portfolios router")
