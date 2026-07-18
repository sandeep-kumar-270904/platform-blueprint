const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');

const createNotification = async (data, io = null) => {
  try {
    const { userId, type, channel = 'in_app', emailData } = data;
    const user = await User.findById(userId).select('notificationPreferences email');
    
    let shouldSendInApp = true;
    let shouldSendEmail = channel === 'email' || channel === 'both';

    if (user && user.notificationPreferences) {
      const prefs = user.notificationPreferences;
      
      switch(type) {
        case 'question_answered':
        case 'question_upvoted':
          shouldSendInApp = prefs.question_answered !== false;
          shouldSendEmail = false;
          break;
        case 'review_upvoted':
          shouldSendInApp = prefs.review_upvoted !== false;
          shouldSendEmail = false;
          break;
        case 'answer_upvoted':
          shouldSendInApp = prefs.answer_upvoted !== false;
          shouldSendEmail = false;
          break;
        case 'event_reminder':
        case 'event_feedback_request':
          shouldSendInApp = prefs.event_reminder !== false;
          shouldSendEmail = false;
          break;
        case 'event_approved':
          shouldSendInApp = prefs.event_approved !== false;
          shouldSendEmail = false;
          break;
        case 'event_rejected':
          shouldSendInApp = prefs.event_rejected !== false;
          shouldSendEmail = false;
          break;
        case 'event_updated':
        case 'event_cancelled':
          shouldSendInApp = prefs.event_cancelled_or_changed !== false;
          shouldSendEmail = false;
          break;
        case 'waitlist_confirmed':
          shouldSendInApp = prefs.waitlist_promoted !== false;
          shouldSendEmail = false;
          break;
        // Phase 3 Job Board Types
        case 'application_submitted':
        case 'application_status_changed':
          if (prefs.applicationUpdates) {
            shouldSendInApp = prefs.applicationUpdates.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.applicationUpdates.email !== false;
          }
          break;
        case 'new_applicant':
          if (prefs.newApplicants) {
            shouldSendInApp = prefs.newApplicants.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.newApplicants.email !== false;
          }
          break;
        case 'recruiter_verified':
        case 'recruiter_rejected':
        case 'recruiter_banned':
          if (prefs.accountVerification) {
            shouldSendInApp = prefs.accountVerification.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.accountVerification.email !== false;
          }
          break;
        case 'application_deadline_approaching':
          if (prefs.deadlines) {
            shouldSendInApp = prefs.deadlines.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.deadlines.email !== false;
          }
          break;
        // Phase 5/6 Types
        case 'profile_viewed':
          if (prefs.profileViews) {
            shouldSendInApp = prefs.profileViews.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.profileViews.email !== false;
          }
          break;
        case 'job_invite_received':
          if (prefs.jobAlerts) { // fallback or new pref
            shouldSendInApp = true; // invites are important
            shouldSendEmail = shouldSendEmail;
          }
          break;
        // Phase 3 Quiz Types
        case 'live_session_reminder':
        case 'live_session_invite':
          if (prefs.liveSessionReminders) {
            shouldSendInApp = prefs.liveSessionReminders.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.liveSessionReminders.email !== false;
          }
          break;
        case 'live_session_results':
          if (prefs.liveSessionResults) {
            shouldSendInApp = prefs.liveSessionResults.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.liveSessionResults.email !== false;
          }
          break;
        case 'leaderboard_overtaken':
        case 'badge_earned':
          if (prefs.leaderboardActivity) {
            shouldSendInApp = prefs.leaderboardActivity.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.leaderboardActivity.email !== false;
          }
          break;
        case 'quiz_reported':
        case 'quiz_deleted':
          if (prefs.quizModeration) {
            shouldSendInApp = prefs.quizModeration.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.quizModeration.email !== false;
          }
          break;
        case 'quiz_challenge_received':
          if (prefs.quizChallenges) {
            shouldSendInApp = prefs.quizChallenges.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.quizChallenges.email !== false;
          }
          break;
        case 'tournament_round_result':
          if (prefs.quizTournaments) {
            shouldSendInApp = prefs.quizTournaments.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.quizTournaments.email !== false;
          }
          break;
        case 'class_quiz_assigned':
        case 'class_quiz_deadline_approaching':
          if (prefs.classQuizzes) {
            shouldSendInApp = prefs.classQuizzes.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.classQuizzes.email !== false;
          }
          break;
        case 'ai_questions_review_ready':
          if (prefs.aiQuestionsReview) {
            shouldSendInApp = prefs.aiQuestionsReview.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.aiQuestionsReview.email !== false;
          }
          break;
        case 'dispute_update':
        case 'referral_credit_earned':
          if (prefs.mentorUpdates) {
            shouldSendInApp = prefs.mentorUpdates.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.mentorUpdates.email !== false;
          }
          break;
        case 'subscription_renewal':
        case 'subscription_failure':
          if (prefs.subscriptions) {
            shouldSendInApp = prefs.subscriptions.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.subscriptions.email !== false;
          }
          break;
        case 'forum_reply':
          if (prefs.communityForums) {
            shouldSendInApp = prefs.communityForums.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.communityForums.email !== false;
          }
          break;
        case 'cohort_session_scheduled':
          if (prefs.cohorts) {
            shouldSendInApp = prefs.cohorts.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.cohorts.email !== false;
          }
          break;
        case 'learning_path_step_suggestion':
          if (prefs.learningPaths) {
            shouldSendInApp = prefs.learningPaths.inApp !== false;
            shouldSendEmail = shouldSendEmail && prefs.learningPaths.email !== false;
          }
          break;
        // Always send in-app and email for critical admin actions if channel requested it
        case 'job_auto_hidden':
        case 'job_deleted_by_admin':
        case 'article_approved':
        case 'article_rejected':
          // Bypass preferences for critical warnings
          break;
      }
    }
    
    // Attempt Email Send if applicable
    if (shouldSendEmail && user && user.email) {
      try {
        switch(type) {
          case 'application_submitted':
            await emailService.sendApplicationSubmittedEmail(user.email, emailData.jobTitle, data.actionUrl);
            break;
          case 'application_status_changed':
            await emailService.sendApplicationStatusEmail(user.email, emailData.jobTitle, emailData.newStatus, data.actionUrl);
            break;
          case 'new_applicant':
            await emailService.sendNewApplicantEmail(user.email, emailData.jobTitle, emailData.applicantName, data.actionUrl);
            break;
          case 'recruiter_verified':
            await emailService.sendRecruiterVerificationEmail(user.email, true);
            break;
          case 'recruiter_rejected':
            await emailService.sendRecruiterVerificationEmail(user.email, false);
            break;
          case 'job_auto_hidden':
            await emailService.sendJobHiddenEmail(user.email, emailData.jobTitle);
            break;
          case 'job_deleted_by_admin':
            await emailService.sendJobDeletedEmail(user.email, emailData.jobTitle, emailData.adminNote);
            break;
          case 'recruiter_banned':
            await emailService.sendRecruiterBannedEmail(user.email);
            break;
          case 'application_deadline_approaching':
            await emailService.sendDeadlineApproachingEmail(user.email, emailData.jobTitle, data.actionUrl);
            break;
          // Phase 3 Quiz Emails
          case 'live_session_reminder':
            await emailService.sendLiveSessionReminderEmail(user.email, emailData.quizTitle, emailData.joinCode, data.actionUrl);
            break;
          case 'live_session_invite':
            await emailService.sendLiveSessionInviteEmail(user.email, emailData.quizTitle, emailData.inviterName, emailData.joinCode, data.actionUrl);
            break;
          case 'quiz_reported':
            await emailService.sendQuizReportedEmail(user.email, emailData.quizTitle);
            break;
          case 'quiz_deleted':
            await emailService.sendQuizDeletedEmail(user.email, emailData.quizTitle, emailData.adminNote);
            break;
          case 'leaderboard_overtaken':
            await emailService.sendLeaderboardOvertakenEmail(user.email, emailData.quizTitle, data.actionUrl);
            break;
          case 'live_session_results':
            await emailService.sendLiveSessionResultsEmail(user.email, emailData.quizTitle, emailData.score, data.actionUrl);
            break;
          case 'quiz_challenge_received':
            await emailService.sendQuizChallengeEmail(user.email, emailData.challengerName, data.actionUrl);
            break;
          case 'tournament_round_result':
            await emailService.sendTournamentResultEmail(user.email, emailData.tournamentName, emailData.result, data.actionUrl);
            break;
          case 'class_quiz_assigned':
            await emailService.sendClassQuizAssignedEmail(user.email, emailData.quizTitle, emailData.className, data.actionUrl);
            break;
          case 'class_quiz_deadline_approaching':
            await emailService.sendClassQuizDeadlineEmail(user.email, emailData.quizTitle, emailData.className, data.actionUrl);
            break;
          case 'ai_questions_review_ready':
            await emailService.sendAiQuestionsReviewEmail(user.email, emailData.bankName, data.actionUrl);
            break;
        }
        data.emailSent = true;
        data.emailSentAt = new Date();
      } catch (emailErr) {
        console.error('Failed to send notification email:', emailErr);
        data.emailSent = false;
        data.emailFailureReason = emailErr.message || 'Unknown error';
        // Do not throw, continue to in-app notification
      }
    }

    if (!shouldSendInApp) {
      return null;
    }
    
    const notification = await Notification.create(data);

    // Emit live update
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notification);
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

module.exports = {
  createNotification
};
