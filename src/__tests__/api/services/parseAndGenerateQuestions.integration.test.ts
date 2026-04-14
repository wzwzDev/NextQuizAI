import { parseAndGenerateQuestions } from "@/server/question-generation/parseAndGenerateQuestions";
import { strict_output as strictOutputLive } from "@/server/ai/gptadmin";
jest.setTimeout(30000);
describe("parseAndGenerateQuestions", () => {
  const passthroughGenerator = async () => [
    { question: "Q1", answer: "A1" },
    { question: "Q2", answer: "A2" },
  ];

  const failingGenerator = async () => {
    throw new Error("fail");
  };

  function makeFile({ name, type, content }: { name: string, type: string, content: string }) {
    return {
      name,
      type,
      text: async () => content,
    };
  }

  async function liveGenerator(content: string) {
    const generated = await strictOutputLive(
      "Generate exactly two short-answer questions from this course content.",
      content,
      { question: "", answer: "" },
      "",
      false,
      "gpt-4o-mini",
      0,
      1,
      false,
    );

    return Array.isArray(generated) ? generated : [generated];
  }

  it("throws if no file", async () => {
    await expect(parseAndGenerateQuestions(undefined as any, passthroughGenerator)).rejects.toThrow(/no file/i);
  });

  it("throws if file type is not accepted", async () => {
    const file = makeFile({ name: "bad.pdf", type: "application/pdf", content: "data" });
    await expect(parseAndGenerateQuestions(file, passthroughGenerator)).rejects.toThrow(/only json or txt/i);
  });

  it("throws for invalid JSON", async () => {
    const file = makeFile({ name: "bad.json", type: "application/json", content: "{invalid" });
    await expect(parseAndGenerateQuestions(file, passthroughGenerator)).rejects.toThrow(/invalid json/i);
  });

  it("throws if course content is missing in JSON", async () => {
    const file = makeFile({ name: "empty.json", type: "application/json", content: "{}" });
    await expect(parseAndGenerateQuestions(file, passthroughGenerator)).rejects.toThrow(/no course content/i);
  });

  it("throws if course content is too short", async () => {
    const file = makeFile({ name: "short.txt", type: "text/plain", content: "short" });
    await expect(parseAndGenerateQuestions(file, passthroughGenerator)).rejects.toThrow(/too short/i);
  });

  it("returns questions for valid JSON file", async () => {
    if (!process.env.OPENAI_API_KEY) {
      return;
    }

    const file = makeFile({
      name: "course.json",
      type: "application/json",
      content: JSON.stringify({ content: "This is a valid course content for quiz generation." }),
    });
    const questions = await parseAndGenerateQuestions(file, liveGenerator);
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it("returns questions for valid TXT file", async () => {
    if (!process.env.OPENAI_API_KEY) {
      return;
    }

    const file = makeFile({
      name: "course.txt",
      type: "text/plain",
      content: "This is a valid course content for quiz generation.",
    });
    const questions = await parseAndGenerateQuestions(file, liveGenerator);
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it("throws if strict_output throws", async () => {
    const file = makeFile({
      name: "course.txt",
      type: "text/plain",
      content: "This is a valid course content for quiz generation.",
    });
    await expect(parseAndGenerateQuestions(file, failingGenerator)).rejects.toThrow(/fail/);
  });
});