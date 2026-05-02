import type { GameType } from "@/domain/value-objects/DomainEnums";
import { Question } from "./Question";

export class Game {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly timeStarted: Date,
    public readonly topic: string,
    public readonly timeEnded: Date | null,
    public readonly gameType: GameType,
    public readonly questions: Question[],
  ) {}

  static fromPrisma(p: unknown) {
    if (!p) return null;
    const d = p as unknown as Record<string, unknown>;
    const rawQuestions = (d["questions"] as unknown[]) ?? [];
    const questions = rawQuestions
      .map((q) => Question.fromPrisma(q))
      .filter((q): q is Question => q !== null);

    return new Game(
      String(d["id"] ?? ""),
      String(d["userId"] ?? ""),
      new Date(String(d["timeStarted"] ?? Date.now())),
      String(d["topic"] ?? ""),
      d["timeEnded"] ? new Date(String(d["timeEnded"])) : null,
      (d["gameType"] as GameType) ?? ("mcq" as GameType),
      questions,
    );
  }
}
