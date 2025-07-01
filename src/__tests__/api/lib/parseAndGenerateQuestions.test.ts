import { parseAndGenerateQuestions } from "@/lib/parseAndGenerateQuestions";

describe("parseAndGenerateQuestions", () => {
  it("throws if no file", async () => {
    await expect(parseAndGenerateQuestions(null as any, jest.fn())).rejects.toThrow("No file uploaded");
  });

  it("throws if file type is not accepted", async () => {
    const file = { name: "f.txt", type: "image/png", text: async () => "" };
    await expect(parseAndGenerateQuestions(file as any, jest.fn())).rejects.toThrow("Only JSON or TXT files are accepted");
  });

  it("throws if JSON is invalid", async () => {
    const file = { name: "f.json", type: "application/json", text: async () => "notjson" };
    await expect(parseAndGenerateQuestions(file as any, jest.fn())).rejects.toThrow("Invalid JSON");
  });

  it("throws if content is too short", async () => {
    const file = { name: "f.json", type: "application/json", text: async () => JSON.stringify({ content: "short" }) };
    await expect(parseAndGenerateQuestions(file as any, jest.fn())).rejects.toThrow("Too short");
  });

  it("calls strict_output for valid file", async () => {
    const file = { name: "f.json", type: "application/json", text: async () => JSON.stringify({ content: "This is a valid course content with enough length." }) };
    const strict_output = jest.fn().mockResolvedValue([{ question: "Q" }]);
    const res = await parseAndGenerateQuestions(file as any, strict_output);
    expect(strict_output).toHaveBeenCalled();
    expect(res[0].question).toBe("Q");
  });
});