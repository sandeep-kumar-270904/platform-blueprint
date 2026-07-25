const Parser = require('rss-parser');
const stringSimilarity = require('string-similarity');
const NewsArticle = require('../models/NewsArticle');
const claudeService = require('./claudeService');

async function generateAiSummaryForArticle(title, sourceLink, summary) {
  try {
    return await claudeService.generateNewsSummary(title, sourceLink, summary);
  } catch (err) {
    console.error('AI Summary failed for', title, err.message);
    return null;
  }
}

const NewsIngestionLog = require('../models/NewsIngestionLog');
const NewsSourceHealth = require('../models/NewsSourceHealth');
const newsCache = require('../utils/newsCache');
const notificationService = require('../services/notificationService');
const User = require('../models/User');
const NEWS_SOURCES = require('../config/newsSources');
const axios = require('axios'); // For API calls

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

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
  'Big Tech': ['apple', 'google', 'meta', 'amazon', 'microsoft', 'netflix', 'facebook', 'twitter', 'x'],
  'Research': ['research', 'study', 'science', 'scientist', 'university', 'breakthrough', 'paper', 'journal'],
  'Gadgets': ['gadget', 'device', 'hardware', 'phone', 'laptop', 'iphone', 'macbook', 'wearable']
};

function assignTagsAndCategory(title, summary, defaultCategory = 'Big Tech') {
  const text = `${title} ${summary}`.toLowerCase();
  
  let category = defaultCategory; 
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

  return { category, tags: Array.from(tags).slice(0, 5) };
}

function extractImage(item) {
  if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
    return item.enclosure.url;
  }
  if (item.mediaContent && item.mediaContent['$'] && item.mediaContent['$'].url) {
    return item.mediaContent['$'].url;
  }
  if (item.contentEncoded) {
    const match = item.contentEncoded.match(/<img[^>]+src="([^">]+)"/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  const hash = item.title ? item.title.length : 0;
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

