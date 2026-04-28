import type { EmailSenderPort } from "@/application/ports/out/EmailSenderPort";
import {
  buildVerificationUrl,
  sendVerificationEmail,
} from "@/server/mailer/email";

export class VerificationEmailSenderAdapter implements EmailSenderPort {
  async sendVerification(input: { to: string; verificationUrl: string }) {
    await sendVerificationEmail(input);
  }

  createVerificationUrl(token: string) {
    return buildVerificationUrl(token);
  }
}
