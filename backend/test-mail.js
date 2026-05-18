import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : '***EMPTY***');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

try {
  const info = await transporter.sendMail({
    from: `"SyndicPro" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: 'Test SyndicPro Mailer',
    html: '<h3>Test</h3><p>Si vous recevez ceci, le mailer fonctionne !</p>'
  });
  console.log('✅ Email envoyé avec succès! ID:', info.messageId);
} catch (err) {
  console.error('❌ Erreur envoi email:', err.message);
  console.error('Code:', err.code);
  console.error('Full error:', err);
}
