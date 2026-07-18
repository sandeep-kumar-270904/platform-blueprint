const User = require('../models/User');
const Resume = require('../models/Resume');
// const emailService = require('../services/emailService'); // Assuming this exists

const runBackupJob = async () => {
  try {
    const now = new Date();
    // Find users who have backup interval set and are due for a backup
    // For a real production app, we would calculate 'due date' based on lastBackupAt and interval.
    // For this mock, we just select users with a non-'none' interval for demonstration.
    const usersDue = await User.find({
      'resumeBackupSettings.interval': { $in: ['monthly', 'quarterly'] }
    });

    for (const user of usersDue) {
      // Check if due based on lastBackupAt (mock logic)
      let isDue = false;
      if (!user.resumeBackupSettings.lastBackupAt) {
        isDue = true;
      } else {
        const msSinceLast = now - user.resumeBackupSettings.lastBackupAt;
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;
        
        if (user.resumeBackupSettings.interval === 'monthly' && msSinceLast >= thirtyDays) {
          isDue = true;
        } else if (user.resumeBackupSettings.interval === 'quarterly' && msSinceLast >= ninetyDays) {
          isDue = true;
        }
      }

      if (isDue) {
        // In a real scenario, we'd generate a zip similar to downloadFullBackup and email it.
        console.log(`[BackupJob] Generating and emailing backup for user ${user._id} (${user.email})`);
        
        // Mock email sending
        // await emailService.sendBackupEmail(user.email, backupZipBuffer);
        
        user.resumeBackupSettings.lastBackupAt = now;
        await user.save();
      }
    }
  } catch (error) {
    console.error('[BackupJob] Error running automated backups:', error);
  }
};

module.exports = runBackupJob;
