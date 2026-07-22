const cron = require('node-cron');
const MentorBooking = require('../models/MentorBooking');
const { AMASession } = require('../models/AMA');
const Notification = require('../models/Notification');

class CronService {
  init(io) {
    console.log('⏳ Initializing Cron Service...');

    const newsFetcherService = require('./newsFetcherService');
    
    // Initial fetch on startup so it doesn't wait 15 minutes empty
    newsFetcherService.fetchNews(io);

    // Run every 15 minutes to fetch external tech/AI news
    cron.schedule('*/15 * * * *', async () => {
      await newsFetcherService.fetchNews(io);
    });

    // Run every minute for testing, or typically every 5 mins in production
    // For Phase 3, we run every 5 mins.
    cron.schedule('*/5 * * * *', async () => {
      this.checkSessionReminders();
      this.checkLiveSessionReminders();
    });

    // Run every minute to transition AMA statuses and check expired holds
    cron.schedule('* * * * *', async () => {
      this.transitionAMAStatuses();
      this.checkExpiredHolds();
      this.checkNoShows();
      this.checkAbandonedQuizAttempts();
    });

    // Run every hour to check job application deadlines
    cron.schedule('0 * * * *', async () => {
      this.checkJobDeadlines();
      this.checkClassQuizDeadlines();
    });

    // Run every day at midnight for daily job alerts, scholarship deadlines, and API syncs
    cron.schedule('0 0 * * *', async () => {
      this.checkDailyJobAlerts();
      this.checkScholarshipDeadlines();
      this.computeCompetitionSignals();
      this.expireNonRecurringScholarships();
      
      try {
        const { runApiSync, flagStaleDataSources } = require('../services/apiSyncService');
        await runApiSync(); // This could be enhanced to respect hourly/daily/weekly syncFrequency
        await flagStaleDataSources();
      } catch (apiErr) {
        console.error('API sync error', apiErr);
      }

      try {
        const { runApiSync } = require('../jobs/apiSyncJob');
        await runApiSync();
      } catch (err) {
        console.error('Error running API Sync Job:', err);
      }
    });

    // Run every Sunday at 9 AM for weekly scholarship digest
    cron.schedule('0 9 * * 0', async () => {
      this.sendWeeklyScholarshipDigest();
    });

    // Run every Sunday at 10 AM for weekly community digest
    cron.schedule('0 10 * * 0', async () => {
      this.sendWeeklyCommunityDigest();
    });

    // Run every hour to check ingestion health and compute placement analytics
    cron.schedule('0 * * * *', async () => {
      this.checkNewsIngestionHealth();
      this.computePlacementAnalytics();
    });
  }

