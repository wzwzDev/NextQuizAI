export class TopicCount {
  constructor(public readonly id: string, public readonly topic: string, public readonly count: number) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    return new TopicCount(String(d["id"] ?? ""), String(d["topic"] ?? ""), Number(d["count"] ?? 0));
  }
}
