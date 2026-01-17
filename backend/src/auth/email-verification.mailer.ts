import nodemailer from 'nodemailer';

export async function sendEmailVerificationCode(params: {
  to: string;
  code: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP is not configured');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const appName = process.env.APP_NAME || 'JU Activity Hub';

  await transporter.sendMail({
    from,
    to: params.to,
    subject: `${appName} verification code`,
    text: `Your verification code is: ${params.code}\n\nThis code expires in 15 minutes.`,
  });
}
