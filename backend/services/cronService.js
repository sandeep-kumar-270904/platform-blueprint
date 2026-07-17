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
    });

    // Run every day at midnight for daily job alerts
    cron.schedule('0 0 * * *', async () => {
      this.checkDailyJobAlerts();
    });

    // Run every hour to check ingestion health
    cron.schedule('0 * * * *', async () => {
      this.checkNewsIngestionHealth();
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
          await Notification.create({
            userId: b.menteeId,
            type: 'session_reminder',
            relatedContentId: b._id,
            message: `Reminder: You have an upcoming 1-on-1 session in 24 hours.`
          });
          await Notification.create({
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
            await Notification.create({
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
          await Notification.create({
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
}

module.exports = new CronService();