class NewsFetcherService {
  async fetchNews(io) {
    const startTime = Date.now();
    console.log('dY" Running automated news fetcher...');
    
    let metrics = {
      totalFetched: 0,
      totalAdded: 0,
      duplicatesSkipped: 0,
      spamRejected: 0
    };
    let errorLogs = [];
    let sourcesProcessed = [];

    // Pre-fetch recent articles for cross-source deduplication
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentArticles = await NewsArticle.find({ publishedAt: { $gte: fortyEightHoursAgo } }).select('title sourceLink');

    for (const source of NEWS_SOURCES) {
      sourcesProcessed.push(source.name);
      let sourceSuccess = true;
      let sourceError = null;
      let articlesAddedForSource = 0;

      try {
        let items = [];

        if (source.type === 'rss') {
          const feedData = await parser.parseURL(source.url);
          items = feedData.items.map(item => ({
            title: item.title ? item.title.trim() : '',
            link: item.link ? item.link.trim() : '',
            summary: item.contentSnippet || item.content || '',
            pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
            imageUrl: extractImage(item)
          }));
        } else if (source.type === 'api' && source.name === 'NewsAPI') {
          if (!process.env.NEWS_API_KEY) {
            console.warn('NEWS_API_KEY is not set. Skipping NewsAPI ingestion.');
            continue;
          }
          const apiUrl = `https://newsapi.org/v2/everything?q=AI OR startup OR technology&language=en&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;
          const response = await axios.get(apiUrl);
          
          if (response.data && response.data.articles) {
            items = response.data.articles.map(article => ({
              title: article.title || '',
              link: article.url || '',
              summary: article.description || '',
              pubDate: article.publishedAt || new Date().toISOString(),
              imageUrl: article.urlToImage || FALLBACK_IMAGES[(article.title ? article.title.length : 0) % FALLBACK_IMAGES.length]
            }));
          }
        }

        metrics.totalFetched += items.length;

        for (const item of items) {
          try {
            if (!item.title || !item.link) continue;
            
            // Exclude "Removed" or weird API bugs
            if (item.title === '[Removed]') continue;

            // 1. Quality/Spam Check
            if (item.title.length < 10 || item.summary.length < 30) {
               metrics.spamRejected++;
               continue;
            }
            
            const titleLower = item.title.toLowerCase();
            const isSpam = SPAM_KEYWORDS.some(spamWord => titleLower.includes(spamWord));
            if (isSpam) {
              metrics.spamRejected++;
              continue;
            }

            // Clean summary
            let summary = item.summary.replace(/\\s+/g, ' ').trim();
            let contentSnippet = summary;
            if (summary.length > 250) {
              contentSnippet = summary.substring(0, 247) + '...';
            }

            // 2. Cross-Source Smart Deduplication
            let isDuplicate = false;
            let needsUpdate = false;
            let existingDoc = null;
            
            for (const existing of recentArticles) {
              if (existing.sourceLink === item.link) {
                isDuplicate = true;
                if (existing.title !== item.title || existing.summary !== summary) {
                  needsUpdate = true;
                  existingDoc = existing;
                }
                break;
              }
              const similarity = stringSimilarity.compareTwoStrings(titleLower, existing.title.toLowerCase());
              if (similarity > 0.8) {
                isDuplicate = true;
                break;
              }
            }

            if (isDuplicate && !needsUpdate) {
              metrics.duplicatesSkipped++;
              continue;
            }
            
            if (needsUpdate && existingDoc) {
              const versionObj = {
                updatedAt: new Date(),
                changes: `Title/Summary updated`
              };
              await NewsArticle.findByIdAndUpdate(existingDoc._id, {
                $set: { title: item.title, summary: summary },
                $push: { versions: versionObj }
              });
              metrics.duplicatesSkipped++; // Technically updated, but skip insert
              continue;
            }

            // 3. Auto-tagging & Categorization (using default from config)
            const { category, tags } = assignTagsAndCategory(item.title, contentSnippet, source.defaultCategory);

            // 4. Insert Article
            const article = new NewsArticle({
              title: item.title,
              summary: contentSnippet,
              contentSnippet: contentSnippet,
              sourceLink: item.link,
              sourceName: source.name,
              category,
              tags,
              imageUrl: item.imageUrl,
              publishedAt: new Date(item.pubDate),
              status: 'live',
              submissionType: 'automatic'
            });

            await article.save();
            recentArticles.push({ title: article.title, sourceLink: article.sourceLink }); 
            
            if (io) {
              io.emit('new_article', article);
            }
            
            metrics.totalAdded++;
            articlesAddedForSource++;
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
        sourceSuccess = false;
        sourceError = err.message;
        console.error(`Error processing source ${source.name}:`, err.message);
        errorLogs.push(`Source Error [${source.name}]: ${err.message}`);
      }

      // Update Source Health
      try {
        await NewsSourceHealth.findOneAndUpdate(
          { sourceName: source.name },
          {
            $set: {
              lastFetchTime: new Date(),
              lastStatus: sourceSuccess ? 'success' : 'error',
              lastError: sourceError
            },
            $inc: {
              articlesIngestedLast24h: articlesAddedForSource
            }
          },
          { upsert: true }
        );
      } catch (healthErr) {
        console.error(`Failed to update health for ${source.name}:`, healthErr.message);
      }
    }
    
    // Reset articlesIngestedLast24h logic: we could do it in a separate daily cron, 
    // but for now we rely on the counter. Realistically we should clear it once a day.
    
    const durationMs = Date.now() - startTime;
    console.log(`dY" Automated news fetcher completed in ${durationMs}ms. Added ${metrics.totalAdded}, Skipped ${metrics.duplicatesSkipped}, Rejected ${metrics.spamRejected}.`);
    
    if (metrics.totalAdded === 0 && errorLogs.length > 0) {
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
          await notificationService.createNotification({
            userId: admin._id,
            type: 'system_alert',
            title: 'News Ingestion Failed',
            message: 'Automated news ingestion completed with 0 articles added and encountered critical errors.',
            link: '/admin',
            isRead: false
          });
        }
      } catch (err) {
        console.error('Failed to send ingestion failure notification', err);
      }
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
