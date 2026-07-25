import os
import re

def main():
    backend_dir = r"c:\Users\edhub\Desktop\Anti Gravity Projects\platform-blueprint\backend"
    
    # 1. Update Models
    article_path = os.path.join(backend_dir, "models", "NewsArticle.js")
    with open(article_path, 'r', encoding='utf-8') as f:
        article_content = f.read()

    if "aiModerationScore:" not in article_content:
        article_content = article_content.replace(
            "sourceCredibility: {\n    type: String,\n    default: 'Independent Publication'\n  }",
            "sourceCredibility: {\n    type: String,\n    default: 'Independent Publication'\n  },\n  aiModerationScore: {\n    flagged: { type: Boolean, default: false },\n    reason: { type: String }\n  }"
        )
        with open(article_path, 'w', encoding='utf-8') as f:
            f.write(article_content)

    comment_path = os.path.join(backend_dir, "models", "NewsComment.js")
    with open(comment_path, 'r', encoding='utf-8') as f:
        comment_content = f.read()
        
    if "aiModerationScore:" not in comment_content:
        comment_content = comment_content.replace(
            "parentCommentId: {\n    type: mongoose.Schema.Types.ObjectId,\n    ref: 'NewsComment',\n    default: null\n  },",
            "parentCommentId: {\n    type: mongoose.Schema.Types.ObjectId,\n    ref: 'NewsComment',\n    default: null\n  },\n  aiModerationScore: {\n    flagged: { type: Boolean, default: false },\n    reason: { type: String }\n  },"
        )
        with open(comment_path, 'w', encoding='utf-8') as f:
            f.write(comment_content)

    # 2. Update Routes
    news_route_path = os.path.join(backend_dir, "routes", "news.js")
    with open(news_route_path, 'r', encoding='utf-8') as f:
        news_content = f.read()

    stats_and_suggest_routes = """
// Simulated AI Moderation Helper
const assessModeration = async (text) => {
  const t = text.toLowerCase();
  if (t.includes('spam') || t.includes('viagra') || t.includes('crypto scam')) {
    return { flagged: true, reason: 'Suspected spam/scam content detected by AI' };
  }
  if (t.includes('hate') || t.includes('kill')) {
    return { flagged: true, reason: 'Suspected abusive language detected by AI' };
  }
  return { flagged: false };
};

// GET /api/news/me/stats
router.get('/me/stats', authMiddleware, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const views = await NewsViewEvent.find({ userId: req.user._id });
    
    const readThisWeek = views.filter(v => v.viewedAt >= sevenDaysAgo).length;
    const readThisMonth = views.filter(v => v.viewedAt >= thirtyDaysAgo).length;

    // Aggregate top categories
    const pipeline = [
      { $match: { userId: req.user._id } },
      {
        $lookup: {
          from: 'newsarticles',
          localField: 'articleId',
          foreignField: '_id',
          as: 'article'
        }
      },
      { $unwind: '$article' },
      { $group: { _id: '$article.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ];
    
    const topCatAgg = await NewsViewEvent.aggregate(pipeline);
    const topCategory = topCatAgg.length > 0 ? topCatAgg[0]._id : 'None';
    
    const user = await User.findById(req.user._id);

    res.json({
      readThisWeek,
      readThisMonth,
      topCategory,
      streak: user.newsStreak || { current: 0, longest: 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/:id/collection-suggestion
router.get('/:id/collection-suggestion', authMiddleware, async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    if (!article || !article.tags || article.tags.length === 0) {
      return res.json({ suggestedCollectionId: null });
    }

    const collections = await NewsCollection.find({ 
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }] 
    });
    
    if (collections.length === 0) return res.json({ suggestedCollectionId: null });

    let bestCollectionId = null;
    let maxOverlap = 0;

    for (const col of collections) {
      const bookmarks = await NewsBookmark.find({ collectionId: col._id }).populate('articleId');
      let overlapCount = 0;
      
      bookmarks.forEach(bm => {
        if (bm.articleId && bm.articleId.tags) {
           bm.articleId.tags.forEach(tag => {
             if (article.tags.includes(tag)) overlapCount++;
           });
        }
      });
      
      if (overlapCount > maxOverlap) {
        maxOverlap = overlapCount;
        bestCollectionId = col._id;
      }
    }

    res.json({ suggestedCollectionId: bestCollectionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
"""

    if "GET /api/news/me/stats" not in news_content:
        news_content = news_content.replace("// GET /api/news/morning-brief", stats_and_suggest_routes + "\n// GET /api/news/morning-brief")

    # Update POST /api/news
    if "const article = new NewsArticle({" in news_content:
        news_content = news_content.replace(
            "const article = new NewsArticle({",
            "const modResult = await assessModeration(title + ' ' + summary);\n    const article = new NewsArticle({\n      aiModerationScore: modResult,"
        )
        
    # Update POST /api/news/:id/comments
    if "const comment = new NewsComment({" in news_content:
        news_content = news_content.replace(
            "const comment = new NewsComment({",
            "const modResult = await assessModeration(text);\n    const comment = new NewsComment({\n      aiModerationScore: modResult,"
        )

    with open(news_route_path, 'w', encoding='utf-8') as f:
        f.write(news_content)
        
    print("Updated Phase 9 models and routes")

if __name__ == '__main__':
    main()
