const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Use OAuth2 if EMAIL_CLIENT_ID is provided, otherwise fallback to plain password
  if (process.env.EMAIL_CLIENT_ID) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN
      }
    });
  } else {
    // Fallback for standard App Password (less secure app or 2FA app password)
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'mock@example.com',
        pass: process.env.EMAIL_PASS || 'mockpass'
      }
    });
  }
};

const sendEmailBase = async (to, subject, htmlContent, retries = 1) => {
  if (!process.env.EMAIL_USER) {
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(htmlContent);
    return;
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"NotesHub" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
    // Add simple plain text fallback by stripping HTML tags loosely
    text: htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    headers: {
      'List-Unsubscribe': `<mailto:unsubscribe@${process.env.EMAIL_USER ? process.env.EMAIL_USER.split('@')[1] : 'noteshub.com'}>`,
    }
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    if (retries > 0) {
      console.warn(`Email failed to send. Retrying... (${retries} left)`);
      // Simple backoff
      await new Promise(res => setTimeout(res, 1000));
      return sendEmailBase(to, subject, htmlContent, retries - 1);
    }
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error('Something went wrong sending that email — try again in a moment');
  }
};

const getBaseTemplate = (headline, bodyText, buttonText, buttonLink, plainTextLink) => `
<div style="background-color: #FDFBF7; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px 20px; color: #09090b; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 30px;">
    <!-- Open Book Icon SVG (inline representation) -->
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  </div>
  
  <h1 style="font-family: 'Georgia', serif; font-size: 24px; font-weight: normal; margin-bottom: 16px; text-align: center;">${headline}</h1>
  
  <p style="font-size: 16px; line-height: 1.5; text-align: center; margin-bottom: 32px; color: #3f3f46;">
    ${bodyText}
  </p>

  ${buttonText && buttonLink ? `
  <div style="text-align: center; margin-bottom: 32px;">
    <a href="${buttonLink}" style="display: inline-block; background-color: #09090b; color: #fafafa; padding: 12px 24px; text-decoration: none; font-weight: 500; border-bottom: 3px solid #f59e0b; border-radius: 2px;">
      ${buttonText}
    </a>
  </div>
  ` : ''}

  ${plainTextLink ? `
  <div style="text-align: center;">
    <a href="${plainTextLink}" style="font-size: 14px; color: #71717a; text-decoration: underline;">
      ${plainTextLink.text || 'That wasn\'t me'}
    </a>
  </div>
  ` : ''}
  
  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 40px 0 20px;" />
  <p style="font-size: 12px; color: #a1a1aa; text-align: center;">
    © ${new Date().getFullYear()} NotesHub. Keep learning.
  </p>
</div>
`;

exports.sendResetPasswordEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
  const html = getBaseTemplate(
    'Reset your password',
    'We received a request to reset your password. This link expires in 1 hour.',
    'Set a new password',
    resetLink
  );
  await sendEmailBase(email, 'Reset your NotesHub password', html);
};

exports.sendVerifyEmail = async (email, verifyToken) => {
  const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verifyToken}`;
  const html = getBaseTemplate(
    'Confirm your email',
    'Welcome to NotesHub. Please confirm your email address to get started.',
    'Confirm email',
    verifyLink
  );
  await sendEmailBase(email, 'Confirm your NotesHub email', html);
};

exports.sendEmailChangeConfirmation = async (newEmail, oldEmail, changeToken) => {
  const confirmLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/settings/confirm-email?token=${changeToken}`;
  const html = getBaseTemplate(
    'Confirm your new email',
    `You requested to change your email from ${oldEmail}. Click below to confirm this new address.`,
    'Confirm new email',
    confirmLink
  );
  await sendEmailBase(newEmail, 'Confirm your new NotesHub email', html);
};

