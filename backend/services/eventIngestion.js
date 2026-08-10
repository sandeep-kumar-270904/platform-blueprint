const Event = require('../models/Event');
const EventSyncLog = require('../models/EventSyncLog');
const User = require('../models/User');
const { normalizeEvent } = require('./eventNormalizer');

const https = require('https');

/**
 * Fetches real tech events/hackathons from DEV.to API.
 * Uses articles tagged 'hackathon' as virtual events.
 */
function fetchFromProvider(provider) {
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

/**
 * Main ingestion logic
 */
async function ingestEvents(provider) {
  let log = new EventSyncLog({ provider, status: 'SUCCESS' });
  
  try {
    const rawEvents = await fetchFromProvider(provider);
    
    // We need an admin or system user to be the 'hostedBy' for external events
    // For safety, let's grab the first admin we can find, or a hardcoded system user ID if one existed.
    // In production, there would be a dedicated System user ID.
    const systemUser = await User.findOne({ role: 'admin' });
    const fallbackHostId = systemUser ? systemUser._id : null;

    let imported = 0;
    let updated = 0;

    for (const raw of rawEvents) {
      try {
        const normalized = normalizeEvent(raw, provider);
        if (fallbackHostId) {
          normalized.hostedBy = fallbackHostId;
        }

        // Deduplication & Upsert
        // We match strictly on the composite unique key of (provider + externalEventId)
        const filter = { 
          'source.provider': normalized.source.provider, 
          'source.externalEventId': normalized.source.externalEventId 
        };
        
        const existing = await Event.findOne(filter);
        if (existing) {
          // Update it, but preserve fields we don't want to blindly overwrite
          Object.assign(existing, normalized);
          // ensure importedAt is kept original
          existing.source.importedAt = existing.source.importedAt;
          await existing.save();
          updated++;
        } else {
          // Create new
          await Event.create(normalized);
          imported++;
        }
      } catch (err) {
        log.errors.push(`Error processing event ${raw.id}: ${err.message}`);
      }
    }

    log.eventsImported = imported;
    log.eventsUpdated = updated;
    if (log.errors.length > 0) {
      log.status = 'PARTIAL';
    }
  } catch (err) {
    log.status = 'FAILURE';
    log.errors.push(`Fatal sync error: ${err.message}`);
  }

  await log.save();
  return log;
}

module.exports = {
  ingestEvents
};
