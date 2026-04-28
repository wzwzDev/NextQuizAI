import { EmailVerificationTokenAdapter } from "@/infrastructure/auth/EmailVerificationTokenAdapter";

const emailTokenAdapter = new EmailVerificationTokenAdapter();

export async function createEmailVerificationToken(email: string) {
  return emailTokenAdapter.createToken(email);
}

export async function verifyEmailToken(token: string) {
  return emailTokenAdapter.verifyToken(token);
}
