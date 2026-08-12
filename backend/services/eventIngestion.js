const Event = require('../models/Event');
const EventSyncLog = require('../models/EventSyncLog');
const User = require('../models/User');
const { normalizeEvent } = require('./eventNormalizer');
const devToProvider = require('./providers/DevToProvider');

const providersRegistry = {
  'EXTERNAL_API': devToProvider,
  'DEV_COMMUNITY': devToProvider // Alias for clarity
};

/**
 * Main ingestion logic
 * @param {String} providerName - Identifier for the provider (e.g. 'DEV_COMMUNITY')
 */
async function ingestEvents(providerName) {
  let log = new EventSyncLog({ provider: providerName, status: 'SUCCESS' });
  
  try {
    const providerInstance = providersRegistry[providerName] || providersRegistry['EXTERNAL_API'];
    if (!providerInstance) {
      throw new Error(`Provider ${providerName} not found or unsupported.`);
    }

    const rawEvents = await providerInstance.fetchEvents();
    
    // We need an admin or system user to be the 'hostedBy' for external events
    // For safety, let's grab the first admin we can find, or a hardcoded system user ID if one existed.
    // In production, there would be a dedicated System user ID.
    const systemUser = await User.findOne({ role: 'admin' });
    const fallbackHostId = systemUser ? systemUser._id : null;

    let imported = 0;
    let updated = 0;

    for (const raw of rawEvents) {
      try {
        const normalized = normalizeEvent(raw, providerName);
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
  ingestEvents,
  providersRegistry
};
