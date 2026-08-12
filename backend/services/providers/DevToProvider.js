const https = require('https');

class DevToProvider {
  /**
   * Fetches real tech events/hackathons from DEV.to API.
   * Uses articles tagged 'hackathon' as virtual events.
   */
  async fetchEvents() {
    return new Promise((resolve, reject) => {
      const url = 'https://dev.to/api/articles?tag=hackathon&state=fresh&per_page=10';
      
      https.get(url, { headers: { 'User-Agent': 'StudentHub-Events-Bot' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`API returned status ${res.statusCode}`);
            }
            const articles = JSON.parse(data);
            const events = articles.map(article => ({
              id: `devto_${article.id}`,
              name: article.title,
              description: article.description || "Join this virtual hackathon reading event.",
              type: "community_content",
              isExternalContent: true,
              is_online: true,
              url: article.url,
              organizer_name: article.user?.name || "DEV Community",
              status: "published",
              tags: article.tag_list || ["hackathon", "virtual"]
            }));
            resolve(events);
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }
}

module.exports = new DevToProvider();
