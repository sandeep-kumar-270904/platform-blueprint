const https = require('https');

class DevToProvider {
  /**
   * Fetches real tech events/hackathons from DEV.to API.
   * Maps specific dev.to tags to our internal event categories.
   */
  async fetchEvents() {
    const categoriesToTags = [
      { tag: 'hackathon', type: 'hackathon' },
      { tag: 'workshop', type: 'workshop' },
      { tag: 'tutorial', type: 'seminar' },
      { tag: 'conference', type: 'conference' },
      { tag: 'career', type: 'career_event' },
      { tag: 'coding', type: 'coding_contest' },
      { tag: 'webinar', type: 'webinar' },
      { tag: 'competition', type: 'competition' },
      { tag: 'tech', type: 'tech_event' }
    ];

    let allEvents = [];

    // Fetch for each mapped category sequentially to respect basic rate limits
    for (const mapping of categoriesToTags) {
      try {
        const events = await this.fetchTag(mapping.tag, mapping.type);
        allEvents = allEvents.concat(events);
      } catch (err) {
        console.error(`Failed fetching ${mapping.tag} events:`, err);
      }
    }

    return allEvents;
  }

  fetchTag(tag, type) {
    return new Promise((resolve, reject) => {
      const url = `https://dev.to/api/articles?tag=${tag}&state=fresh&per_page=5`;
      
      https.get(url, { headers: { 'User-Agent': 'StudentHub-Events-Bot' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              return resolve([]); // Gracefully handle non-200 by skipping
            }
            const articles = JSON.parse(data);
            const events = articles.map(article => ({
              id: `devto_${article.id}`,
              name: article.title,
              description: article.description || `Join this virtual ${type} reading event.`,
              type: type, // Now maps strictly to Event schema eventType enum!
              isExternalContent: true,
              is_online: true,
              url: article.url,
              organizer_name: article.user?.name || "DEV Community",
              status: "published",
              tags: article.tag_list || [tag, "virtual"],
              cover_image: article.cover_image || null
            }));
            resolve(events);
          } catch (err) {
            resolve([]); // Don't crash entire ingestion on JSON parse error
          }
        });
      }).on('error', (err) => {
        resolve([]); // Resolve empty array on network error
      });
    });
  }
}

module.exports = new DevToProvider();
