export class Session {
  constructor(
    public readonly id: string,
    public readonly sessionToken: string,
    public readonly userId: string,
    public readonly expires: Date,
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    return new Session(
      String(d["id"] ?? ""),
      String(d["sessionToken"] ?? ""),
      String(d["userId"] ?? ""),
      new Date(String(d["expires"] ?? Date.now())),
    );
  }
}
