import { AuthRegistrationRepositoryAdapter } from "@/infrastructure/auth/AuthRegistrationRepositoryAdapter";
import { EmailVerificationTokenAdapter } from "@/infrastructure/auth/EmailVerificationTokenAdapter";
import { PasswordHasherAdapter } from "@/infrastructure/security/PasswordHasherAdapter";
import { VerificationEmailSenderAdapter } from "@/infrastructure/mail/VerificationEmailSenderAdapter";
import {
  RegisterUserWithPasswordUseCase,
  RegistrationConflictError,
} from "@/application/use-cases/auth/RegisterUserWithPasswordUseCase";
import {
  buildVerificationUrl,
} from "@/server/mailer/email";

// Adapter implementing VerificationUrlBuilderPort
class VerificationUrlBuilder {
  buildVerificationUrl(token: string): string {
    return buildVerificationUrl(token);
  }
}

const registerUserUseCase = new RegisterUserWithPasswordUseCase(
  new AuthRegistrationRepositoryAdapter(),
  new PasswordHasherAdapter(),
  new EmailVerificationTokenAdapter(),
  new VerificationUrlBuilder(),
  new VerificationEmailSenderAdapter(),
);

export { RegistrationConflictError };

export async function registerUserWithEmailPassword(input: {
  name?: string;
  email: string;
  password: string;
}) {
  await registerUserUseCase.execute(input);
}
