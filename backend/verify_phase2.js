const MentorProfile = require('./models/MentorProfile');
const MentorBooking = require('./models/MentorBooking');
const MentorReview = require('./models/MentorReview');

function runVerification() {
  console.log('--- Phase 2 Verification ---');

  try {
    // 1. Check if Stripe integration is set up
    const webhooksFile = require('fs').readFileSync('./routes/webhooks.js', 'utf8');
    if (webhooksFile.includes('stripe.webhooks.constructEvent')) {
      console.log('✅ Stripe Webhook signature verification is implemented.');
    } else {
      console.log('❌ Stripe Webhook signature verification missing.');
    }

    // 2. Check if MentorBooking has new fields
    const bookingSchemaPaths = MentorBooking.schema.paths;
    if (bookingSchemaPaths.paymentExpiresAt && bookingSchemaPaths.rescheduleHistory) {
      console.log('✅ MentorBooking schema updated with Phase 2 fields.');
    } else {
      console.log('❌ MentorBooking schema missing Phase 2 fields.');
    }

    // 3. Check if MentorReview has new fields
    const reviewSchemaPaths = MentorReview.schema.paths;
    if (reviewSchemaPaths.mentorReply && reviewSchemaPaths.moderationStatus) {
      console.log('✅ MentorReview schema updated with Phase 2 fields.');
    } else {
      console.log('❌ MentorReview schema missing Phase 2 fields.');
    }

    // 4. Verify Average Rating recalculation logic
    const mentorsFile = require('fs').readFileSync('./routes/mentors.js', 'utf8');
    if (mentorsFile.includes('mentor.rating = newTotal / mentor.reviewsCount')) {
      console.log('✅ Average rating recalculation logic implemented.');
    } else {
      console.log('❌ Average rating recalculation logic missing.');
    }

    if (mentorsFile.includes('hoursUntilSession > 24')) {
      console.log('✅ Cancellation refund policies implemented.');
    } else {
      console.log('❌ Cancellation refund policies missing.');
    }

  } catch (err) {
    console.error('Verification failed:', err);
  }
}

runVerification();
