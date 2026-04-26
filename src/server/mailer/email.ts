import nodemailer from "nodemailer";

type VerificationMailInput = {
  to: string;
  verificationUrl: string;
};

function getAppBaseUrl() {
  return (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000"
  );
}

function getFromAddress() {
  return process.env.EMAIL_FROM?.trim() || "no-reply@nextquizai.local";
}

function canSendSmtpMail() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

export function buildVerificationUrl(token: string) {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail({
  to,
  verificationUrl,
}: VerificationMailInput) {
  if (!canSendSmtpMail()) {
    console.info(
      `SMTP is not configured. Verification link for ${to}: ${verificationUrl}`,
    );

    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured in production.");
    }

    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Verify your QuizUPM account",
    text: `Welcome to QuizUPM. Verify your account by visiting: ${verificationUrl}`,
    html: `
      <p>Welcome to <strong>QuizUPM</strong>.</p>
      <p>Click the link below to verify your account:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}
