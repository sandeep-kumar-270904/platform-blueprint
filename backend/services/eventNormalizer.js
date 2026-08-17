/**
 * Normalizes external event payloads into the internal StudentHub Event schema.
 * 
 * @param {Object} rawEvent - The raw event object from an external provider.
 * @param {String} provider - The provider name (e.g., 'EXTERNAL_API', 'PARTNER').
 * @returns {Object} Normalized event object ready for validation/insertion.
 */
function normalizeEvent(rawEvent, provider) {
  // Base normalized structure
  const normalized = {
    title: rawEvent.name || rawEvent.title || 'Untitled External Event',
    description: rawEvent.description || rawEvent.summary || 'No description provided.',
    eventType: mapEventType(rawEvent.type || rawEvent.category),
    
    // Dates & Times - Optional for external content
    startDate: rawEvent.isExternalContent ? null : parseDate(rawEvent.start_date || rawEvent.startTime),
    endDate: rawEvent.isExternalContent ? null : parseDate(rawEvent.end_date || rawEvent.endTime),
    startTime: rawEvent.isExternalContent ? null : extractTime(rawEvent.start_date || rawEvent.startTime),
    endTime: rawEvent.isExternalContent ? null : extractTime(rawEvent.end_date || rawEvent.endTime),
    timezone: rawEvent.timezone || 'UTC',
    
    // Logistics
    isVirtual: Boolean(rawEvent.is_online || rawEvent.isVirtual),
    venue: rawEvent.venue || rawEvent.location || 'See external link for location details',
    isExternalContent: rawEvent.isExternalContent || false,
    
    // Host Info
    hostedBy: null, // External events don't have an internal User host. The ingestion service will assign an Admin ID or leave it handling carefully.
    hostName: rawEvent.organizer_name || rawEvent.host || provider,
    
    // Status
    status: mapStatus(rawEvent.status),
    
    // Registration
    registrationRequired: true,
    capacity: rawEvent.capacity || null,
    externalRegistrationLink: rawEvent.url || rawEvent.registrationUrl || rawEvent.externalUrl,
    
    // Source Attribution
    source: {
      provider: provider,
      externalEventId: String(rawEvent.id || rawEvent.externalId),
      externalUrl: rawEvent.url || rawEvent.externalUrl,
      importedAt: new Date(),
      lastSyncedAt: new Date(),
      syncStatus: 'HEALTHY'
    },
    
    tags: Array.isArray(rawEvent.tags) ? rawEvent.tags : [],
    bannerImage: rawEvent.image_url || rawEvent.banner || null
  };

  return normalized;
}

function mapEventType(typeStr) {
  if (!typeStr) return 'seminar';
  const t = typeStr.toLowerCase();
  if (t.includes('community_content')) return 'community_content';
  if (t.includes('hackathon')) return 'hackathon';
  if (t.includes('comp')) return 'competition';
  if (t.includes('work')) return 'workshop';
  return 'seminar'; // fallback
}

function mapStatus(statusStr) {
  if (!statusStr) return 'approved';
  const s = statusStr.toLowerCase();
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'completed' || s === 'past') return 'completed';
  return 'approved'; // Assumed live/upcoming
}

function parseDate(dateStr) {
  if (!dateStr) return new Date(); // Fallback to today if strictly required, but should be validated out.
  return new Date(dateStr);
}

function extractTime(dateStr) {
  if (!dateStr) return "00:00";
  try {
    const d = new Date(dateStr);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return "00:00";
  }
}

module.exports = {
  normalizeEvent
};
