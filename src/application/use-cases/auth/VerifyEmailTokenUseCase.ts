import type { EmailVerificationTokenPort } from "@/application/ports/out/EmailVerificationTokenPort";

export class VerifyEmailTokenUseCase {
  constructor(private readonly emailVerificationTokenPort: EmailVerificationTokenPort) {}

  async execute(input: { token: string }) {
    const result = await this.emailVerificationTokenPort.verifyToken(input.token);

    if (!result.ok) {
      return {
        ok: false as const,
        error: "Verification link is invalid or expired.",
      };
    }

    return {
      ok: true as const,
      email: result.email,
    };
  }
}
