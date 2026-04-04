const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  RESET_PASSWORD_URL,
} = process.env;

const hasEmailConfig = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

function createTransporter() {
  if (!hasEmailConfig) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendResetEmail(to, resetUrl) {
  const transporter = createTransporter();
  const subject = 'CollabCode Password Reset';
  const html = `<p>We received a request to reset your password.</p>
<p>Click the link below to reset it:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you did not request this, you can ignore this message.</p>`;

  if (!transporter) {
    console.warn('SMTP is not configured. Password reset link:', resetUrl);
    return false;
  }

  const info = await transporter.sendMail({
    from: SMTP_USER,
    to,
    subject,
    html,
  });

  console.log('Password reset email sent:', info.messageId);
  return true;
}

function buildResetUrl(token) {
  const base = RESET_PASSWORD_URL || 'http://localhost:3000/reset-password';
  return `${base}?token=${encodeURIComponent(token)}`;
}

module.exports = {
  sendResetEmail,
  buildResetUrl,
};
