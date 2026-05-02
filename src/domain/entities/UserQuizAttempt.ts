import type { UserQuizAttemptStatus } from "@/domain/value-objects/DomainEnums";

export class UserQuizAttempt {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly quizId: string,
    public readonly quizTitle: string,
    public readonly answers: unknown,
    public readonly score: number,
    public readonly status: UserQuizAttemptStatus,
    public readonly startedAt: Date,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    return new UserQuizAttempt(
      String(d["id"] ?? ""),
      String(d["userId"] ?? ""),
      String(d["quizId"] ?? ""),
      String(d["quizTitle"] ?? ""),
      d["answers"],
      Number(d["score"] ?? 0),
      (d["status"] as UserQuizAttemptStatus) ?? ("pending" as UserQuizAttemptStatus),
      new Date(String(d["startedAt"] ?? Date.now())),
      d["completedAt"] ? new Date(String(d["completedAt"])) : null,
      new Date(String(d["createdAt"] ?? Date.now())),
      new Date(String(d["updatedAt"] ?? Date.now())),
    );
  }
}
