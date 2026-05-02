export class Account {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly provider: string,
    public readonly providerAccountId: string,
    public readonly refresh_token: string | null,
    public readonly access_token: string | null,
    public readonly expires_at: number | null,
    public readonly token_type: string | null,
    public readonly scope: string | null,
    public readonly id_token: string | null,
    public readonly session_state: string | null,
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
      return new Account(
        String(d["id"] ?? ""),
        String(d["userId"] ?? ""),
        String(d["type"] ?? ""),
        String(d["provider"] ?? ""),
        String(d["providerAccountId"] ?? ""),
        d["refresh_token"] ? String(d["refresh_token"]) : null,
        d["access_token"] ? String(d["access_token"]) : null,
        d["expires_at"] ? Number(d["expires_at"]) : null,
        d["token_type"] ? String(d["token_type"]) : null,
        d["scope"] ? String(d["scope"]) : null,
        d["id_token"] ? String(d["id_token"]) : null,
        d["session_state"] ? String(d["session_state"]) : null,
      );
  }
}
