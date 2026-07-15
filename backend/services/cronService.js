const cron = require('node-cron');
const MentorBooking = require('../models/MentorBooking');
const { AMASession } = require('../models/AMA');
const Notification = require('../models/Notification');

class CronService {
  init() {
    console.log('⏳ Initializing Cron Service...');

    // Run every minute for testing, or typically every 5 mins in production
    // For Phase 3, we run every 5 mins.
    cron.schedule('*/5 * * * *', async () => {
      this.checkSessionReminders();
    });

    // Run every minute to transition AMA statuses
    // Run every minute to transition AMA statuses and check expired holds
    cron.schedule('* * * * *', async () => {
      this.transitionAMAStatuses();
      this.checkExpiredHolds();
      this.checkNoShows();
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
}

module.exports = new CronService();
