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
    text: htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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