  async checkSessionReminders() {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

      // We need a way to track if a reminder was already sent.
      // Usually we'd add `reminder24hSent: true` on the booking model, but since we didn't add that field,
      // we can check if the notification already exists to prevent spam.

      // 1. Check upcoming 1-on-1 bookings in 24 hours
      const bookings24h = await MentorBooking.find({
        status: { $in: ['confirmed'] },
        scheduledAt: {
          $gte: new Date(in24Hours.getTime() - 5 * 60 * 1000), // Within 5 min window
          $lt: new Date(in24Hours.getTime() + 5 * 60 * 1000)
        }
      });

      for (const b of bookings24h) {
        const existing = await Notification.findOne({
          userId: b.menteeId,
          type: 'session_reminder',
          relatedContentId: b._id
        });
        if (!existing) {
          await require("./notificationService").sendNotification({
            userId: b.menteeId,
            type: 'session_reminder',
            relatedContentId: b._id,
            message: `Reminder: You have an upcoming 1-on-1 session in 24 hours.`
          });
          await require("./notificationService").sendNotification({
            userId: b.mentorId,
            type: 'session_reminder',
            relatedContentId: b._id,
            message: `Reminder: You have an upcoming 1-on-1 session to host in 24 hours.`
          });
        }
      }

      // 2. Check upcoming AMA Sessions in 24 hours
      const amas24h = await AMASession.find({
        status: 'upcoming',
        scheduled_at: {
          $gte: new Date(in24Hours.getTime() - 5 * 60 * 1000),
          $lt: new Date(in24Hours.getTime() + 5 * 60 * 1000)
        }
      });

      for (const ama of amas24h) {
        // notify attendees
        for (const attendee of ama.registered_attendees) {
          const existing = await Notification.findOne({
            userId: attendee.user_id,
            type: 'ama_reminder',
            relatedContentId: ama._id
          });
          if (!existing) {
            await require("./notificationService").sendNotification({
              userId: attendee.user_id,
              type: 'ama_reminder',
              relatedContentId: ama._id,
              message: `Reminder: The AMA '${ama.title}' starts in 24 hours.`
            });
          }
        }
        // notify host
        const existingHost = await Notification.findOne({
          userId: ama.mentor_id,
          type: 'ama_reminder',
          relatedContentId: ama._id
        });
        if (!existingHost) {
          await require("./notificationService").sendNotification({
            userId: ama.mentor_id,
            type: 'ama_reminder',
            relatedContentId: ama._id,
            message: `Reminder: Your AMA '${ama.title}' starts in 24 hours.`
          });
        }
      }

        // --- Handle Waitlist Claim Expirations ---
        try {
          const MentorWaitlist = require('../models/MentorWaitlist');
          const expiredClaims = await MentorWaitlist.find({
            status: 'notified',
            claimExpiresAt: { $lt: now }
          });

          for (const claim of expiredClaims) {
            claim.status = 'expired';
            await claim.save();

            // Notify the next person in line
            const nextInLine = await MentorWaitlist.findOneAndUpdate(
              { mentorId: claim.mentorId, status: 'waiting' },
              { 
                status: 'notified', 
                notifiedAt: now, 
                claimExpiresAt: new Date(now.getTime() + 60 * 60 * 1000) 
              },
              { sort: { createdAt: 1 }, new: true }
            );

            if (nextInLine) {
              const notificationService = require('./notificationService');
              await notificationService.createNotification({
                userId: nextInLine.menteeId,
                type: 'mentor_waitlist_open',
                relatedContentId: nextInLine.mentorId,
                message: `A spot has opened up! You have 1 hour to claim it.`
              });
            }
          }
        } catch (err) {
          console.error('Waitlist cron error:', err);
        }

      } catch (err) {
        console.error('Error in general 5-min cron:', err);
      }
  }

  async checkLiveSessionReminders() {
    try {
      const LiveSession = require('../models/LiveSession');
      const User = require('../models/User');
      const notificationService = require('./notificationService');

      const now = new Date();
      // Look for sessions scheduled to start between now and 12 minutes from now.
      // (12 minutes gives a safe window for a 5-minute cron to catch the ~10min mark)
      const in12Minutes = new Date(now.getTime() + 12 * 60 * 1000);

      const upcomingSessions = await LiveSession.find({
        status: 'scheduled',
        scheduledStartAt: { $gte: now, $lte: in12Minutes },
        reminderSent: false
      }).populate('quiz', 'title _id');

      for (const session of upcomingSessions) {
        // Find users in waiting room
        const waitingParticipants = session.participants
          .filter(p => p.status === 'waiting' && p.user)
          .map(p => p.user.toString());

        // Find users subscribed to this quiz
        const subscribers = await User.find({ subscribedQuizzes: session.quiz._id }).select('_id');
        const subscriberIds = subscribers.map(s => s._id.toString());

        // Combine unique users to notify
        const usersToNotify = [...new Set([...waitingParticipants, ...subscriberIds])];

        for (const userId of usersToNotify) {
          await notificationService.createNotification({
            userId,
            type: 'live_session_reminder',
            relatedQuiz: session.quiz._id,
            relatedLiveSession: session._id,
            message: `The live quiz "${session.quiz.title}" is starting in ~10 minutes. Get ready!`,
            actionUrl: `/live/join`,
            channel: 'both',
            emailData: {
              quizTitle: session.quiz.title,
              joinCode: session.joinCode
            }
          });
        }

        // Mark as sent
        session.reminderSent = true;
        await session.save();
      }
    } catch (err) {
      console.error('Error in checkLiveSessionReminders:', err);
    }
  }

  async transitionAMAStatuses() {
    try {
      const now = new Date();

      // upcoming -> live
      await AMASession.updateMany(
        { 
          status: 'upcoming', 
          scheduled_at: { $lte: now } 
        },
        { $set: { status: 'live' } }
      );

      // live -> completed (based on duration_minutes)
      const liveSessions = await AMASession.find({ status: 'live' });
      for (const session of liveSessions) {
        const endTime = new Date(session.scheduled_at.getTime() + session.duration_minutes * 60000);
        if (now >= endTime) {
          session.status = 'completed';
          await session.save();
        }
      }
    } catch (err) {
      console.error('Error in transitionAMAStatuses:', err);
    }
  }

  async checkExpiredHolds() {
    try {
      const expiredBookings = await MentorBooking.find({
        status: 'requested',
        paymentStatus: 'pending',
        paymentExpiresAt: { $lte: new Date() }
      });

      for (const booking of expiredBookings) {
        booking.status = 'cancelled';
        booking.paymentStatus = 'failed';
        booking.cancellationReason = 'Payment hold expired';
        booking.cancelledBy = 'system';
        booking.paymentExpiresAt = null;
        await booking.save();
      }
    } catch (err) {
      console.error('Error in checkExpiredHolds:', err);
    }
  }

  async checkNoShows() {
    try {
      const MentorBooking = require('../models/MentorBooking');
      const MentorProfile = require('../models/MentorProfile');
      const notificationService = require('./notificationService');
      
      const now = new Date();
      // Grace period is 15 minutes
      const thresholdTime = new Date(now.getTime() - 15 * 60 * 1000);
      const limitTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const activeBookings = await MentorBooking.find({
        status: 'confirmed',
        scheduledAt: { $lte: thresholdTime, $gt: limitTime }
      }).populate('mentorId');

      for (const booking of activeBookings) {
        // If neither joined
        if (!booking.mentorJoinedAt && !booking.menteeJoinedAt) {
          booking.status = 'no-show';
          booking.noShowBy = 'both';
          booking.refundStatus = 'full'; // Refund mentee
          await booking.save();
          
          await notificationService.createNotification({
            userId: booking.menteeId,
            type: 'session_no_show',
            relatedContentId: booking._id,
            message: `Session marked as no-show. You have been fully refunded.`
          });
          continue;
        }

        // If mentor didn't join
        if (!booking.mentorJoinedAt && booking.menteeJoinedAt) {
          booking.status = 'no-show';
          booking.noShowBy = 'mentor';
          booking.refundStatus = 'full'; // Automatic refund
          await booking.save();

          // Add strike
          const mentor = await MentorProfile.findById(booking.mentorId._id);
          if (mentor) {
            mentor.noShowCount = (mentor.noShowCount || 0) + 1;
            
            // Flag for review if >= 3
            if (mentor.noShowCount >= 3) {
              const User = require('../models/User');
              const adminUsers = await User.find({ role: 'admin' });
              for (const admin of adminUsers) {
                await notificationService.createNotification({
                  userId: admin._id,
                  type: 'admin_alert',
                  relatedContentId: mentor._id,
                  message: `Mentor ${mentor.title} has reached ${mentor.noShowCount} no-shows.`
                });
              }
            }
            await mentor.save();
          }

          await notificationService.createNotification({
            userId: booking.menteeId,
            type: 'session_no_show',
            relatedContentId: booking._id,
            message: `Your mentor missed the session. You have been fully refunded.`
          });
          
          await notificationService.createNotification({
            userId: booking.mentorId.user_id,
            type: 'session_no_show',
            relatedContentId: booking._id,
            message: `You missed a scheduled session. This counts as a no-show strike.`
          });
          continue;
        }

        // If mentee didn't join
        if (booking.mentorJoinedAt && !booking.menteeJoinedAt) {
          booking.status = 'no-show';
          booking.noShowBy = 'mentee';
          booking.refundStatus = 'none'; // Mentee forfeits
          await booking.save();
          
          await notificationService.createNotification({
            userId: booking.menteeId,
            type: 'session_no_show',
            relatedContentId: booking._id,
            message: `You missed your session. Your payment/reschedule right is forfeited.`
          });
          continue;
        }
        
        // If both joined, it's not a no-show. It will naturally transition to 'completed' elsewhere.
      }
    } catch (err) {
      console.error('Error in checkNoShows:', err);
    }
  }

  async checkJobDeadlines() {
    try {
      const Job = require('../models/Job');
      const notificationService = require('./notificationService');
      const now = new Date();
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const upcomingDeadlineJobs = await Job.find({
        status: 'published',
        applicationDeadline: {
          $gte: now,
          $lte: in48Hours
        },
        deadlineReminderSent: { $ne: true }
      });

      for (const job of upcomingDeadlineJobs) {
        await notificationService.createNotification({
          userId: job.postedBy,
          type: 'application_deadline_approaching',
          message: `The application deadline for ${job.title} is approaching.`,
          relatedJob: job._id,
          actionUrl: `/recruiter/jobs/${job._id}/applicants`,
          channel: 'in_app', // Per section 3 table
          emailData: { jobTitle: job.title }
        });

        job.deadlineReminderSent = true;
        await job.save();
      }
    } catch (err) {
      console.error('Error in checkJobDeadlines:', err);
    }
  }

  async checkDailyJobAlerts() {
    try {
      const JobAlert = require('../models/JobAlert');
      const Job = require('../models/Job');
      const User = require('../models/User');
      const notificationService = require('./notificationService');

      const now = new Date();
      // Find all active daily alerts
      const alerts = await JobAlert.find({ active: true, frequency: 'daily' });

      for (const alert of alerts) {
        const since = alert.lastNotifiedAt || new Date(now.getTime() - 24 * 60 * 60 * 1000); // last 24h if null

        // Find jobs published since `since` that match criteria
        const query = {
          status: 'published',
          createdAt: { $gt: since }
        };

        const c = alert.criteria;
        if (c.workMode) query.workMode = c.workMode;
        if (c.jobType) query.jobType = c.jobType;
        if (c.experienceLevel) query.experienceLevel = c.experienceLevel;
        if (c.minSalary) query['salary.max'] = { $gte: c.minSalary };
        if (c.location) query.location = new RegExp(c.location, 'i');
        
        if (c.keywords) {
          // simplistic match
          query.$text = { $search: c.keywords };
        }

        const matchedJobs = await Job.find(query).limit(50);
        
        // Manual filter for keywords if text index isn't behaving perfectly, or we just rely on text search
        // We'll rely on text search if keywords exist.

        if (matchedJobs.length > 0) {
          const user = await User.findById(alert.user).select('notificationPreferences');
          if (!user) continue;

          const inApp = user.notificationPreferences?.jobAlerts?.inApp !== false;
          const email = user.notificationPreferences?.jobAlerts?.email !== false;

          if (!inApp && !email) continue;
          
          let channel = 'both';
          if (inApp && !email) channel = 'in_app';
          if (!inApp && email) channel = 'email';

          await notificationService.createNotification({
            userId: alert.user,
            type: 'job_alert_daily',
            message: `You have ${matchedJobs.length} new jobs matching your alert "${alert.name}".`,
            actionUrl: `/jobs`, // In real app, link to alert results
            channel,
            emailData: { alertName: alert.name, matchCount: matchedJobs.length }
          });

          alert.lastNotifiedAt = now;
          await alert.save();
        }
      }
    } catch (err) {
      console.error('Error in checkDailyJobAlerts:', err);
    }
  }

  async expireNonRecurringScholarships() {
    try {
      const Scholarship = require('../models/Scholarship');
      
      const expired = await Scholarship.updateMany(
        {
          isRecurring: false,
          status: 'published',
          applicationDeadline: { $lt: new Date() }
        },
        { $set: { status: 'expired' } }
      );
      
      if (expired.modifiedCount > 0) {
        console.log(`[Cron] Expired ${expired.modifiedCount} non-recurring scholarships past deadline.`);
      }
    } catch (err) {
      console.error('Error expiring non-recurring scholarships:', err);
    }
  }

  async checkNewsIngestionHealth() {
    try {
      const NewsIngestionLog = require('../models/NewsIngestionLog');
      const User = require('../models/User');
      const notificationService = require('./notificationService');
      
      const lastLog = await NewsIngestionLog.findOne().sort({ createdAt: -1 });
      const now = new Date();
      
      // If no logs, or the last log is older than 60 minutes
      if (!lastLog || (now.getTime() - lastLog.createdAt.getTime()) > 60 * 60 * 1000) {
        const adminUsers = await User.find({ role: 'admin' });
        for (const admin of adminUsers) {
          await notificationService.createNotification({
            userId: admin._id,
            type: 'admin_alert',
            message: `⚠️ Alert: Tech News ingestion engine has not run successfully in over an hour.`,
            actionUrl: `/admin/news-moderation`,
            channel: 'in_app'
          });
        }
      }
    } catch (err) {
      console.error('Error in checkNewsIngestionHealth:', err);
    }
  }

  async checkAbandonedQuizAttempts() {
    try {
      const QuizAttempt = require('../models/QuizAttempt');
      const Quiz = require('../models/Quiz');
      
      // Find all in-progress attempts
      const inProgressAttempts = await QuizAttempt.find({ status: 'in_progress' });
      const now = new Date();

      for (const attempt of inProgressAttempts) {
        // Load the quiz to get the durationMinutes
        const quiz = await Quiz.findById(attempt.quiz);
        if (!quiz || !quiz.durationMinutes) continue;

        const allowedTimeMs = quiz.durationMinutes * 60 * 1000 + 30000; // 30s buffer
        if (now.getTime() - attempt.startedAt.getTime() > allowedTimeMs) {
          // It's abandoned
          attempt.status = 'abandoned';
          attempt.completedAt = now;
          await attempt.save();
        }
      }
    } catch (error) {
      console.error('Error in checkAbandonedQuizAttempts:', error);
    }
  }

  async checkClassQuizDeadlines() {
    try {
      const Quiz = require('../models/Quiz');
      const ClassRoster = require('../models/ClassRoster');
      const notificationService = require('./notificationService');
      const now = new Date();
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const upcomingDeadlineQuizzes = await Quiz.find({
        classId: { $ne: null },
        dueDate: {
          $gte: now,
          $lte: in48Hours
        },
        deadlineReminderSent: { $ne: true }
      });

      for (const quiz of upcomingDeadlineQuizzes) {
        const roster = await ClassRoster.findById(quiz.classId);
        if (roster) {
          for (const studentId of roster.studentIds) {
            await notificationService.createNotification({
              userId: studentId,
              type: 'class_quiz_deadline_approaching',
              title: 'Quiz Deadline Approaching',
              message: `The deadline for your class quiz "${quiz.title}" is approaching.`,
              channel: 'both',
              emailData: { quizTitle: quiz.title, className: roster.name || 'Class' },
              actionUrl: `/quizzes/${quiz._id}`
            });
          }
        }
        quiz.deadlineReminderSent = true;
        await quiz.save();
      }
    } catch (err) {
      console.error('Error in checkClassQuizDeadlines:', err);
    }
  }

  async checkScholarshipsAgainstScamPatterns(scholarshipId = null) {
    try {
      const ScamPatternRule = require('../models/ScamPatternRule');
      const Scholarship = require('../models/Scholarship');

      const rules = await ScamPatternRule.find({ isActive: true });
      if (!rules.length) return;

      const query = { status: 'published' };
      if (scholarshipId) query._id = scholarshipId;

      const scholarships = await Scholarship.find(query);

      for (const scholarship of scholarships) {
        let matched = false;
        let isHighPriority = false;
        
        const fullText = (scholarship.description + ' ' + (scholarship.eligibility?.otherCriteria?.join(' ') || '')).toLowerCase();

        for (const rule of rules) {
          let hasMatch = false;
          if (rule.matchType === 'contains' && fullText.includes(rule.patternText.toLowerCase())) {
            hasMatch = true;
          } else if (rule.matchType === 'regex') {
            const regex = new RegExp(rule.patternText, 'i');
            if (regex.test(fullText)) {
              hasMatch = true;
            }
          }

          if (hasMatch && !scholarship.scamFlagMatches.includes(rule.patternText)) {
            scholarship.scamFlagMatches.push(rule.patternText);
            matched = true;
            if (rule.severity === 'high_priority') isHighPriority = true;
          }
        }

        if (matched) {
          await scholarship.save();
          // The prompt says: "if any match has severity='high_priority', and the scholarship has been reported via the existing moderation pipeline, that report is surfaced with elevated priority in the admin review queue"
          // We achieve this dynamically in the GET /reports/priority endpoint using scamFlagMatches or isScamFlagged. Let's explicitly set isScamFlagged for high priority to power that endpoint.
          if (isHighPriority) {
            await Scholarship.updateOne({ _id: scholarship._id }, { $set: { isScamFlagged: true } });
          }
        }
      }
    } catch (err) {
      console.error('Error in checkScholarshipsAgainstScamPatterns:', err);
    }
  }

  async archiveExpiredRecurringScholarships() {
    try {
      const Scholarship = require('../models/Scholarship');
      const Notification = require('../models/Notification');
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const activeScholarships = await Scholarship.find({ status: 'published', isRecurring: true });

      for (const scholarship of activeScholarships) {
          const deadline = new Date(scholarship.applicationDeadline);
          const deadlineDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
          
          if (deadlineDay < today) {
             scholarship.status = 'archived';
             await scholarship.save();

             // Notify submitter/admin prompting renewal
             let userIdToNotify = scholarship.submittedBy;
             if (!userIdToNotify && scholarship.source === 'admin') {
                // If it's an admin, we'd ideally get the admin user list, but for now we fallback if there's an author
                const User = require('../models/User');
                const admin = await User.findOne({ role: 'admin' });
                if (admin) userIdToNotify = admin._id;
             }

             if (userIdToNotify) {
               await require("./notificationService").sendNotification({
                 userId: userIdToNotify,
                 type: 'scholarship_needs_renewal',
                 relatedContentId: scholarship._id,
                 message: `Your recurring scholarship "${scholarship.title}" has expired and been archived. Please review and update details to publish the next cycle.`
               });
             }
          }
      }
    } catch (err) {
      console.error('Error in archiveExpiredRecurringScholarships:', err);
    }
  }

  async generateComplianceChecks() {
    try {
      const ScholarshipApplication = require('../models/ScholarshipApplication');
      const ComplianceCheck = require('../models/ComplianceCheck');
      const Scholarship = require('../models/Scholarship');

      // Find all awarded applications where we haven't generated the *initial* compliance checks
      // In a robust system, this might look for apps awarded in the last 24h, or use a boolean flag on the app.
      // For idempotency, we can just find awarded apps for scholarships with reporting requirements,
      // and check if a ComplianceCheck already exists.
      
      // First find scholarships that require reporting
      const requiringScholarships = await Scholarship.find({
        'renewalRequirements.reportingRequired': true
      }).select('_id renewalRequirements');

      const reqSchMap = {};
      requiringScholarships.forEach(s => {
        reqSchMap[s._id.toString()] = s;
      });

      const schIds = Object.keys(reqSchMap);
      if (!schIds.length) return;

      const awardedApps = await ScholarshipApplication.find({
        status: 'awarded',
        scholarshipId: { $in: schIds }
      });

      for (const app of awardedApps) {
        // Did we already generate checks?
        const existing = await ComplianceCheck.findOne({ applicationId: app._id });
        if (existing) continue; // Already generated

        const scholarship = reqSchMap[app.scholarshipId.toString()];
        const freq = scholarship.renewalRequirements.reportingFrequency;
        
        let dueDates = [];
        const now = new Date();
        
        // Example logic: generate the first check based on frequency
        if (freq === 'monthly') {
          const nextMonth = new Date(now);
          nextMonth.setMonth(now.getMonth() + 1);
          dueDates.push(nextMonth);
        } else if (freq === 'quarterly') {
          const nextQuarter = new Date(now);
          nextQuarter.setMonth(now.getMonth() + 3);
          dueDates.push(nextQuarter);
        } else if (freq === 'annually') {
          const nextYear = new Date(now);
          nextYear.setFullYear(now.getFullYear() + 1);
          dueDates.push(nextYear);
        }

        for (const d of dueDates) {
          await ComplianceCheck.create({
            applicationId: app._id,
            dueDate: d,
            status: 'pending'
          });
        }
      }
    } catch (err) {
      console.error('Error in generateComplianceChecks:', err);
    }
  }

  async sendComplianceReminders() {
    try {
      const ComplianceCheck = require('../models/ComplianceCheck');
      const SentReminder = require('../models/SentReminder');
      const Notification = require('../models/Notification');
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Target window: due in 7 days
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + 7);

      const pendingChecks = await ComplianceCheck.find({
        status: 'pending',
        dueDate: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }).populate({
        path: 'applicationId',
        populate: { path: 'scholarshipId userId' }
      });

      for (const check of pendingChecks) {
        const userId = check.applicationId.userId._id;
        const dedupeKey = `compliance_7_day_${check._id.toString()}`;

        const alreadySent = await SentReminder.findOne({
          userId: userId,
          reminderKey: dedupeKey
        });

        if (!alreadySent) {
          await require("./notificationService").sendNotification({
            userId: userId,
            type: 'compliance_reminder',
            relatedContentId: check._id,
            message: `Reminder: Post-award compliance proof for "${check.applicationId.scholarshipId.title}" is due in 7 days.`
          });

          await SentReminder.create({
            userId: userId,
            reminderKey: dedupeKey,
            sentAt: new Date()
          });
        }
      }
    } catch (err) {
      console.error('Error in sendComplianceReminders:', err);
    }
  }

  async checkScholarshipDeadlines() {
    try {
      const Scholarship = require('../models/Scholarship');
      const SavedScholarship = require('../models/SavedScholarship');
      const ScholarshipApplication = require('../models/ScholarshipApplication');
      const Notification = require('../models/Notification');
      const UserReminderPreference = require('../models/UserReminderPreference');
      const SentReminder = require('../models/SentReminder');

      const now = new Date();
      // Only get start of today for precise day differences
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const activeScholarships = await Scholarship.find({ status: 'published' });

      for (const scholarship of activeScholarships) {
          const deadline = new Date(scholarship.applicationDeadline);
          const deadlineDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
          
          if (deadlineDay < today) {
            // Expire non-recurring here (Recurring is handled by archiveExpiredRecurringScholarships)
            if (!scholarship.isRecurring) {
               scholarship.status = 'expired';
               await scholarship.save();
            }
            continue;
          }

        const diffTime = deadlineDay - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const saved = await SavedScholarship.find({ scholarshipId: scholarship._id });
        const apps = await ScholarshipApplication.find({ 
             scholarshipId: scholarship._id, 
             status: { $nin: ['submitted', 'awarded', 'rejected'] } 
        });

        const userIds = new Set();
        saved.forEach(s => userIds.add(s.userId.toString()));
        apps.forEach(a => userIds.add(a.userId.toString()));

        for (const userId of Array.from(userIds)) {
            let pref = await UserReminderPreference.findOne({ userId });
            const intervals = pref ? pref.scholarshipReminderIntervals : [7, 1];
            
            if (intervals.includes(diffDays)) {
                // Ensure idempotency
                const existingReminder = await SentReminder.findOne({ userId, scholarshipId: scholarship._id, interval: diffDays });
                
                if (!existingReminder) {
                    await require("./notificationService").sendNotification({
                        userId,
                        type: 'scholarship_deadline',
                        relatedContentId: scholarship._id,
                        message: `Reminder: The deadline for scholarship "${scholarship.title}" is in ${diffDays} day(s).`
                    });
                    
                    try {
                        await SentReminder.create({ userId, scholarshipId: scholarship._id, interval: diffDays });
                    } catch (dupErr) {
                        // Ignore unique index collision if somehow raced
                    }
                }
            }
        }
      }
    } catch (err) {
      console.error('Error in checkScholarshipDeadlines:', err);
    }
  }

  async sendWeeklyScholarshipDigest() {
    try {
      const Scholarship = require('../models/Scholarship');
      const SavedScholarship = require('../models/SavedScholarship');
      const ScholarshipApplication = require('../models/ScholarshipApplication');
      const Notification = require('../models/Notification');
      const UserReminderPreference = require('../models/UserReminderPreference');

      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Only find users who have weekly digest enabled (or default)
      const prefs = await UserReminderPreference.find({ weeklyDigestEnabled: false });
      const disabledUserIds = new Set(prefs.map(p => p.userId.toString()));

      // Get all saved or draft applications
      const saved = await SavedScholarship.find({}).populate('scholarshipId');
      const apps = await ScholarshipApplication.find({ 
          status: { $nin: ['submitted', 'awarded', 'rejected'] } 
      }).populate('scholarshipId');

      const userEngagements = new Map();

      const processEngagement = (doc) => {
          if (!doc.scholarshipId) return;
          const uId = doc.userId.toString();
          if (disabledUserIds.has(uId)) return;
          
          if (!userEngagements.has(uId)) {
             userEngagements.set(uId, new Map());
          }
          
          const deadline = new Date(doc.scholarshipId.applicationDeadline);
          if (deadline > now && deadline <= nextWeek) {
              userEngagements.get(uId).set(doc.scholarshipId._id.toString(), doc.scholarshipId);
          }
      };

      saved.forEach(processEngagement);
      apps.forEach(processEngagement);

      for (const [userId, scholarshipsMap] of userEngagements.entries()) {
          const dueThisWeek = scholarshipsMap.size;
          if (dueThisWeek > 0) {
              await require("./notificationService").sendNotification({
                 userId,
                 type: 'scholarship_weekly_digest',
                 message: `Weekly Digest: You have ${dueThisWeek} scholarship(s) due in the next 7 days. Check your dashboard!`
              });
          }
      }
    } catch (err) {
      console.error('Error in sendWeeklyScholarshipDigest:', err);
    }
  }

  async sendWeeklyCommunityDigest() {
    console.log('Running sendWeeklyCommunityDigest cron job...');
    try {
      const User = require('../models/User');
      const CommunityPost = require('../models/CommunityPost');
      const CommunityLike = require('../models/CommunityLike');
      const CommunityComment = require('../models/CommunityComment');
      const Follow = require('../models/Follow'); // Assuming a Follow model exists
      const notificationService = require('./notificationService');
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const activeUsers = await User.find({}).lean();
      
      for (const user of activeUsers) {
        // 1. New followers in the last 7 days (graceful fallback if Follow doesn't exist)
        let newFollowersCount = 0;
        try {
          newFollowersCount = await Follow.countDocuments({
            followed_id: user._id,
            created_at: { $gte: oneWeekAgo }
          });
        } catch(e) { }

        // 2. Engagement in last 7 days
        const userPosts = await CommunityPost.find({ user_id: user._id }).lean();
        const postIds = userPosts.map(p => p._id);
        
        const newLikes = await CommunityLike.countDocuments({
          post_id: { $in: postIds },
          createdAt: { $gte: oneWeekAgo } // Use the correct timestamp field
        }).catch(() => 0);

        const newComments = await CommunityComment.countDocuments({
          post_id: { $in: postIds },
          created_at: { $gte: oneWeekAgo }
        }).catch(() => 0);

        const totalEngagement = newLikes + newComments;

        // 3. Top post from the week
        let topPost = null;
        let maxEng = -1;
        for (const post of userPosts) {
           const eng = (post.like_count || 0) + (post.comment_count || 0);
           if (eng > maxEng && post.created_at >= oneWeekAgo) {
             maxEng = eng;
             topPost = post;
           }
        }

        if (totalEngagement > 0 || newFollowersCount > 0 || topPost) {
          await notificationService.sendNotification({
            userId: user._id,
            type: 'weekly_digest',
            message: `Your Week in Review: ${newFollowersCount} New Followers, ${totalEngagement} Post Reactions.`,
            metadata: {
               newFollowers: newFollowersCount,
               postReactions: totalEngagement,
               topPostText: topPost ? topPost.text : 'No posts this week.'
            }
          });
        }
      }
    } catch (err) {
      console.error('Error in sendWeeklyCommunityDigest:', err);
    }
  }

  async computeCompetitionSignals() {
    console.log('Running computeCompetitionSignals cron job...');
    try {
      // Find all active scholarships
      const scholarships = await Scholarship.find({ status: 'published' });
      for (const scholarship of scholarships) {
        // Evaluate data volume (views or application count relative)
        // If data is very sparse, set limited_data_available
        // Assuming we have fields: viewCount, saveCount, applicationCount (if tracked)
        // Since we didn't explicitly add viewCount/saveCount to schema in phase 1, we check if they exist or fallback to applications
        const apps = await ScholarshipApplication.countDocuments({ scholarshipId: scholarship._id });
        const viewCount = scholarship.viewCount || 0; 
        
        let signal = 'limited_data_available';
        
        if (apps > 0 && viewCount > 50) {
          const ratio = apps / viewCount;
          if (ratio >= 0.5) {
            signal = 'higher_competition';
          } else if (ratio >= 0.1) {
            signal = 'moderate_competition';
          }
        } else if (apps > 20) {
           // Fallback heuristic if viewCount isn't tracked robustly
           signal = 'higher_competition';
        } else if (apps > 5) {
           signal = 'moderate_competition';
        }

        if (scholarship.competitionSignal !== signal) {
          scholarship.competitionSignal = signal;
          await scholarship.save();
        }
      }
    } catch (err) {
      console.error('Error in computeCompetitionSignals:', err);
    }
  }
  async computePlacementAnalytics() {
    try {
      const PlacementProfile = require('../models/PlacementProfile');
      const UserActivity = require('../models/UserActivity');
      const MentorBooking = require('../models/MentorBooking');
      const PlacementAnalyticsStat = require('../models/PlacementAnalyticsStat');
      const Notification = require('../models/Notification');
      const User = require('../models/User');

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const activeUsers = await PlacementProfile.countDocuments();
      const dsaSolved = await UserActivity.countDocuments({ action_type: 'dsa_problem_solved' });
      const mocksBooked = await MentorBooking.countDocuments();
      
      // Anomaly Detection: Check for users who solved an impossible amount of DSA problems in the last hour
      const recentActivity = await UserActivity.aggregate([
        { $match: { action_type: 'dsa_problem_solved', date: { $gte: oneHourAgo } } },
        { $group: { _id: '$user_id', count: { $sum: 1 } } },
        { $match: { count: { $gt: 50 } } } // >50 in one hour is suspicious
      ]);

      const anomaliesDetected = recentActivity.map(a => a._id);

      await PlacementAnalyticsStat.create({
        activeUsers,
        dsaSolved,
        mocksBooked,
        avgReadinessScore: 75, // Placeholder
        anomaliesDetected
      });

      // Alert admins if anomalies detected
      if (anomaliesDetected.length > 0) {
        const admins = await User.find({ role: 'admin' });
        const notificationService = require('./notificationService');
        for (const admin of admins) {
          await notificationService.createNotification({
            userId: admin._id,
            type: 'admin_alert',
            message: `⚠️ Placement Anomaly: ${anomaliesDetected.length} user(s) flagged for XP farming (suspiciously high activity).`,
            channel: 'in_app'
          });
        }
      }

    } catch (err) {
      console.error('Error in computePlacementAnalytics:', err);
    }
  }
}

module.exports = new CronService();
