import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendMail = async (options) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Parrow Skills" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log('Email sent successfully: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send Welcome Email to newly registered user
 */
export const sendWelcomeEmail = async (to, name, role) => {
  const roleName = role === 'worker' ? 'Partner/Worker' : 'Customer';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #ff8c00; text-align: center;">Welcome to Parrow Skills!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for registering as a <strong>${roleName}</strong> on Parrow Skills, India's leading on-demand services platform.</p>
      <p>We are excited to have you on board! You can now log into your account and start exploring all the features available to you.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">This is an automated email, please do not reply directly.</p>
    </div>
  `;
  return sendMail({
    to,
    subject: 'Welcome to Parrow Skills!',
    html,
  });
};

/**
 * Send Login Notification Alert Email
 */
export const sendLoginAlertEmail = async (to, name, role) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">New Login Detected</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>This is a quick security alert to let you know that your <strong>Parrow Skills (${role})</strong> account was logged into just now.</p>
      <p>If this was you, you can safely ignore this email. If you did not log in, please reset your password immediately to secure your account.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">This is an automated security notification.</p>
    </div>
  `;
  return sendMail({
    to,
    subject: 'Security Alert: New Login to Parrow Skills',
    html,
  });
};

/**
 * Send Password Reset OTP Email
 */
export const sendPasswordResetOtpEmail = async (to, name, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #ff8c00; text-align: center;">Parrow Skills - Verification Code</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We received a request to reset the password for your Parrow Skills account.</p>
      <p>Please use the following 6-digit One-Time Password (OTP) to complete your password reset. This code is valid for 15 minutes.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; color: #ff8c00; letter-spacing: 5px; padding: 10px 20px; background-color: #fff8f0; border: 1px dashed #ff8c00; border-radius: 5px; display: inline-block;">${otp}</span>
      </div>
      <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">This is an automated security email, please do not reply directly.</p>
    </div>
  `;
  return sendMail({
    to,
    subject: `Parrow Skills - Password Reset Code: ${otp}`,
    html,
  });
};

/**
 * Send Email Verification OTP Email for Registration
 */
export const sendRegisterOtpEmail = async (to, name, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #ff8c00; text-align: center;">Welcome to Parrow Skills</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for choosing Parrow Skills. To complete your registration and verify your email address, please use the following 6-digit verification code:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; color: #ff8c00; letter-spacing: 5px; padding: 10px 20px; background-color: #fff8f0; border: 1px dashed #ff8c00; border-radius: 5px; display: inline-block;">${otp}</span>
      </div>
      <p>This code is valid for 15 minutes. If you did not request this code, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">This is an automated security email, please do not reply directly.</p>
    </div>
  `;
  return sendMail({
    to,
    subject: `Parrow Skills - Email Verification Code: ${otp}`,
    html,
  });
};

/**
 * Send Invoice Email to Customer upon project completion
 */
export const sendInvoiceEmail = async (to, name, order) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #ddd; border-radius: 12px; background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="text-align: center; border-bottom: 2px solid #ff8c00; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #ff8c00; margin: 0; font-size: 24px; font-weight: 800;">Parrow Skills</h1>
        <p style="margin: 5px 0 0; color: #666; font-size: 13px;">Service Invoice & Receipt</p>
      </div>

      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for choosing Parrow Skills! Your service project is complete. Below is your official receipt and invoice details:</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <div style="margin-bottom: 10px; font-size: 14px;"><strong style="color: #334155;">Booking Reference:</strong> #${order.id}</div>
        <div style="margin-bottom: 10px; font-size: 14px;"><strong style="color: #334155;">Service Category:</strong> ${order.vehicle_name || 'Professional Service'}</div>
        <div style="margin-bottom: 10px; font-size: 14px;"><strong style="color: #334155;">Duration:</strong> ${order.duration} ${order.unit || 'trips'}</div>
        <div style="margin-bottom: 10px; font-size: 14px;"><strong style="color: #334155;">Date:</strong> ${order.booking_date}</div>
        <div style="margin-bottom: 10px; font-size: 14px;"><strong style="color: #334155;">Partner Assigned:</strong> ${order.worker_name || 'Verified Professional'}</div>
      </div>

      <div style="border-top: 1px dashed #e2e8f0; border-bottom: 1px dashed #e2e8f0; padding: 15px 0; margin: 20px 0; font-size: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #1e293b;">
          <span>Total Amount Paid:</span>
          <span style="color: #10b981; font-size: 18px;">₹${parseFloat(order.total_amount || 0).toLocaleString()}</span>
        </div>
      </div>

      <p style="text-align: center; color: #475569; font-size: 13px; margin-top: 25px;">
        We hope you enjoyed our service! If you have any queries, feel free to reach out to us at <strong>support@parrowskills.in</strong>.
      </p>

      <hr style="border: 0; border-top: 1px dashed #eee; margin: 20px 0;">
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This is an automated invoice, please do not reply directly.</p>
    </div>
  `;

  return sendMail({
    to,
    subject: `Invoice for Booking #${order.id} - Parrow Skills`,
    html,
  });
};
