/**
 * Domain Layer Tests: DifficultyLevel Value Object
 * 
 * Tests ensure that the DifficultyLevel value object correctly validates
 * and encapsulates difficulty level business rules.
 */

import { DifficultyLevel } from "@/domain/value-objects/DifficultyLevel";

describe("DifficultyLevel - Domain Value Object", () => {
  describe("create factory method", () => {
    it("should create a valid DifficultyLevel for 'easy'", () => {
      const level = DifficultyLevel.create("easy");
      expect(level.level).toBe("easy");
      expect(level.description).toBeDefined();
      expect(level.instructions).toBeDefined();
    });

    it("should create a valid DifficultyLevel for 'medium'", () => {
      const level = DifficultyLevel.create("medium");
      expect(level.level).toBe("medium");
    });

    it("should create a valid DifficultyLevel for 'hard'", () => {
      const level = DifficultyLevel.create("hard");
      expect(level.level).toBe("hard");
    });

    it("should normalize lowercase input", () => {
      const level1 = DifficultyLevel.create("EASY");
      const level2 = DifficultyLevel.create("Easy");
      const level3 = DifficultyLevel.create("easy");

      expect(level1.level).toBe(level2.level);
      expect(level2.level).toBe(level3.level);
    });

    it("should trim whitespace from input", () => {
      const level = DifficultyLevel.create("  easy  ");
      expect(level.level).toBe("easy");
    });

    it("should throw error for invalid difficulty level", () => {
      expect(() => DifficultyLevel.create("invalid")).toThrow(
        /Invalid difficulty level/
      );
    });

    it("should throw error for empty string", () => {
      expect(() => DifficultyLevel.create("")).toThrow(
        /Invalid difficulty level/
      );
    });

    it("should throw error for gibberish", () => {
      expect(() => DifficultyLevel.create("xyz123")).toThrow(
        /Invalid difficulty level/
      );
    });
  });

  describe("isValid static method", () => {
    it("should return true for valid levels", () => {
      expect(DifficultyLevel.isValid("easy")).toBe(true);
      expect(DifficultyLevel.isValid("medium")).toBe(true);
      expect(DifficultyLevel.isValid("hard")).toBe(true);
    });

    it("should return true for uppercase input", () => {
      expect(DifficultyLevel.isValid("EASY")).toBe(true);
      expect(DifficultyLevel.isValid("MEDIUM")).toBe(true);
    });

    it("should return false for invalid levels", () => {
      expect(DifficultyLevel.isValid("invalid")).toBe(false);
      expect(DifficultyLevel.isValid("trivial")).toBe(false);
      expect(DifficultyLevel.isValid("")).toBe(false);
    });
  });

  describe("getAllLevels static method", () => {
    it("should return all valid difficulty levels", () => {
      const levels = DifficultyLevel.getAllLevels();
      expect(levels).toContain("easy");
      expect(levels).toContain("medium");
      expect(levels).toContain("hard");
      expect(levels.length).toBe(3);
    });
  });

  describe("value object equality", () => {
    it("should consider two DifficultyLevels with same level as equal", () => {
      const level1 = DifficultyLevel.create("easy");
      const level2 = DifficultyLevel.create("easy");
      expect(level1.equals(level2)).toBe(true);
    });

    it("should consider DifficultyLevels with different levels as unequal", () => {
      const level1 = DifficultyLevel.create("easy");
      const level2 = DifficultyLevel.create("hard");
      expect(level1.equals(level2)).toBe(false);
    });
  });

  describe("description and instructions", () => {
    it("should provide different descriptions for different levels", () => {
      const easy = DifficultyLevel.create("easy");
      const medium = DifficultyLevel.create("medium");
      const hard = DifficultyLevel.create("hard");

      expect(easy.description).not.toBe(medium.description);
      expect(medium.description).not.toBe(hard.description);
      expect(easy.description).not.toBe(hard.description);
    });

    it("should provide different instructions for different levels", () => {
      const easy = DifficultyLevel.create("easy");
      const medium = DifficultyLevel.create("medium");
      const hard = DifficultyLevel.create("hard");

      expect(easy.instructions).not.toBe(medium.instructions);
      expect(medium.instructions).not.toBe(hard.instructions);
      expect(easy.instructions).not.toBe(hard.instructions);
    });

    it("should provide non-empty descriptions and instructions", () => {
      const level = DifficultyLevel.create("medium");
      expect(level.description.length).toBeGreaterThan(0);
      expect(level.instructions.length).toBeGreaterThan(0);
    });
  });

  describe("toString method", () => {
    it("should return the level as string", () => {
      const level = DifficultyLevel.create("hard");
      expect(level.toString()).toBe("hard");
    });
  });
});
