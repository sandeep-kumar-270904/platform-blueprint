import os

def main():
    backend_dir = r"c:\Users\edhub\Desktop\Anti Gravity Projects\platform-blueprint\backend"
    
    # 1. Update newsFetcherService.js
    fetcher_path = os.path.join(backend_dir, "services", "newsFetcherService.js")
    with open(fetcher_path, 'r', encoding='utf-8') as f:
        fetcher_content = f.read()

    # We need to add readingTime and author parsing to the fetcher
    if "readingTime:" not in fetcher_content:
        # In the parsed items loop (RSS):
        fetcher_content = fetcher_content.replace(
            "const summary = item.contentSnippet || item.content || item.description || '';",
            "const summary = item.contentSnippet || item.content || item.description || '';\n      const author = item.creator || item.author || item['dc:creator'] || 'Unknown';\n      const readingTime = Math.max(1, Math.ceil((summary.split(' ').length + item.title.split(' ').length) / 200));"
        )
        fetcher_content = fetcher_content.replace(
            "category: config.category,",
            "category: config.category,\n          author: author,\n          readingTime: readingTime,"
        )

        # In the GNews mapping:
        fetcher_content = fetcher_content.replace(
            "const summary = article.description || article.content || '';",
            "const summary = article.description || article.content || '';\n        const author = article.source?.name || 'Unknown';\n        const readingTime = Math.max(1, Math.ceil((summary.split(' ').length + article.title.split(' ').length) / 200));"
        )
        fetcher_content = fetcher_content.replace(
            "sourceLink: article.url,",
            "sourceLink: article.url,\n          author: author,\n          readingTime: readingTime,"
        )
        
        with open(fetcher_path, 'w', encoding='utf-8') as f:
            f.write(fetcher_content)
            
    # 2. Update news.js
    news_route_path = os.path.join(backend_dir, "routes", "news.js")
    with open(news_route_path, 'r', encoding='utf-8') as f:
        news_content = f.read()
        
    if "const NewsAuditLog = require('../models/NewsAuditLog');" not in news_content:
        news_content = "const NewsAuditLog = require('../models/NewsAuditLog');\n" + news_content
        
    onboarding_route = """
// POST /api/news/onboarding-complete
router.post('/onboarding-complete', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.hasCompletedNewsOnboarding = true;
    
    // Also save their preferences if provided
    if (req.body.followedCategories || req.body.followedTags) {
      if (req.body.followedCategories) user.newsPreferences.followedCategories = req.body.followedCategories;
      if (req.body.followedTags) user.newsPreferences.followedTags = req.body.followedTags;
    }
    
    await user.save();
    res.json({ message: 'Onboarding complete', user: { hasCompletedNewsOnboarding: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
"""
    if "POST /api/news/onboarding-complete" not in news_content:
        news_content = news_content.replace("module.exports = router;", onboarding_route + "\nmodule.exports = router;")
        
    # Inject Audit logging into admin routes
    # Admin routes are in news.js, e.g., router.put('/:id/status', authMiddleware, adminAuth, ...)
    if "await NewsAuditLog.create" not in news_content:
        # Status update (approve/reject)
        news_content = news_content.replace(
            "article.status = req.body.status;\n    await article.save();",
            "article.status = req.body.status;\n    await article.save();\n    await NewsAuditLog.create({ adminId: req.user._id, action: req.body.status === 'live' ? 'approve' : 'reject', targetArticleId: article._id });"
        )
        # Feature update
        news_content = news_content.replace(
            "article.isFeatured = req.body.isFeatured;\n    await article.save();",
            "article.isFeatured = req.body.isFeatured;\n    await article.save();\n    await NewsAuditLog.create({ adminId: req.user._id, action: req.body.isFeatured ? 'feature' : 'unfeature', targetArticleId: article._id });"
        )
        # Delete
        news_content = news_content.replace(
            "await NewsArticle.findByIdAndDelete(req.params.id);",
            "await NewsArticle.findByIdAndDelete(req.params.id);\n    await NewsAuditLog.create({ adminId: req.user._id, action: 'delete', targetArticleId: req.params.id });"
        )
        
    with open(news_route_path, 'w', encoding='utf-8') as f:
        f.write(news_content)

    print("Updated newsFetcherService.js and news.js")

if __name__ == '__main__':
    main()
