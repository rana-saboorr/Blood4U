const nodemailer = require('nodemailer');

const createTransport = () => {
  const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const SMTP_PORT = process.env.SMTP_PORT || process.env.MAIL_PORT;
  const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER;
  const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASS;
  const SMTP_SECURE = process.env.SMTP_SECURE || 'false';

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'SMTP configuration missing. Set SMTP_* or MAIL_* variables in backend .env'
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendOtpEmail = async ({ email, otp, purpose }) => {
  const transporter = createTransport();
  const title = purpose === 'signup' ? 'Blood4U Signup OTP' : 'Blood4U Password Reset OTP';
  const actionText = purpose === 'signup' ? 'complete signup' : 'reset your password';

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.SMTP_USER || process.env.MAIL_USER,
    to: email,
    subject: title,
    text: `Your OTP is ${otp}. It is valid for 50 seconds. Use it to ${actionText}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Blood4U Verification</h2>
        <p>Your OTP code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p>This OTP is valid for <strong>50 seconds</strong>.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};

const sendSimpleEmail = async ({ to, subject, text }) => {
  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.SMTP_USER || process.env.MAIL_USER,
    to,
    subject,
    text,
  });
};

module.exports = { sendOtpEmail, sendSimpleEmail };
