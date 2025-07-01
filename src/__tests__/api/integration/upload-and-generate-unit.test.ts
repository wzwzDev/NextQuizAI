import { parseAndGenerateQuestions } from "@/lib/parseAndGenerateQuestions";
jest.setTimeout(30000);
describe("parseAndGenerateQuestions", () => {
  const strict_output = jest.fn(async (content) => [
    { question: "Q1", answer: "A1" },
    { question: "Q2", answer: "A2" },
  ]);

  function makeFile({ name, type, content }: { name: string, type: string, content: string }) {
    return {
      name,
      type,
      text: async () => content,
    };
  }

  it("throws if no file", async () => {
    await expect(parseAndGenerateQuestions(undefined as any, strict_output)).rejects.toThrow(/no file/i);
  });

  it("throws if file type is not accepted", async () => {
    const file = makeFile({ name: "bad.pdf", type: "application/pdf", content: "data" });
    await expect(parseAndGenerateQuestions(file, strict_output)).rejects.toThrow(/only json or txt/i);
  });

  it("throws for invalid JSON", async () => {
    const file = makeFile({ name: "bad.json", type: "application/json", content: "{invalid" });
    await expect(parseAndGenerateQuestions(file, strict_output)).rejects.toThrow(/invalid json/i);
  });

  it("throws if course content is missing in JSON", async () => {
    const file = makeFile({ name: "empty.json", type: "application/json", content: "{}" });
    await expect(parseAndGenerateQuestions(file, strict_output)).rejects.toThrow(/no course content/i);
  });

  it("throws if course content is too short", async () => {
    const file = makeFile({ name: "short.txt", type: "text/plain", content: "short" });
    await expect(parseAndGenerateQuestions(file, strict_output)).rejects.toThrow(/too short/i);
  });

  it("returns questions for valid JSON file", async () => {
    const file = makeFile({
      name: "course.json",
      type: "application/json",
      content: JSON.stringify({ content: "This is a valid course content for quiz generation." }),
    });
    const questions = await parseAndGenerateQuestions(file, strict_output);
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it("returns questions for valid TXT file", async () => {
    const file = makeFile({
      name: "course.txt",
      type: "text/plain",
      content: "This is a valid course content for quiz generation.",
    });
    const questions = await parseAndGenerateQuestions(file, strict_output);
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it("throws if strict_output throws", async () => {
    const strict_output_fail = jest.fn().mockRejectedValue(new Error("fail"));
    const file = makeFile({
      name: "course.txt",
      type: "text/plain",
      content: "This is a valid course content for quiz generation.",
    });
    await expect(parseAndGenerateQuestions(file, strict_output_fail)).rejects.toThrow(/fail/);
  });
});