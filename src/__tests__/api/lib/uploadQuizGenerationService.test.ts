import { strict_output } from "@/server/ai/gptadmin";
import {
  generateQuestionsFromCourseContent,
  generateQuestionsFromUploadedFile,
} from "@/server/services/uploadQuizGenerationService";

jest.mock("@/server/ai/gptadmin", () => ({
  strict_output: jest.fn(),
}));

function makeFile(name: string, type: string, content: string) {
  return {
    name,
    type,
    text: async () => content,
  } as unknown as File;
}

describe("uploadQuizGenerationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws for unsupported file types", async () => {
    const file = makeFile("course.pdf", "application/pdf", "content");
    await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
      "Only JSON or TXT files are accepted.",
    );
  });

  it("throws for invalid JSON", async () => {
    const file = makeFile("course.json", "application/json", "{ invalid");
    await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
      "Invalid JSON file.",
    );
  });

  it("throws when course content is too short", async () => {
    const file = makeFile("course.txt", "text/plain", "short");
    await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
      "Course content is too short or missing.",
    );
  });

  it("returns array when model returns object", async () => {
    (strict_output as jest.Mock).mockResolvedValue({ question: "Q1", answer: "A1" });

    const result = await generateQuestionsFromCourseContent(
      "This is sufficiently long content for generation.",
    );

    expect(result).toEqual([{ question: "Q1", answer: "A1" }]);
  });

  it("rethrows strict_output failures with OpenAI generation prefix", async () => {
    (strict_output as jest.Mock).mockRejectedValue(new Error("quota exceeded"));

    await expect(
      generateQuestionsFromCourseContent(
        "This is sufficiently long content for generation.",
      ),
    ).rejects.toThrow("OpenAI generation failed: quota exceeded");
  });

  it("parses valid json file and returns generated questions", async () => {
    (strict_output as jest.Mock).mockResolvedValue([
      { question: "Q1", answer: "A1" },
      { question: "Q2", answer: "A2" },
    ]);

    const file = makeFile(
      "course.json",
      "application/json",
      JSON.stringify({ content: "This is sufficiently long content for generation." }),
    );

    const result = await generateQuestionsFromUploadedFile(file);

    expect(result).toHaveLength(2);
    expect(strict_output).toHaveBeenCalledTimes(1);
  });
});