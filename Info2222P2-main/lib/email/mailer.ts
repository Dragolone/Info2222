import nodemailer from 'nodemailer';

// Create a reusable transporter
const createTransporter = () => {
  // Check for required environment variables
  const host = process.env.EMAIL_SERVER_HOST;
  const port = parseInt(process.env.EMAIL_SERVER_PORT || '587', 10);
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error('Missing email configuration. Please check your environment variables.');
  }

  // Create the nodemailer transporter
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send a verification email to a user
 * @param to - Recipient email address
 * @param token - Verification token
 */
export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  try {
    const transporter = createTransporter();
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;

    await transporter.sendMail({
      from: `"Security Team" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Verify Your Email Address',
      text: `Please verify your email by clicking the following link: ${verificationUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p>If the button doesn't work, you can also click this link or copy and paste it into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>Thanks,<br>The Security Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send a password reset email to a user
 * @param to - Recipient email address
 * @param token - Password reset token
 */
export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Security Team" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Reset Your Password',
      text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>You requested a password reset. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can also click this link or copy and paste it into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <p>Thanks,<br>The Security Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For security reasons, we recommend not sharing this email with anyone.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send a security notification email
 * @param to - Recipient email address
 * @param title - Notification title
 * @param message - Notification message
 */
export const sendSecurityNotificationEmail = async (
  to: string,
  title: string,
  message: string
): Promise<void> => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Security Alert" <${process.env.EMAIL_FROM}>`,
      to,
      subject: `Security Alert: ${title}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Security Alert: ${title}</h2>
          <div style="padding: 20px; border-left: 4px solid #d32f2f; background-color: #ffebee; margin: 20px 0;">
            <p>${message}</p>
          </div>
          <p>If you did not perform this action, please reset your password immediately and contact support.</p>
          <p>Thanks,<br>The Security Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            <p>This is an automated security notification. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending security notification email:', error);
    throw new Error('Failed to send security notification email');
  }
};
