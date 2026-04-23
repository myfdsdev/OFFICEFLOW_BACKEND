import transporter from '../config/email.js';

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log(`⚠️  Email skipped (not configured): ${subject} → ${to}`);
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw error;
  }
};

export const sendWelcomeEmail = async (to, name) => {
  return sendEmail({
    to,
    subject: 'Welcome to Workflow! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">Welcome, ${name}!</h1>
        <p>Your account has been created successfully.</p>
        <p>You can now log in and start using Workflow.</p>
        <br>
        <p>Best regards,<br>The Workflow Team</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to, resetLink) => {
  return sendEmail({
    to,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Password Reset Request</h1>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        <p style="color: #666; margin-top: 20px;">This link expires in 1 hour.</p>
      </div>
    `,
  });
};

export const sendLeaveApprovalEmail = async (to, name, leaveType, startDate, endDate, status) => {
  const color = status === 'approved' ? '#10B981' : '#EF4444';
  return sendEmail({
    to,
    subject: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${color};">Leave ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h1>
        <p>Hi ${name},</p>
        <p>Your ${leaveType} leave request from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been <strong>${status}</strong>.</p>
      </div>
    `,
  });
};