jest.mock("@/server/core/auth", () => ({
  getAuthSession: jest.fn(),
}));

jest.mock("@/server/services/uploadQuizGenerationService", () => ({
  generateQuestionsFromUploadedFile: jest.fn(),
}));

import { POST } from "@/app/api/(admin)/upload-and-generate/route";
import { getAuthSession } from "@/server/core/auth";
import { generateQuestionsFromUploadedFile } from "@/server/services/uploadQuizGenerationService";

const mockedGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockedGenerateQuestionsFromUploadedFile = generateQuestionsFromUploadedFile as jest.MockedFunction<
  typeof generateQuestionsFromUploadedFile
>;

describe("POST /api/(admin)/upload-and-generate error branches", () => {
  const adminSession = { user: { isAdmin: true } };
  const regularSession = { user: { isAdmin: false } };

  beforeEach(() => {
    mockedGetAuthSession.mockReset();
    mockedGenerateQuestionsFromUploadedFile.mockReset();
  });

  const buildFormRequest = (formData: FormData) =>
    new Request("http://localhost/api/(admin)/upload-and-generate", {
      method: "POST",
      body: formData,
      headers: {
        "x-test-user-email": "upload-generate@example.com",
      },
    });

  it("returns 401 for non-admin users", async () => {
    mockedGetAuthSession.mockResolvedValueOnce(regularSession as never);

    const formData = new FormData();
    const response = await POST(buildFormRequest(formData) as never);

    expect(response.status).toBe(401);
    expect(mockedGenerateQuestionsFromUploadedFile).not.toHaveBeenCalled();
  });

  it("returns 400 for unsupported content types", async () => {
    mockedGetAuthSession.mockResolvedValueOnce(adminSession as never);

    const response = await POST(
      new Request("http://localhost/api/(admin)/upload-and-generate", {
        method: "POST",
        body: JSON.stringify({ hello: "world" }),
        headers: {
          "Content-Type": "application/json",
          "x-test-user-email": "upload-generate@example.com",
        },
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Content-Type must be multipart/form-data or application/x-www-form-urlencoded.",
    });
  });

  it("returns 400 when no file is uploaded", async () => {
    mockedGetAuthSession.mockResolvedValueOnce(adminSession as never);

    const formData = new FormData();
    formData.append("category", "science");
    const response = await POST(buildFormRequest(formData) as never);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "No file uploaded." });
  });

  it("returns 400 for known client validation errors", async () => {
    mockedGetAuthSession.mockResolvedValueOnce(adminSession as never);
    mockedGenerateQuestionsFromUploadedFile.mockRejectedValueOnce(
      new Error("Only JSON, TXT, or PDF files are accepted."),
    );

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");
    const response = await POST(buildFormRequest(formData) as never);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Only JSON, TXT, or PDF files are accepted.",
    });
  });

  it("returns 429 for OpenAI generation rate limits", async () => {
    mockedGetAuthSession.mockResolvedValueOnce(adminSession as never);
    mockedGenerateQuestionsFromUploadedFile.mockRejectedValueOnce(
      new Error("OpenAI generation failed: rate limit exceeded"),
    );

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");
    const response = await POST(buildFormRequest(formData) as never);

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      questions: [],
      error: "Rate limit reached while generating quiz questions. Please retry in a few seconds.",
    });
  });

  it("returns 502 for non-rate-limit OpenAI generation failures", async () => {
    mockedGetAuthSession.mockResolvedValueOnce(adminSession as never);
    mockedGenerateQuestionsFromUploadedFile.mockRejectedValueOnce(
      new Error("OpenAI generation failed: upstream service unavailable"),
    );

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");
    const response = await POST(buildFormRequest(formData) as never);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      questions: [],
      error: "OpenAI generation failed: upstream service unavailable",
    });
  });

  it("returns 429 for OpenAI OCR rate limits", async () => {
    mockedGetAuthSession.mockResolvedValueOnce(adminSession as never);
    mockedGenerateQuestionsFromUploadedFile.mockRejectedValueOnce(
      new Error("OpenAI OCR failed: 429 upstream rate limit"),
    );

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "application/pdf" }), "test.pdf");
    const response = await POST(buildFormRequest(formData) as never);

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      questions: [],
      error: "Rate limit reached while processing PDF OCR. Please retry in a few seconds.",
    });
  });

  it("returns 502 with debug details for OpenAI OCR failures in test mode", async () => {
    mockedGetAuthSession.mockResolvedValueOnce(adminSession as never);
    mockedGenerateQuestionsFromUploadedFile.mockRejectedValueOnce(
      new Error("OpenAI OCR failed: upstream OCR timeout"),
    );

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "application/pdf" }), "test.pdf");
    const response = await POST(buildFormRequest(formData) as never);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      questions: [],
      error: "PDF text extraction failed due to an upstream OCR provider issue. Please retry or upload a text-based PDF.",
      details: "upstream OCR timeout",
    });
  });

  it("returns 500 for unexpected failures", async () => {
    mockedGetAuthSession.mockResolvedValueOnce(adminSession as never);
    mockedGenerateQuestionsFromUploadedFile.mockRejectedValueOnce(
      new Error("unexpected crash"),
    );

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");
    const response = await POST(buildFormRequest(formData) as never);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      questions: [],
      error: "Failed to generate quiz.",
    });
  });
});
