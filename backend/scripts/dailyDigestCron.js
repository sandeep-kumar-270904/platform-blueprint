const mongoose = require('mongoose');
const NotificationPreference = require('../models/NotificationPreference');
const MentorBooking = require('../models/MentorBooking');
const OAAttempt = require('../models/OAAttempt');
const GDLiveSession = require('../models/GDLiveSession');

/**
 * Script simulating a Daily Digest Cron job for Calendar events.
 * Scans for users who have daily digest enabled.
 * Fetches their events for "today" in their timezone.
 * Suppresses individual event reminders for that day.
 */

async function runDailyDigest() {
  console.log('--- Starting Daily Digest Cron Simulation ---');
  
  // In a real application, this would run hourly or minutely,
  // checking if the current time matches the user's local delivery_time.
  
  const now = new Date();
  console.log(`Current server time: ${now.toISOString()}`);
  
  // Find all users with daily digest enabled
  // Assume we only run for active preferences to simulate a targeted batch
  const preferences = await NotificationPreference.find({ 'daily_digest.enabled': true }).populate('user_id');
  
  for (const pref of preferences) {
    const user = pref.user_id;
    if (!user) continue;

    console.log(`\nProcessing digest for User ID: ${user._id}`);
    
    // Calculate what "today" means for the user (ignoring explicit timezone logic for the demo, using 24h window)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todaysEvents = [];

    // Check Mock Interviews
    const mockBookings = await MentorBooking.find({
      menteeId: user._id,
      status: { $in: ['requested', 'confirmed'] },
      scheduledAt: { $gte: todayStart, $lte: todayEnd }
    });
    mockBookings.forEach(m => todaysEvents.push(`Mock Interview at ${m.scheduledAt}`));

    // Check OA Simulations
    const oaSimulations = await OAAttempt.find({
      user: user._id,
      status: 'Planned',
      scheduledFor: { $gte: todayStart, $lte: todayEnd }
    });
    oaSimulations.forEach(oa => todaysEvents.push(`OA Simulation at ${oa.scheduledFor}`));

    // Check GD Sessions
    const gdSessions = await GDLiveSession.find({
      'rsvps.user': user._id,
      'rsvps.status': 'Attending',
      status: 'Scheduled',
      scheduledTime: { $gte: todayStart, $lte: todayEnd }
    });
    gdSessions.forEach(gd => todaysEvents.push(`GD Session at ${gd.scheduledTime}`));

    if (todaysEvents.length > 0) {
      console.log(`[DIGEST] Found ${todaysEvents.length} events today for User ${user._id}. Sending Daily Digest email...`);
      console.log(`   -> Events:`, todaysEvents);
      console.log(`   -> Suppressing individual reminders for these events since digest is sent.`);
      // Logic to mark these specific event reminders as "sent" or block them in the reminder queue would go here.
    } else {
      console.log(`[SKIP] No events today for User ${user._id}. Daily Digest skipped.`);
    }
  }
  
  console.log('\n--- Daily Digest Cron Simulation Finished ---');
  process.exit(0);
}

// In case we want to run this standalone for testing:
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placement_db')
    .then(() => runDailyDigest())
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
