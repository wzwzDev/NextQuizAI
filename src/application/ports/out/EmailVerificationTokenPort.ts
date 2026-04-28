export interface EmailVerificationTokenPort {
  createToken(email: string): Promise<{ token: string; expiresAt: Date }>;
  verifyToken(token: string): Promise<{ ok: true; email: string } | { ok: false }>;
}
