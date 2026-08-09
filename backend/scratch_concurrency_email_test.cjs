const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Notification = require('./models/Notification');
const User = require('./models/User');
const cronService = require('./services/cronService');
const emailService = require('./services/emailService');

process.env.MOCK_EMAIL = 'true';

async function runTests() {
  console.log("--- STARTING TRANSACTIONAL EMAIL CONCURRENCY & STRESS TEST ---");
  
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studenthub');
  console.log("✅ Connected to DB");

  try {
    // Setup test user
    let user = await User.findOne({ email: 'concurrency_test_alumni@example.com' });
    if (!user) {
      user = new User({
        email: 'concurrency_test_alumni@example.com',
        password: 'Password123!',
        full_name: 'Concurrency Test Alumni',
        role: 'student',
        is_verified: true
      });
      await user.save();
    }

    console.log("\\n--- TEST 1: ATOMIC CONCURRENCY & DUPLICATE PROTECTION ---");
    // Clear outbox and old pending notifications
    emailService.mockEmailOutbox = [];
    await Notification.deleteMany({ userId: user._id });

    // Generate 100 pending notifications
    const notifications = [];
    for (let i = 0; i < 100; i++) {
      notifications.push({
        userId: user._id,
        type: 'alumni_connection_request',
        message: 'A test message ' + i,
        deliveryChannels: ['in_app', 'email'],
        emailStatus: 'pending',
        actors: [{ name: 'Test Student ' + i }],
        metadata: {
          purpose: 'mentorship',
          message: 'Hello ' + i
        }
      });
    }
    await Notification.insertMany(notifications);
    console.log("Inserted 100 pending notifications.");

    // Spin up 5 concurrent workers
    console.log("Firing 5 concurrent cron workers...");
    const workers = [];
    for (let i = 0; i < 5; i++) {
      workers.push(cronService.processPendingEmails());
    }
    
    // Wait for all workers to finish
    await Promise.all(workers);

    const sentCount = await Notification.countDocuments({ userId: user._id, emailStatus: 'sent' });
    const outboxCount = emailService.mockEmailOutbox.length;

    console.log(`DB Sent Count: ${sentCount}`);
    console.log(`Mock Outbox Count: ${outboxCount}`);

    if (sentCount === 100 && outboxCount === 100) {
      console.log("✅ TEST 1 PASSED: Exactly 100 emails sent. No duplicates, no missed emails under concurrency.");
    } else {
      console.error(`❌ TEST 1 FAILED: Expected 100, got Sent: ${sentCount}, Outbox: ${outboxCount}`);
    }

    console.log("\\n--- TEST 2: HTML ESCAPING / SECURITY ---");
    emailService.mockEmailOutbox = [];
    
    const maliciousNotification = new Notification({
      userId: user._id,
      type: 'alumni_connection_request',
      message: 'A test message',
      deliveryChannels: ['in_app', 'email'],
      emailStatus: 'pending',
      actors: [{ name: '<script>alert("XSS")</script>' }],
      metadata: {
        purpose: 'HTML injection <img src=x onerror=alert(1)>',
        message: 'This is a "malicious" string.'
      }
    });
    await maliciousNotification.save();

    await cronService.processPendingEmails();

    const mockEmail = emailService.mockEmailOutbox[0];
    if (mockEmail) {
      if (mockEmail.htmlContent.includes('&lt;script&gt;') && !mockEmail.htmlContent.includes('<script>')) {
         console.log("✅ TEST 2 PASSED: Malicious HTML was safely escaped.");
      } else {
         console.error("❌ TEST 2 FAILED: HTML escaping failed.", mockEmail.htmlContent);
      }
    } else {
      console.error("❌ TEST 2 FAILED: Email was not sent.");
    }

    console.log("\\n--- TEST 3: RETRY BEHAVIOR (PERMANENT VS TEMPORARY) ---");
    // Mock sendEmailBase temporarily
    const originalSend = emailService.sendEmail;
    let sendCount = 0;
    
    emailService.sendEmail = async (to, sub, html) => {
      sendCount++;
      if (sendCount <= 3) {
        throw new Error('Temporary network timeout 503');
      }
      return originalSend(to, sub, html);
    };

    const retryNotification = new Notification({
      userId: user._id,
      type: 'community_warning',
      message: 'Test retry',
      deliveryChannels: ['in_app', 'email'],
      emailStatus: 'pending'
    });
    await retryNotification.save();

    console.log("Attempt 1 (should fail and set pending)...");
    await cronService.processPendingEmails();
    let n1 = await Notification.findById(retryNotification._id);
    if (n1.emailStatus === 'pending' && n1.emailAttempts === 1) {
       console.log("✅ Attempt 1 handled correctly (temporary failure).");
    } else {
       console.error("❌ Attempt 1 failed verification.", n1);
    }

    console.log("Attempt 2 (should fail and set pending)...");
    await cronService.processPendingEmails();
    
    console.log("Attempt 3 (should fail and set pending)...");
    await cronService.processPendingEmails();

    let n3 = await Notification.findById(retryNotification._id);
    if (n3.emailStatus === 'pending' && n3.emailAttempts === 3) {
      console.log("✅ Attempt 3 handled correctly.");
    }

    console.log("Attempt 4 (exceeds limit, should permanently fail)...");
    await cronService.processPendingEmails();
    let n4 = await Notification.findById(retryNotification._id);
    
    if (n4.emailStatus === 'failed' && n4.emailAttempts >= 4) {
      console.log("✅ TEST 3 PASSED: Notification permanently failed after max retries.");
    } else {
      console.error("❌ TEST 3 FAILED: Notification did not fail properly.", n4);
    }
    
    // Restore
    emailService.sendEmail = originalSend;

  } catch (err) {
    console.error("Script error:", err);
  } finally {
    // Cleanup
    await Notification.deleteMany({ 'actors.name': { $regex: /Test Student/ } });
    await Notification.deleteMany({ userId: await User.findOne({email: 'concurrency_test_alumni@example.com'}).then(u => u?._id) });
    await mongoose.disconnect();
    console.log("✅ Cleanup complete");
    process.exit(0);
  }
}

runTests();
