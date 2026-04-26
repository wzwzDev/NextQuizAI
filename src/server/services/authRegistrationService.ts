import { createEmailVerificationToken } from "@/server/auth/emailVerification";
import { hashPassword, normalizeEmail } from "@/server/auth/password";
import {
  createUserWithPassword,
  findUserByEmail,
} from "@/server/repositories/authRegistrationRepository";
import {
  buildVerificationUrl,
  sendVerificationEmail,
} from "@/server/mailer/email";

export class RegistrationConflictError extends Error {}

export async function registerUserWithEmailPassword(input: {
  name?: string;
  email: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  const name = input.name?.trim() || null;

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new RegistrationConflictError(
      "An account already exists for this email. Sign in or use another email.",
    );
  }

  const passwordHash = await hashPassword(input.password);

  await createUserWithPassword({
    email,
    name,
    passwordHash,
  });

  const { token } = await createEmailVerificationToken(email);
  const verificationUrl = buildVerificationUrl(token);

  await sendVerificationEmail({
    to: email,
    verificationUrl,
  });
}
