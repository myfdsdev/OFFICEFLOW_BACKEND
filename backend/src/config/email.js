import nodemailer from 'nodemailer';

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email config error:', error.message);
    } else {
      console.log('✅ Email server ready');
    }
  });
} else {
  console.log('⚠️  Email not configured — email features disabled');
}

export default transporter;