exports.sendNewDeviceAlert = async (email, os, browser, region) => {
  const html = getBaseTemplate(
    'New sign-in to your account',
    `We noticed a new sign-in from <strong>${browser} on ${os}</strong> near <strong>${region}</strong> at ${new Date().toLocaleString()}.`,
    null,
    null,
    { text: 'That wasn\'t me? Secure your account', href: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/settings/security` }
  );
  await sendEmailBase(email, 'New sign-in to NotesHub', html);
};

// --- Job Board Phase 3 Emails ---

const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:8080';
const preferencesLink = { text: 'Notification Preferences', href: `${getFrontendUrl()}/settings/notifications` };

exports.sendApplicationSubmittedEmail = async (email, jobTitle, actionUrl) => {
  const html = getBaseTemplate(
    'Application Submitted',
    `Your application for <strong>${jobTitle}</strong> has been successfully submitted. We will notify you when the status changes.`,
    'View Application',
    `${getFrontendUrl()}${actionUrl}`,
    preferencesLink
  );
  await sendEmailBase(email, `Application Submitted: ${jobTitle}`, html);
};

exports.sendApplicationStatusEmail = async (email, jobTitle, newStatus, actionUrl) => {
  const html = getBaseTemplate(
    'Application Status Updated',
    `The status of your application for <strong>${jobTitle}</strong> has been updated to: <strong>${newStatus}</strong>.`,
    'View Application',
    `${getFrontendUrl()}${actionUrl}`,
    preferencesLink
  );
  await sendEmailBase(email, `Application Update: ${jobTitle}`, html);
};

exports.sendNewApplicantEmail = async (email, jobTitle, applicantName, actionUrl) => {
  const html = getBaseTemplate(
    'New Applicant',
    `<strong>${applicantName}</strong> has just applied to your job posting for <strong>${jobTitle}</strong>.`,
    'Review Application',
    `${getFrontendUrl()}${actionUrl}`,
    preferencesLink
  );
  await sendEmailBase(email, `New Applicant for ${jobTitle}`, html);
};

exports.sendRecruiterVerificationEmail = async (email, isApproved) => {
  const status = isApproved ? 'approved' : 'rejected';
  const message = isApproved 
    ? 'Your recruiter profile has been verified! You can now post jobs and hire top talent.' 
    : 'Your recruiter verification request was rejected. Please review your details and try again.';
  const html = getBaseTemplate(
    `Verification ${isApproved ? 'Approved' : 'Rejected'}`,
    message,
    'Go to Dashboard',
    `${getFrontendUrl()}/jobs`,
    preferencesLink
  );
  await sendEmailBase(email, `Recruiter Verification ${isApproved ? 'Approved' : 'Rejected'}`, html);
};

exports.sendJobHiddenEmail = async (email, jobTitle) => {
  const html = getBaseTemplate(
    'Job Hidden',
    `Your job posting for <strong>${jobTitle}</strong> has received multiple reports and was automatically hidden pending review.`,
    'View Dashboard',
    `${getFrontendUrl()}/jobs`,
    preferencesLink
  );
  await sendEmailBase(email, `Action Required: Job Hidden - ${jobTitle}`, html);
};

exports.sendJobDeletedEmail = async (email, jobTitle, adminNote) => {
  const html = getBaseTemplate(
    'Job Deleted',
    `Your job posting for <strong>${jobTitle}</strong> has been deleted by an administrator. ${adminNote ? `<br/><br/>Reason: ${adminNote}` : ''}`,
    null,
    null,
    preferencesLink
  );
  await sendEmailBase(email, `Job Deleted - ${jobTitle}`, html);
};

exports.sendRecruiterBannedEmail = async (email) => {
  const html = getBaseTemplate(
    'Account Suspended',
    'Your recruiter privileges have been suspended by an administrator due to violations of our policies.',
    null,
    null,
    preferencesLink
  );
  await sendEmailBase(email, 'Important: Account Suspended', html);
};

exports.sendDeadlineApproachingEmail = async (email, jobTitle, actionUrl) => {
  const html = getBaseTemplate(
    'Application Deadline Approaching',
    `The application deadline for your job posting <strong>${jobTitle}</strong> is in less than 48 hours.`,
    'View Applicants',
    `${getFrontendUrl()}${actionUrl}`,
    preferencesLink
  );
  await sendEmailBase(email, `Deadline Approaching: ${jobTitle}`, html);
};

// --- Quiz & Live Session Phase 3 Emails ---

exports.sendLiveSessionReminderEmail = async (email, quizTitle, joinCode, actionUrl) => {
  const html = getBaseTemplate(
    'Live Session Starting Soon',
    `A live session for <strong>${quizTitle}</strong> is starting in about 10 minutes. <br/><br/>Join Code: <strong>${joinCode}</strong>`,
    'Join Session',
    `${getFrontendUrl()}${actionUrl}`,
    preferencesLink
  );
  await sendEmailBase(email, `Starting Soon: Live Quiz - ${quizTitle}`, html);
};

exports.sendLiveSessionInviteEmail = async (email, quizTitle, inviterName, joinCode, actionUrl) => {
  const html = getBaseTemplate(
    'You are invited to a Live Quiz',
    `<strong>${inviterName}</strong> has invited you to join a live session for <strong>${quizTitle}</strong>. <br/><br/>Join Code: <strong>${joinCode}</strong>`,
    'Join Session',
    `${getFrontendUrl()}${actionUrl}`,
    preferencesLink
  );
  await sendEmailBase(email, `Invite: Live Quiz - ${quizTitle}`, html);
};

exports.sendQuizReportedEmail = async (email, quizTitle) => {
  const html = getBaseTemplate(
    'Quiz Under Review',
    `Your quiz <strong>${quizTitle}</strong> has received multiple reports from the community and has been temporarily hidden pending review by an administrator.`,
    'Go to Dashboard',
    `${getFrontendUrl()}/my-quizzes`,
    preferencesLink
  );
  await sendEmailBase(email, `Notice: Quiz Under Review - ${quizTitle}`, html);
};

exports.sendQuizDeletedEmail = async (email, quizTitle, adminNote) => {
  const html = getBaseTemplate(
    'Quiz Deleted',
    `Your quiz <strong>${quizTitle}</strong> has been deleted by an administrator. ${adminNote ? `<br/><br/>Reason: ${adminNote}` : ''}`,
    null,
    null,
    preferencesLink
  );
  await sendEmailBase(email, `Quiz Deleted - ${quizTitle}`, html);
};

exports.sendLeaderboardOvertakenEmail = async (email, quizTitle, actionUrl) => {
  const html = getBaseTemplate(
    'Leaderboard Update',
    `Someone just beat your high score on <strong>${quizTitle}</strong>! You've been bumped down the leaderboard.`,
    'Reclaim your spot',
    `${getFrontendUrl()}${actionUrl}`,
    preferencesLink
  );
  await sendEmailBase(email, `You were overtaken on ${quizTitle}!`, html);
};

exports.sendLiveSessionResultsEmail = async (email, quizTitle, score, actionUrl) => {
  const html = getBaseTemplate(
    'Live Quiz Completed',
    `The live session for <strong>${quizTitle}</strong> has concluded. Your final score was <strong>${score}</strong>.`,
    'View Full Results',
    `${getFrontendUrl()}${actionUrl}`,
    preferencesLink
  );
  await sendEmailBase(email, `Results: Live Quiz - ${quizTitle}`, html);
};
exports.sendEmail = sendEmailBase;
