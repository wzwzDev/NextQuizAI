// Prevent tests from attempting real Google Cloud auth by mocking clients
jest.mock("@google-cloud/vision", () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    batchAnnotateFiles: jest.fn().mockResolvedValue([{ responses: [] }]),
    asyncBatchAnnotateFiles: jest.fn().mockResolvedValue([{}]),
  })),
  protos: { google: { cloud: { vision: { v1: {} } } } },
}));

jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: jest.fn().mockReturnValue({
      file: jest.fn().mockReturnThis(),
      save: jest.fn().mockResolvedValue(undefined),
      getFiles: jest.fn().mockResolvedValue([[]]),
      deleteFiles: jest.fn().mockResolvedValue(undefined),
      download: jest.fn().mockResolvedValue([Buffer.from("")]),
    }),
  })),
}));

import { existsSync, readFileSync } from "fs";
import { createServer } from "http";
import path from "path";
import {
  generateQuestionsFromCourseContent,
  generateQuestionsFromUploadedFile,
} from "@/server/admin/services/uploadQuizGenerationService";

jest.setTimeout(45000);

function hasRealOpenAiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key) && key !== "ci-openai-key";
}

function makeFile(name: string, type: string, content: string) {
  return {
    name,
    type,
    text: async () => content,
  } as unknown as File;
}

function makePdfFile(name: string, content: string | Uint8Array) {
  const bytes =
    typeof content === "string"
      ? new TextEncoder().encode(content)
      : content;

  return {
    name,
    type: "application/pdf",
    arrayBuffer: async () =>
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
    text: async () => "",
  } as unknown as File;
}

async function startFakeOpenAiServer(outputs: string[]) {
  let requestCount = 0;

  const server = createServer(async (req, res) => {
    for await (const chunk of req) {
      void chunk;
      // Drain request stream.
    }

    const payload = outputs[Math.min(requestCount, outputs.length - 1)] ?? "[]";
    requestCount += 1;

    const responseBody = {
      id: `chatcmpl-${requestCount}`,
      object: "chat.completion",
      created: Date.now(),
      model: "gpt-4o-mini",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: payload },
          finish_reason: "stop",
        },
      ],
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(responseBody));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve fake OpenAI server address.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    getRequestCount: () => requestCount,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

async function startRateLimitedOpenAiServer() {
  let requestCount = 0;

  const server = createServer(async (req, res) => {
    for await (const chunk of req) {
      void chunk;
      // Drain request stream.
    }

    requestCount += 1;

    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: {
          message: "Rate limit reached. Please try again in 200ms.",
          type: "rate_limit_error",
        },
      }),
    );
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve fake OpenAI server address.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    getRequestCount: () => requestCount,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

