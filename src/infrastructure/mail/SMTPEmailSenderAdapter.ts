import nodemailer from "nodemailer";
import type { EmailSenderPort } from "@/application/ports/out/EmailSenderPort";

type VerificationMailInput = {
  to: string;
  verificationUrl: string;
};

function getFromAddress() {
  return process.env.EMAIL_FROM?.trim() || "no-reply@nextquizai.local";
}

function validateSmtpConfig() {
  const errors: string[] = [];

  if (!process.env.SMTP_HOST?.trim()) {
    errors.push("SMTP_HOST is not configured");
  }
  if (!process.env.SMTP_PORT?.trim()) {
    errors.push("SMTP_PORT is not configured");
  }
  if (!process.env.SMTP_USER?.trim()) {
    errors.push("SMTP_USER is not configured");
  }
  if (!process.env.SMTP_PASS?.trim()) {
    errors.push("SMTP_PASS is not configured");
  }

  return errors;
}

function getSmtpTransporter() {
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || 587);

  const allowSelfSigned =
    process.env.SMTP_ALLOW_SELF_SIGNED === "true" || process.env.NODE_ENV !== "production";

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
    },
    tls: {
      // When developing or when explicitly allowed, accept self-signed certs.
      rejectUnauthorized: !allowSelfSigned,
    },
  });
}

async function sendWithSmtp({
  to,
  verificationUrl,
}: VerificationMailInput) {
  const configErrors = validateSmtpConfig();
  if (configErrors.length > 0) {
    throw new Error(`SMTP configuration incomplete: ${configErrors.join(", ")}`);
  }

  const transporter = getSmtpTransporter();
  const fromAddress = getFromAddress();

  // Skip verification in test environment to avoid actual SMTP connection attempts
  if (process.env.NODE_ENV !== "test") {
    const allowSelfSigned =
      process.env.SMTP_ALLOW_SELF_SIGNED === "true" || process.env.NODE_ENV !== "production";

    try {
      await transporter.verify();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const isSelfSigned = /self[- ]?signed/i.test(message) || message.includes("self signed certificate");
      if (allowSelfSigned && isSelfSigned) {
        console.warn(`[SMTP] Ignoring self-signed certificate verification error: ${message}`);
      } else {
        throw new Error(`SMTP connection verification failed: ${message}`);
      }
    }
  }

  try {
    const result = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: "Verify your QuizUPM account",
      text: `Welcome to QuizUPM. Verify your account by visiting: ${verificationUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to <strong>QuizUPM</strong></h2>
          <p>Thank you for signing up. Please verify your email address to activate your account.</p>
          <p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
              Verify Your Email
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            Or copy and paste this link in your browser:<br />
            <code>${verificationUrl}</code>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This link expires in 24 hours.
          </p>
        </div>
      `,
    });

    return { messageId: result.messageId || result.response };
  } finally {
    transporter.close();
  }
}

export class SMTPEmailSenderAdapter implements EmailSenderPort {
  async sendVerification(input: { to: string; verificationUrl: string }) {
    try {
      const result = await sendWithSmtp(input);
      console.info(`[SMTP] Verification email sent to ${input.to} (ID: ${result.messageId})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[SMTP] Failed to send verification email to ${input.to}: ${message}`);
      throw error;
    }
  }
}
