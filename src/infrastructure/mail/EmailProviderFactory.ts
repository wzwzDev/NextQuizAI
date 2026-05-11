import type { EmailSenderPort } from "@/application/ports/out/EmailSenderPort";
import { ResendEmailSenderAdapter } from "@/infrastructure/mail/ResendEmailSenderAdapter";
import { SMTPEmailSenderAdapter } from "@/infrastructure/mail/SMTPEmailSenderAdapter";

export type EmailProvider = "resend" | "smtp";

function getConfiguredProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER?.trim() || "").toLowerCase();

  // Explicit EMAIL_PROVIDER setting takes absolute priority
  if (provider === "smtp") {
    return "smtp";
  }
  if (provider === "resend") {
    return "resend";
  }

  // Auto-detect: prefer Resend if key exists, else SMTP if credentials exist
  if (process.env.RESEND_API_KEY?.trim()) {
    return "resend";
  }

  if (
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_PORT?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  ) {
    return "smtp";
  }

  // Default to Resend for production, SMTP for development
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[EmailProviderFactory] No email provider configured. Defaulting to Resend. Set RESEND_API_KEY or EMAIL_PROVIDER=smtp.",
    );
    return "resend";
  }

  return "smtp";
}

let cachedProvider: EmailSenderPort | null = null;

export function getEmailSenderAdapter(): EmailSenderPort {
  if (cachedProvider) {
    return cachedProvider;
  }

  const provider = getConfiguredProvider();

  if (provider === "resend") {
    cachedProvider = new ResendEmailSenderAdapter();
    console.info("[EmailProviderFactory] Using Resend email provider");
  } else {
    cachedProvider = new SMTPEmailSenderAdapter();
    console.info("[EmailProviderFactory] Using SMTP email provider");
  }

  return cachedProvider;
}

export function resetEmailSenderAdapter() {
  cachedProvider = null;
}
