import type { AuthRegistrationRepositoryPort } from "@/application/ports/out/AuthRegistrationRepositoryPort";
import type { EmailSenderPort } from "@/application/ports/out/EmailSenderPort";
import type { EmailVerificationTokenPort } from "@/application/ports/out/EmailVerificationTokenPort";
import type { PasswordHasherPort } from "@/application/ports/out/PasswordHasherPort";
import type { VerificationUrlBuilderPort } from "@/application/ports/out/VerificationUrlBuilderPort";

export class RegistrationConflictError extends Error {}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class RegisterUserWithPasswordUseCase {
  constructor(
    private readonly authRegistrationRepository: AuthRegistrationRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly emailVerificationTokenPort: EmailVerificationTokenPort,
    private readonly verificationUrlBuilder: VerificationUrlBuilderPort,
    private readonly emailSender: EmailSenderPort,
  ) {}

  async execute(input: { name?: string; email: string; password: string }) {
    const email = normalizeEmail(input.email);
    const name = input.name?.trim() || null;

    const existingUser = await this.authRegistrationRepository.findUserByEmail(email);

    if (existingUser) {
      throw new RegistrationConflictError(
        "An account already exists for this email. Sign in or use another email.",
      );
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    await this.authRegistrationRepository.createUserWithPassword({
      email,
      name,
      passwordHash,
    });

    const { token } = await this.emailVerificationTokenPort.createToken(email);
    const verificationUrl = this.verificationUrlBuilder.buildVerificationUrl(token);

    await this.emailSender.sendVerification({
      to: email,
      verificationUrl,
    });
  }
}
