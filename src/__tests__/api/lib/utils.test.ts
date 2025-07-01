import { cn, formatTimeDelta, normalize, similarity, calculateAccuracy } from "@/lib/utils";

describe("utils", () => {
  it("cn merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("formatTimeDelta formats seconds", () => {
    expect(formatTimeDelta(3661)).toBe("1h 1m 1s");
    expect(formatTimeDelta(59)).toBe("59s");
  });

  it("normalize lowercases and trims", () => {
    expect(normalize("Hello, World!")).toBe("hello world");
  });

  it("similarity returns 1 for identical", () => {
    expect(similarity("abc", "abc")).toBe(1);
  });

  it("similarity returns 0 for totally different", () => {
    expect(similarity("abc", "xyz")).toBe(0);
  });

  it("calculateAccuracy for mcq", () => {
    const game = { gameType: "mcq", questions: [{ isCorrect: true }, { isCorrect: false }] };
    expect(calculateAccuracy(game)).toBe(50);
  });

  it("calculateAccuracy for open_ended", () => {
    const game = { gameType: "open_ended", questions: [{ percentageCorrect: 80 }, { percentageCorrect: 60 }] };
    expect(calculateAccuracy(game)).toBe(70);
  });
});