export class QuizQuestion {
  constructor(
    public readonly id: number,
    public readonly quizId: number,
    public readonly text: string,
    public readonly answer: string,
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    return new QuizQuestion(
      Number(d["id"] ?? 0),
      Number(d["quizId"] ?? 0),
      String(d["text"] ?? ""),
      String(d["answer"] ?? ""),
    );
  }
}

