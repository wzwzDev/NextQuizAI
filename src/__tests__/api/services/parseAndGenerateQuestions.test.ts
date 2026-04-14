import { parseAndGenerateQuestions } from "@/server/question-generation/parseAndGenerateQuestions";
import { strict_output as strictOutputLive } from "@/server/ai/gptadmin";

async function noopGenerator() {
  return [];
}

async function staticGenerator() {
  return [{ question: "Q" }];
}

async function liveGenerator(content: string) {
  const generated = await strictOutputLive(
    "Generate one short question-answer pair.",
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

describe("parseAndGenerateQuestions", () => {
  it("throws if no file", async () => {
    await expect(parseAndGenerateQuestions(null as any, noopGenerator)).rejects.toThrow("No file uploaded");
  });

  it("throws if file type is not accepted", async () => {
    const file = { name: "f.txt", type: "image/png", text: async () => "" };
    await expect(parseAndGenerateQuestions(file as any, noopGenerator)).rejects.toThrow("Only JSON or TXT files are accepted");
  });

  it("throws if JSON is invalid", async () => {
    const file = { name: "f.json", type: "application/json", text: async () => "notjson" };
    await expect(parseAndGenerateQuestions(file as any, noopGenerator)).rejects.toThrow("Invalid JSON");
  });

  it("throws if content is too short", async () => {
    const file = { name: "f.json", type: "application/json", text: async () => JSON.stringify({ content: "short" }) };
    await expect(parseAndGenerateQuestions(file as any, noopGenerator)).rejects.toThrow("Too short");
  });

  it("calls strict_output for valid file", async () => {
    const file = { name: "f.json", type: "application/json", text: async () => JSON.stringify({ content: "This is a valid course content with enough length." }) };
    if (process.env.OPENAI_API_KEY) {
      const live = await parseAndGenerateQuestions(file as any, liveGenerator);
      expect(Array.isArray(live)).toBe(true);
      expect(live.length).toBeGreaterThan(0);
      return;
    }

    const res = await parseAndGenerateQuestions(file as any, staticGenerator);
    expect(res[0].question).toBe("Q");
  });
});