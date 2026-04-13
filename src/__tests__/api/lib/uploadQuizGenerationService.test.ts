import { strict_output } from "@/server/ai/gptadmin";
import { getOpenAIClient } from "@/server/ai/openaiClient";
import {
  generateQuestionsFromCourseContent,
  generateQuestionsFromUploadedFile,
} from "@/server/services/uploadQuizGenerationService";

jest.mock("@/server/ai/gptadmin", () => ({
  strict_output: jest.fn(),
}));

jest.mock("@/server/ai/openaiClient", () => ({
  getOpenAIClient: jest.fn(),
}));

jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(async () => ({
        getTextContent: jest.fn(async () => ({
          items: [{ str: "JavaScript loops repeat execution while a condition is true." }],
        })),
      })),
    }),
  })),
}));

function makeFile(name: string, type: string, content: string) {
  return {
    name,
    type,
    text: async () => content,
  } as unknown as File;
}

function makePdfFile(name: string, text: string) {
  const pdfBytes = new TextEncoder().encode(text);
  return {
    name,
    type: "application/pdf",
    arrayBuffer: async () =>
      pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength,
      ) as ArrayBuffer,
    text: async () => "",
  } as unknown as File;
}

describe("uploadQuizGenerationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getOpenAIClient as jest.Mock).mockReturnValue({
      responses: {
        create: jest.fn().mockResolvedValue({
          output_text: "OCR extracted course content from scanned PDF.",
        }),
      },
    });
  });

  it("throws for unsupported file types", async () => {
    const file = makeFile("course.png", "image/png", "content");
    await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
      "Only JSON, TXT, or PDF files are accepted.",
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

  it("uses fallback generation prompt when first output has only empty fields", async () => {
    (strict_output as jest.Mock)
      .mockResolvedValueOnce([{ question: "", answer: "" }])
      .mockResolvedValueOnce([{ question: "Q1", answer: "A1" }]);

    const result = await generateQuestionsFromCourseContent(
      "This is sufficiently long content for generation.",
    );

    expect(result).toEqual([{ question: "Q1", answer: "A1" }]);
    expect(strict_output).toHaveBeenCalledTimes(2);
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

  it("parses valid pdf file and returns generated questions", async () => {
    (strict_output as jest.Mock).mockResolvedValue([
      { question: "Q1", answer: "A1" },
    ]);

    const file = makePdfFile(
      "course.pdf",
      "JavaScript loops repeat execution while a condition is true.",
    );

    const result = await generateQuestionsFromUploadedFile(file);

    expect(result).toEqual([{ question: "Q1", answer: "A1" }]);
    expect(strict_output).toHaveBeenCalledTimes(1);
    expect((strict_output as jest.Mock).mock.calls[0][0]).toContain("JavaScript loops");
  });

  it("falls back to OCR for scanned pdf without text layer", async () => {
    const pdfJs = jest.requireMock("pdfjs-dist/legacy/build/pdf.mjs") as {
      getDocument: jest.Mock;
    };

    pdfJs.getDocument.mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 1,
        getPage: jest.fn(async () => ({
          getTextContent: jest.fn(async () => ({
            items: [],
          })),
        })),
      }),
    });

    (strict_output as jest.Mock).mockResolvedValue([{ question: "Q1", answer: "A1" }]);

    const file = makePdfFile("scanned.pdf", "binary scanned content");

    const result = await generateQuestionsFromUploadedFile(file);

    expect(result).toEqual([{ question: "Q1", answer: "A1" }]);
    expect(getOpenAIClient).toHaveBeenCalledTimes(1);
    expect((strict_output as jest.Mock).mock.calls[0][0]).toContain("OCR extracted");
  });

  it("falls back to OCR when pdf parser throws invalid pdf error", async () => {
    const pdfJs = jest.requireMock("pdfjs-dist/legacy/build/pdf.mjs") as {
      getDocument: jest.Mock;
    };

    pdfJs.getDocument.mockReturnValueOnce({
      promise: Promise.reject(new Error("Parser failure")),
    });

    (strict_output as jest.Mock).mockResolvedValue([{ question: "Q1", answer: "A1" }]);

    const file = makePdfFile("parser-fails.pdf", "binary content");
    const result = await generateQuestionsFromUploadedFile(file);

    expect(result).toEqual([{ question: "Q1", answer: "A1" }]);
    expect(getOpenAIClient).toHaveBeenCalledTimes(1);
    expect((strict_output as jest.Mock).mock.calls[0][0]).toContain("OCR extracted");
  });

  it("throws when OCR text quality is too low", async () => {
    const pdfJs = jest.requireMock("pdfjs-dist/legacy/build/pdf.mjs") as {
      getDocument: jest.Mock;
    };

    pdfJs.getDocument.mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 1,
        getPage: jest.fn(async () => ({
          getTextContent: jest.fn(async () => ({
            items: [],
          })),
        })),
      }),
    });

    (getOpenAIClient as jest.Mock).mockReturnValueOnce({
      responses: {
        create: jest.fn().mockResolvedValue({
          output_text: "12 ### ??",
        }),
      },
    });

    const file = makePdfFile("low-quality-ocr.pdf", "binary content");

    await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
      "Extracted PDF text quality is too low. Please upload a clearer PDF or a text-based file.",
    );
  });
});