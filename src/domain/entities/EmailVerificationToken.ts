export class EmailVerificationToken {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly consumedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    return new EmailVerificationToken(
      String(d["id"] ?? ""),
      String(d["email"] ?? ""),
      String(d["tokenHash"] ?? ""),
      new Date(String(d["expiresAt"] ?? Date.now())),
      d["consumedAt"] ? new Date(String(d["consumedAt"])) : null,
      new Date(String(d["createdAt"] ?? Date.now())),
    );
  }
}
