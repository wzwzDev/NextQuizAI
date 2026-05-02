export class User {
  constructor(
    public readonly id: string,
    public readonly name: string | null,
    public readonly email: string,
    public readonly passwordHash: string | null,
    public readonly emailVerified: Date | null,
    public readonly image: string | null,
    public readonly banned: boolean,
    public readonly revoked: boolean,
    public readonly isOnline: boolean,
    public readonly isAdmin: boolean,
    public readonly lastSeen: Date,
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    return new User(
      String(d["id"] ?? ""),
      d["name"] ? String(d["name"]) : null,
      String(d["email"] ?? ""),
      d["passwordHash"] ? String(d["passwordHash"]) : null,
      d["emailVerified"] ? new Date(String(d["emailVerified"])) : null,
      d["image"] ? String(d["image"]) : null,
      Boolean(d["banned"]),
      Boolean(d["revoked"]),
      Boolean(d["isOnline"]),
      Boolean(d["isAdmin"]),
      d["lastSeen"] ? new Date(String(d["lastSeen"])) : new Date(),
    );
  }
}