describe("uploadQuizGenerationService", () => {
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

  it("throws when generation dependencies are unavailable", async () => {
    if (process.env.OPENAI_API_KEY) {
      return;
    }

    const file = makeFile(
      "course.txt",
      "text/plain",
      "This is sufficiently long content for generation from a text file.",
    );

    await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
      /OpenAI generation failed/i,
    );
  });

  it("accepts txt files by extension and reaches generation", async () => {
    const file = makeFile(
      "course.txt",
      "application/octet-stream",
      "This text file is still valid because extension-based detection is supported.",
    );

    if (!process.env.OPENAI_API_KEY) {
      await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
        /OpenAI generation failed/i,
      );
      return;
    }

    const result = await generateQuestionsFromUploadedFile(file);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("parses valid JSON files and reaches generation", async () => {
    const file = makeFile(
      "course.json",
      "application/json",
      JSON.stringify({
        content:
          "JavaScript functions can return values and receive parameters to reuse logic safely.",
      }),
    );

    if (!process.env.OPENAI_API_KEY) {
      await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
        /OpenAI generation failed/i,
      );
      return;
    }

    const result = await generateQuestionsFromUploadedFile(file);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("tries OCR fallback for unreadable PDFs", async () => {
    if (process.env.OPENAI_API_KEY) {
      return;
    }

    const file = makePdfFile("scanned.pdf", "not-a-real-pdf");
    await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
      /OPENAI_API_KEY/i,
    );
  });

  it("extracts text from a real PDF before generation", async () => {
    if (process.env.CI === "true") {
      return;
    }

    const pdfPath = path.join(process.cwd(), "screenshots", "FENW_JS_Eng.pdf");
    if (!existsSync(pdfPath)) {
      return;
    }

    const bytes = readFileSync(pdfPath);
    const file = makePdfFile("FENW_JS_Eng.pdf", bytes);

    if (!hasRealOpenAiKey()) {
      await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
        /OPENAI_API_KEY|OpenAI generation failed/i,
      );
      return;
    }

    const result = await generateQuestionsFromUploadedFile(file);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("uses fallback generation when primary output is empty", async () => {
    const fakeServer = await startFakeOpenAiServer([
      JSON.stringify([{ question: "", answer: "" }]),
      JSON.stringify([{ question: "Q1", answer: "A1" }]),
    ]);

    const previousApiKey = process.env.OPENAI_API_KEY;
    const previousBaseUrl = process.env.OPENAI_BASE_URL;

    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_BASE_URL = `${fakeServer.baseUrl}/v1`;

    try {
      const result = await generateQuestionsFromCourseContent(
        "This content is sufficiently long and includes enough material for deterministic question generation.",
      );

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ question: "Q1", answer: "A1" }),
        ]),
      );
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(fakeServer.getRequestCount()).toBeGreaterThanOrEqual(2);
    } finally {
      if (typeof previousApiKey === "string") {
        process.env.OPENAI_API_KEY = previousApiKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }

      if (typeof previousBaseUrl === "string") {
        process.env.OPENAI_BASE_URL = previousBaseUrl;
      } else {
        delete process.env.OPENAI_BASE_URL;
      }

      await fakeServer.close();
    }
  });

  it("returns local fallback questions when OpenAI is rate limited", async () => {
    const fakeServer = await startRateLimitedOpenAiServer();

    const previousApiKey = process.env.OPENAI_API_KEY;
    const previousBaseUrl = process.env.OPENAI_BASE_URL;

    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_BASE_URL = `${fakeServer.baseUrl}/v1`;

    try {
      const result = await generateQuestionsFromCourseContent(
        "I'm unable to assist with that. JavaScript functions can return values to callers after computation. Arrays are often transformed using map and filtered based on conditions. Constants are declared using const in modern JavaScript runtimes. Objects store related key value pairs and are used to model structured data. Loops repeat instructions while termination conditions remain true.",
        { questionCount: 5 },
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(
        result.every(
          (item) =>
            typeof item.question === "string" &&
            item.question.trim().length > 0 &&
            typeof item.answer === "string" &&
            item.answer.trim().length > 0,
        ),
      ).toBe(true);
      expect(
        result.every(
          (item) =>
            !/unable to assist|cannot assist|can't assist|cannot help|can't help/i.test(
              `${item.question} ${item.answer}`,
            ),
        ),
      ).toBe(true);
      expect(fakeServer.getRequestCount()).toBeGreaterThan(0);
    } finally {
      if (typeof previousApiKey === "string") {
        process.env.OPENAI_API_KEY = previousApiKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }

      if (typeof previousBaseUrl === "string") {
        process.env.OPENAI_BASE_URL = previousBaseUrl;
      } else {
        delete process.env.OPENAI_BASE_URL;
      }

      await fakeServer.close();
    }
  });

  it("pads fallback output instead of failing on rate limits", async () => {
    const fakeServer = await startRateLimitedOpenAiServer();

    const previousApiKey = process.env.OPENAI_API_KEY;
    const previousBaseUrl = process.env.OPENAI_BASE_URL;

    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_BASE_URL = `${fakeServer.baseUrl}/v1`;

    try {
      const result = await generateQuestionsFromCourseContent(
        "I'm unable to assist with that.",
        { questionCount: 5 },
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(
        result.every(
          (item) =>
            typeof item.question === "string" &&
            item.question.trim().length > 0 &&
            typeof item.answer === "string" &&
            item.answer.trim().length > 0,
        ),
      ).toBe(true);
      expect(fakeServer.getRequestCount()).toBeGreaterThan(0);
    } finally {
      if (typeof previousApiKey === "string") {
        process.env.OPENAI_API_KEY = previousApiKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }

      if (typeof previousBaseUrl === "string") {
        process.env.OPENAI_BASE_URL = previousBaseUrl;
      } else {
        delete process.env.OPENAI_BASE_URL;
      }

      await fakeServer.close();
    }
  });

  it("handles long course content before generation", async () => {
    const longContent = "A ".repeat(20000);
    const file = makeFile("course.txt", "text/plain", longContent);

    if (!process.env.OPENAI_API_KEY) {
      await expect(generateQuestionsFromUploadedFile(file)).rejects.toThrow(
        /OpenAI generation failed/i,
      );
      return;
    }

    const result = await generateQuestionsFromUploadedFile(file);
    expect(Array.isArray(result)).toBe(true);
  });

  it("can generate with real OpenAI when key is present", async () => {
    if (!hasRealOpenAiKey()) {
      return;
    }

    const result = await generateQuestionsFromCourseContent(
      "JavaScript loops repeat execution while a condition is true. Arrays can be iterated with for..of.",
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("question");
    expect(result[0]).toHaveProperty("answer");
  });
});