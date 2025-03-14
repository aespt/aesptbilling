import nodemailer from 'nodemailer';

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html } = options;

  console.log(process.env.EMAIL_USER);
  console.log(process.env.EMAIL_PASSWORD);
  console.log(to, subject);
  
  const mailOptions = {
    from: `"AESPT Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Generate a password reset email with token
 */
export function generatePasswordResetEmail(to: string, token: string): EmailOptions {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  
  return {
    to,
    subject: 'AESPT - Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #3b82f6, #4f46e5); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Reset Your Password</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Hello,</p>
          <p>We received a request to reset your password for your AESPT account. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(to right, #3b82f6, #4f46e5); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If you didn't request this, please ignore this email. The password reset link is valid for 7 days.</p>
          <p>For security reasons, this link will expire in 7 days and can only be used once.</p>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br>The AESPT Team</p>
          </div>
        </div>
      </div>
    `
  };
} 