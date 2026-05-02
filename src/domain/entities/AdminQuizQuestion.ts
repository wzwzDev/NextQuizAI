export class AdminQuizQuestion {
  constructor(
    public readonly id: string,
    public readonly quizId: string,
    public readonly question: string,
    public readonly answer: string,
    public readonly options: unknown | null,
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    return new AdminQuizQuestion(
      String(d["id"] ?? ""),
      String(d["quizId"] ?? ""),
      String(d["question"] ?? ""),
      String(d["answer"] ?? ""),
      d["options"] ?? null,
    );
  }
}
