const Parser = require('rss-parser');
const stringSimilarity = require('string-similarity');
const NewsArticle = require('../models/NewsArticle');
const NewsIngestionLog = require('../models/NewsIngestionLog');
const newsCache = require('../utils/newsCache');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

const RSS_FEEDS = [
  { url: 'https://techcrunch.com/feed/', sourceName: 'TechCrunch' },
  { url: 'https://www.wired.com/feed/rss', sourceName: 'Wired' },
  { url: 'https://venturebeat.com/category/ai/feed/', sourceName: 'VentureBeat' },
  { url: 'https://www.artificialintelligence-news.com/feed/', sourceName: 'AI News' }
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=800', // tech code
  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800', // circuit board
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800', // cyber security
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800'  // binary matrix
];

const SPAM_KEYWORDS = ['buy now', 'cheap', 'casino', 'discount', 'viagra', 'seo services'];

const KEYWORDS_MAP = {
  'AI': ['ai', 'artificial intelligence', 'machine learning', 'openai', 'chatgpt', 'llm', 'deep learning', 'neural network', 'gemini', 'claude'],
  'Startups': ['startup', 'funding', 'venture capital', 'founder', 'seed round', 'series a', 'incubator', 'y combinator'],
  'Big Tech': ['apple', 'google', 'meta', 'amazon', 'microsoft', 'netflix', 'facebook'],
  'Research': ['research', 'study', 'science', 'scientist', 'university', 'breakthrough', 'paper', 'journal'],
  'Gadgets': ['gadget', 'device', 'hardware', 'phone', 'laptop', 'iphone', 'macbook', 'wearable']
};

function assignTagsAndCategory(title, summary) {
  const text = `${title} ${summary}`.toLowerCase();
  
  let category = 'Big Tech'; // Default fallback
  let tags = new Set();
  
  let highestMatchCount = 0;

  for (const [cat, keywords] of Object.entries(KEYWORDS_MAP)) {
    let matchCount = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matchCount++;
        tags.add(kw);
      }
    }
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      category = cat;
    }
  }

  // Ensure tags are unique and limit to top 5
  return { category, tags: Array.from(tags).slice(0, 5) };
}

function extractImage(item) {
  // Check enclosure
  if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
    return item.enclosure.url;
  }
  // Check media:content
  if (item.mediaContent && item.mediaContent['$'] && item.mediaContent['$'].url) {
    return item.mediaContent['$'].url;
  }
  // Check inside content:encoded (HTML string)
  if (item.contentEncoded) {
    const match = item.contentEncoded.match(/<img[^>]+src="([^">]+)"/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Pick random fallback image based on title length hash
  const hash = item.title ? item.title.length : 0;
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

class NewsFetcherService {
  async fetchNews(io) {
    const startTime = Date.now();
    console.log('📰 Running automated news fetcher...');
    
    let metrics = {
      totalFetched: 0,
      totalAdded: 0,
      duplicatesSkipped: 0,
      spamRejected: 0
    };
    let errorLogs = [];
    let sourcesProcessed = [];

    // Pre-fetch recent articles for deduplication
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentArticles = await NewsArticle.find({ publishedAt: { $gte: fortyEightHoursAgo } }).select('title sourceLink');

    for (const feed of RSS_FEEDS) {
      sourcesProcessed.push(feed.sourceName);
      try {
        const feedData = await parser.parseURL(feed.url);
        metrics.totalFetched += feedData.items.length;

        for (const item of feedData.items) {
          try {
            const title = item.title ? item.title.trim() : '';
            const link = item.link ? item.link.trim() : '';
            let summary = item.contentSnippet || item.content || '';
            const pubDate = item.isoDate || item.pubDate || new Date().toISOString();

            if (!title || !link) continue;

            // 1. Quality/Spam Check
            if (title.length < 10 || summary.length < 30) {
               metrics.spamRejected++;
               continue;
            }
            
            const titleLower = title.toLowerCase();
            const isSpam = SPAM_KEYWORDS.some(spamWord => titleLower.includes(spamWord));
            if (isSpam) {
              metrics.spamRejected++;
              continue;
            }

            // Clean summary (remove extra spaces/newlines)
            summary = summary.replace(/\s+/g, ' ').trim();
            let contentSnippet = summary;
            if (summary.length > 250) {
              contentSnippet = summary.substring(0, 247) + '...';
            }

            // 2. Smart Deduplication
            let isDuplicate = false;
            for (const existing of recentArticles) {
              if (existing.sourceLink === link) {
                isDuplicate = true;
                break;
              }
              const similarity = stringSimilarity.compareTwoStrings(titleLower, existing.title.toLowerCase());
              if (similarity > 0.8) {
                isDuplicate = true;
                break;
              }
            }

            if (isDuplicate) {
              metrics.duplicatesSkipped++;
              continue;
            }

            // 3. Auto-tagging & Categorization
            const { category, tags } = assignTagsAndCategory(title, contentSnippet);

            // 4. Image Extraction
            const imageUrl = extractImage(item);

            // 5. Insert Article
            const article = new NewsArticle({
              title,
              summary: contentSnippet, // storing cleaned snippet in summary
              contentSnippet: contentSnippet, // same for now since we don't scrape full page
              sourceLink: link,
              sourceName: feed.sourceName,
              category,
              tags,
              imageUrl,
              publishedAt: new Date(pubDate),
              status: 'live',
              submissionType: 'automatic'
            });

            await article.save();
            recentArticles.push({ title: article.title, sourceLink: article.sourceLink }); // add to local memory cache to prevent dups within same run
            
            if (io) {
              io.emit('new_article', article);
            }
            
            metrics.totalAdded++;
          } catch (err) {
            if (err.code === 11000) {
              metrics.duplicatesSkipped++;
            } else {
              console.error(`Error saving fetched article [${item.title}]:`, err.message);
              errorLogs.push(`Save Error: ${err.message}`);
            }
          }
        }
      } catch (err) {
        console.error(`Error processing feed ${feed.url}:`, err.message);
        errorLogs.push(`Feed Error [${feed.sourceName}]: ${err.message}`);
      }
    }
    
    const durationMs = Date.now() - startTime;
    console.log(`📰 Automated news fetcher completed in ${durationMs}ms. Added ${metrics.totalAdded}, Skipped ${metrics.duplicatesSkipped}, Rejected ${metrics.spamRejected}.`);
    
    if (metrics.totalAdded > 0) {
      newsCache.del('feed_all_page1');
      newsCache.del('trending');
    }

    // Log the run
    try {
      await NewsIngestionLog.create({
        durationMs,
        sourcesProcessed,
        metrics,
        errorLogs
      });
    } catch (logErr) {
      console.error('Failed to save ingestion log:', logErr.message);
    }
  }
}

module.exports = new NewsFetcherService();
