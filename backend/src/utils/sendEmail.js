import transporter from "../config/email.js";

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log(`⚠️  Email skipped (transporter not ready): ${subject} → ${to}`);
    return null;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    console.error(`❌ Cannot send email: SMTP_FROM and SMTP_USER both missing!`);
    return null;
  }

  if (!to) {
    console.error(`❌ Cannot send email: no recipient (to) provided`);
    return null;
  }

  try {
    console.log(`📤 Sending email...`);
    console.log(`   FROM: ${from}`);
    console.log(`   TO: ${to}`);
    console.log(`   SUBJECT: ${subject}`);

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    console.log(`✅ Email sent! ID: ${info.messageId}`);
    if (info.accepted?.length) console.log(`   Accepted: ${info.accepted.join(", ")}`);
    if (info.rejected?.length) console.log(`   ⚠️ Rejected: ${info.rejected.join(", ")}`);
    if (info.response) console.log(`   Server response: ${info.response}`);

    return info;
  } catch (error) {
    console.error(`❌ Email send error:`, error.message);
    console.error(`   Full error:`, error);
    throw error;
  }
};

export const sendWelcomeEmail = async (to, name) => {
  return sendEmail({
    to,
    subject: "Welcome to AttendEase! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #3B82F6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AttendEase!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}! 👋</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your account has been successfully created. We're excited to have you on board!
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            You can now log in and start tracking attendance, managing projects, and connecting with your team.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173'}/Welcome"
               style="background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Login Now
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If you have any questions, just reply to this email — we're here to help.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} AttendEase. All rights reserved.
          </p>
        </div>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to, resetLink) => {
  return sendEmail({
    to,
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937;">Password Reset Request</h1>
        <p style="color: #4b5563; font-size: 16px;">Click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendLeaveApprovalEmail = async (to, name, leaveType, startDate, endDate, status) => {
  const isApproved = status === 'approved';
  return sendEmail({
    to,
    subject: `Leave Request ${isApproved ? 'Approved ✅' : 'Rejected ❌'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: ${isApproved ? '#10b981' : '#ef4444'};">
          Your leave request has been ${status}
        </h1>
        <p style="color: #4b5563; font-size: 16px;">Hi ${name},</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${leaveType}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${startDate}</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${endDate}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> 
            <span style="color: ${isApproved ? '#10b981' : '#ef4444'}; font-weight: bold; text-transform: uppercase;">
              ${status}
            </span>
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          ${isApproved 
            ? 'Your leave has been added to the calendar. Enjoy your time off!' 
            : 'If you have questions, please contact your administrator.'}
        </p>
      </div>
    `,
  });
};