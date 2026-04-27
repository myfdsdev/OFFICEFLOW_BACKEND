import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;

// 🔥 Validate required envs
const requiredEnv = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.log('⚠️ Email not configured — missing env:', missingEnv.join(', '));
} else {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // true only for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // ✅ Verify connection
    transporter.verify()
      .then(() => {
        console.log('✅ Email server ready');
      })
      .catch((error) => {
        console.error('❌ Email config error:', error.message);
      });

  } catch (err) {
    console.error('❌ Email transporter setup failed:', err.message);

  }
}

console.log('SMTP USER:', process.env.SMTP_USER);
export default transporter;