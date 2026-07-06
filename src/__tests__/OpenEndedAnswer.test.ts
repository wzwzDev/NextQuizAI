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

  it("should give partial credit when user has 1 of 2 key words", () => {
    // Expected: "dog barks" (2 words)
    // User: "barks" (1 word)
    // Expected result: 50% (1 out of 2 words correct)
    const answer = OpenEndedAnswer.fromRaw("dog barks", "barks");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(false); // Below 80% threshold
    expect(result.percentageSimilar).toBe(50);
    expect(result.gradingMethod).toBe("typo_tolerant");
    expect(result.rawScore).toBe(0.5);
  });

  it("should give partial credit when user has 2 of 3 key words", () => {
    // Expected: "dog barks at cat" (4 words, 3 after removing stopwords)
    // User: "dog barks" (2 words)
    // Expected result: ~67% (2 out of 3 key words)
    const answer = OpenEndedAnswer.fromRaw("dog barks at cat", "dog barks");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(false); // Below 80% threshold
    expect(result.percentageSimilar).toBeGreaterThan(60);
    expect(result.percentageSimilar).toBeLessThan(70);
  });

  it("should return 0% for completely unrelated words (stopwords ignored)", () => {
    // Expected: "The sky is blue" → key words: ["sky", "blue"]
    // User: "The ocean is deep" → key words: ["ocean", "deep"]
    // Expected result: 0% (no matching key words)
    // When word match is 0%, falls through to string similarity comparison
    // Mock returns 0.5, which is below 0.8 threshold, so isAccepted = false
    const answer = OpenEndedAnswer.fromRaw("The sky is blue.", "The ocean is deep.");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(false);
    expect(result.percentageSimilar).toBe(0);
    // rawScore will be from string similarity fallback (0.5 from mock)
    expect(result.rawScore).toBe(0.5);
  });

  it("should require > 40% word match for partial credit (avoid false positives)", () => {
    // Expected: "alpha beta gamma" (3 key words)
    // User: "alpha" (1 word)
    // 1/3 = 33% - below 40% threshold, should fall back to string similarity
    const answer = OpenEndedAnswer.fromRaw("alpha beta gamma", "alpha");
    const result = answer.grade(mockSimilarityPort);

    // Since mockSimilarityPort.compare returns 0.5, and 0.5 >= 0.8 is false
    expect(result.isAccepted).toBe(false);
  });

  it("should accept answer when 80%+ words match", () => {
    // Expected: "dog barks loudly" (3 key words)
    // User: "dog barks loudly" (3 words)
    // Expected result: 100% (3 out of 3 words correct)
    const answer = OpenEndedAnswer.fromRaw("dog barks loudly", "dog barks loudly");
    const result = answer.grade(mockSimilarityPort);

    expect(result.isAccepted).toBe(true);
    expect(result.percentageSimilar).toBe(100);
  });
});
