import type { EmailSenderPort } from "@/application/ports/out/EmailSenderPort";

type VerificationMailInput = {
  to: string;
  verificationUrl: string;
};

function getFromAddress() {
  return process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";
}

async function sendWithResend({
  to,
  verificationUrl,
}: VerificationMailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const fromAddress = getFromAddress();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject: "Verify your QuizUPM account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to <strong>QuizUPM</strong></h2>
          <p>Thank you for signing up. Please verify your email address to activate your account.</p>
          <p>
            <a href="${verificationUrl}" target="_blank" rel="noreferrer noopener" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
              Verify Your Email
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            Or open this direct link in your browser:<br />
            <a href="${verificationUrl}" target="_blank" rel="noreferrer noopener" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This link expires in 24 hours.
          </p>
        </div>
      `,
      text: `Welcome to QuizUPM.\n\nVerify your account by visiting: ${verificationUrl}\n\nIf the link is not clickable, copy and paste it into your browser.`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("Resend API did not return an email ID!");
  }

  return { messageId: data.id };
}

export class ResendEmailSenderAdapter implements EmailSenderPort {
  async sendVerification(input: { to: string; verificationUrl: string }) {
    try {
      const result = await sendWithResend(input);
      console.info(`[Resend] Verification email sent to ${input.to} (ID: ${result.messageId})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Resend] Failed to send verification email to ${input.to}: ${message}`);
      throw error;
    }
  }
}
