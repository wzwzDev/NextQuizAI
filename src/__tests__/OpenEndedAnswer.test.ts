import { OpenEndedAnswer } from "@/domain/entities/OpenEndedAnswer";
import type { StringSimilarityPort } from "@/domain/ports/StringSimilarityPort";

const mockSimilarityPort: StringSimilarityPort = {
  compare: jest.fn((a: string, b: string) => {
    if (a === b) return 1;
    return 0.5;
  }),
};

describe("OpenEndedAnswer - Simple Keyword Grading", () => {
  it("should correctly grade 'extends' as correct answer for Java subclass question", () => {
    const answer = OpenEndedAnswer.fromRaw("extends", "extends");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(true);
    expect(result.percentageSimilar).toBe(100);
    expect(result.gradingMethod).toBe("exact_match");
    expect(result.rawScore).toBe(1);
  });

  it("should handle 'extends' with extra whitespace", () => {
    const answer = OpenEndedAnswer.fromRaw("  extends  ", "extends");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(true);
    expect(result.percentageSimilar).toBe(100);
  });

  it("should handle 'extends' with different casing", () => {
    const answer = OpenEndedAnswer.fromRaw("EXTENDS", "extends");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(true);
    expect(result.percentageSimilar).toBe(100);
  });

  it("should handle 'extends' as code snippet with backticks", () => {
    const answer = OpenEndedAnswer.fromRaw("```extends```", "extends");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(true);
    expect(result.percentageSimilar).toBe(100);
  });

  it("should handle stored answer with 'answer: extends' prefix", () => {
    const answer = OpenEndedAnswer.fromRaw("answer: extends", "extends");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(true);
    expect(result.percentageSimilar).toBe(100);
  });

  it("should reject 'class' when expected is 'extends'", () => {
    const answer = OpenEndedAnswer.fromRaw("extends", "class");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(false);
  });

  it("should reject typo 'exteds' with low similarity", () => {
    const mockPort: StringSimilarityPort = {
      compare: jest.fn(() => 0.7), // Below 0.8 threshold
    };
    
    const answer = OpenEndedAnswer.fromRaw("extends", "exteds");
    const result = answer.grade(mockPort);

    expect(result.isAccepted).toBe(false);
  });

  it("should accept typo 'exteds' with high similarity", () => {
    const mockPort: StringSimilarityPort = {
      compare: jest.fn(() => 0.85), // Above 0.8 threshold
    };
    
    const answer = OpenEndedAnswer.fromRaw("extends", "exteds");
    const result = answer.grade(mockPort);

    expect(result.isAccepted).toBe(true);
  });
});
