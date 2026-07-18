import os

file_path = "backend/routes/admin/resumes.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
if "PortfolioPage" not in content:
    content = content.replace("const GeminiUsage = require('../models/GeminiUsage');", "const GeminiUsage = require('../models/GeminiUsage');\nconst PortfolioPage = require('../../models/PortfolioPage');\nconst FeedbackRequest = require('../../models/FeedbackRequest');")

# Add to stats
target = "const totalCoverLetters = await CoverLetter.countDocuments();"
replacement = target + """
    const totalPortfolios = await PortfolioPage.countDocuments();
    const publishedPortfolios = await PortfolioPage.countDocuments({ isPublished: true });
    const portfolioViewsResult = await PortfolioPage.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
    ]);
    const portfolioViews = portfolioViewsResult.length > 0 ? portfolioViewsResult[0].totalViews : 0;

    const pendingFeedbackRequests = await FeedbackRequest.countDocuments({ requestedFrom: 'open', status: 'pending' });
    const inProgressFeedbackRequests = await FeedbackRequest.countDocuments({ requestedFrom: 'open', status: 'in_progress' });
"""

content = content.replace(target, replacement)

# Add to res.json
target2 = "totalCoverLetters,"
replacement2 = target2 + "\n      totalPortfolios,\n      publishedPortfolios,\n      portfolioViews,\n      pendingFeedbackRequests,\n      inProgressFeedbackRequests,"

content = content.replace(target2, replacement2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated admin stats with portfolios and feedback pool health")
