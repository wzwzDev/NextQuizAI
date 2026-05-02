import type { GameType } from "@/domain/value-objects/DomainEnums";

export class Question {
  constructor(
    public readonly id: string,
    public readonly question: string,
    public readonly answer: string,
    public readonly gameId: string,
    public readonly options: unknown | null,
    public readonly percentageCorrect: number | null,
    public readonly isCorrect: boolean | null,
    public readonly questionType: GameType,
    public readonly userAnswer: string | null,
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    return new Question(
      String(d["id"] ?? ""),
      String(d["question"] ?? ""),
      String(d["answer"] ?? ""),
      String(d["gameId"] ?? ""),
      d["options"] ?? null,
      d["percentageCorrect"] === undefined ? null : Number(d["percentageCorrect"]),
      d["isCorrect"] === undefined ? null : Boolean(d["isCorrect"]),
      (d["questionType"] as GameType) ?? ("mcq" as GameType),
      d["userAnswer"] ? String(d["userAnswer"]) : null,
    );
  }
}
