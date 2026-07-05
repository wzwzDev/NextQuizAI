/**
 * Domain Value Object: DifficultyLevel
 * Represents the difficulty classification of a quiz question.
 * 
 * This is part of the Domain Layer - it encapsulates business rules
 * about what constitutes valid difficulty levels and their properties.
 */

export type DifficultyLevelType = "easy" | "medium" | "hard";

export interface DifficultyLevelProps {
  level: DifficultyLevelType;
  description: string;
  instructions: string;
}

export class DifficultyLevel {
  private static readonly VALID_LEVELS: Set<DifficultyLevelType> = new Set([
    "easy",
    "medium",
    "hard",
  ]);

  private static readonly DESCRIPTIONS: Record<DifficultyLevelType, string> = {
    easy: "Simple, direct recall questions. Answers should be short and obvious from the content.",
    medium:
      "Moderate questions requiring small inference or comparison. Can combine two related ideas.",
    hard: "Complex questions requiring broader reasoning. Should still be concise but less obvious.",
  };

  private static readonly INSTRUCTIONS: Record<DifficultyLevelType, string> = {
    easy: "Prefer direct recall. Questions should be simple. Use basic vocabulary. Make the answer obvious.",
    medium:
      "Mix direct recall with simple inference. Questions should require connecting 2-3 ideas. Medium vocabulary.",
    hard: "Require multi-step reasoning and analysis. Questions should demand deeper understanding. Advanced vocabulary.",
  };

  readonly level: DifficultyLevelType;
  readonly description: string;
  readonly instructions: string;

  private constructor(level: DifficultyLevelType) {
    this.level = level;
    this.description = DifficultyLevel.DESCRIPTIONS[level];
    this.instructions = DifficultyLevel.INSTRUCTIONS[level];
  }

  /**
   * Factory method to create a DifficultyLevel from a string.
   * Validates that the string is a valid difficulty level.
   * 
   * @throws Error if the provided level is not valid
   */
  static create(level: string): DifficultyLevel {
    const normalized = level.toLowerCase().trim();

    if (!this.VALID_LEVELS.has(normalized as DifficultyLevelType)) {
      throw new Error(
        `Invalid difficulty level: "${level}". Must be one of: ${Array.from(this.VALID_LEVELS).join(", ")}`
      );
    }

    return new DifficultyLevel(normalized as DifficultyLevelType);
  }

  /**
   * Returns true if the provided string is a valid difficulty level.
   */
  static isValid(level: string): boolean {
    return this.VALID_LEVELS.has(level.toLowerCase().trim() as DifficultyLevelType);
  }

  /**
   * Returns all valid difficulty levels.
   */
  static getAllLevels(): DifficultyLevelType[] {
    return Array.from(this.VALID_LEVELS);
  }

  /**
   * Value Object equality - two difficulty levels are equal if they have the same level.
   */
  equals(other: DifficultyLevel): boolean {
    return this.level === other.level;
  }

  toString(): string {
    return this.level;
  }
}
