import { getEmailSenderAdapter } from "@/infrastructure/mail/EmailProviderFactory";

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

export function buildVerificationUrl(token: string) {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail({
  to,
  verificationUrl,
}: VerificationMailInput) {
  const sender = getEmailSenderAdapter();
  await sender.sendVerification({ to, verificationUrl });
}
