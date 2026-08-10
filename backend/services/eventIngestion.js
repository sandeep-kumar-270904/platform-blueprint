const Event = require('../models/Event');
const EventSyncLog = require('../models/EventSyncLog');
const User = require('../models/User');
const { normalizeEvent } = require('./eventNormalizer');

/**
 * Mocks an external provider API fetch.
 * In a real scenario, this would use axios/fetch to hit an external endpoint.
 */
async function fetchFromProvider(provider) {
  // Mock external data payload
  return [
    {
      id: "ext_101",
      name: "Global Tech Summit 2026",
      description: "Join thousands of developers in exploring the future of tech.",
      type: "Conference", // Will fallback/normalize to 'seminar'
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // next week
      end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: "America/New_York",
      is_online: true,
      url: "https://example.com/events/ext_101",
      organizer_name: "TechGlobal",
      status: "published",
      capacity: 5000,
      tags: ["tech", "summit", "development"]
    },
    {
      id: "ext_102",
      name: "Local Hack Day",
      description: "A 24-hour hackathon for local university students.",
      type: "Hackathon",
      start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      timezone: "America/Chicago",
      is_online: false,
      venue: "University Student Center",
      url: "https://example.com/events/ext_102",
      organizer_name: "HackersOrg",
      status: "published",
      capacity: 200,
      tags: ["hackathon", "coding", "students"]
    }
  ];
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
