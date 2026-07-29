module.exports = [
  // Original RSS Sources
  { name: 'TechCrunch', type: 'rss', url: 'https://techcrunch.com/feed/', defaultCategory: 'Startups' },
  { name: 'Wired', type: 'rss', url: 'https://www.wired.com/feed/rss', defaultCategory: 'Big Tech' },
  { name: 'VentureBeat', type: 'rss', url: 'https://venturebeat.com/category/ai/feed/', defaultCategory: 'AI' },
  { name: 'AI News', type: 'rss', url: 'https://www.artificialintelligence-news.com/feed/', defaultCategory: 'AI' },
  
  // New RSS Sources
  { name: 'The Verge', type: 'rss', url: 'https://www.theverge.com/rss/index.xml', defaultCategory: 'Gadgets' },
  { name: 'Ars Technica', type: 'rss', url: 'https://feeds.arstechnica.com/arstechnica/index', defaultCategory: 'Big Tech' },
  { name: 'Hacker News', type: 'rss', url: 'https://hnrss.org/newest?points=100', defaultCategory: 'Startups' }, // High quality HN posts
  { name: 'MIT Tech Review', type: 'rss', url: 'https://www.technologyreview.com/feed/', defaultCategory: 'Research' },
  { name: 'Engadget', type: 'rss', url: 'https://www.engadget.com/rss.xml', defaultCategory: 'Gadgets' },
  { name: 'Reuters Tech', type: 'rss', url: 'https://www.reutersagency.com/feed/?best-topics=tech&post_type=best', defaultCategory: 'Big Tech' },

  // API Source
  { name: 'NewsAPI', type: 'api', defaultCategory: 'Big Tech' }
];
