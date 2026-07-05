/**
 * Admin Quiz Validate & Upload Endpoints - Integration Tests
 * 
 * Tests for POST /(admin)/quizzes/validate and POST /(admin)/quizzes/upload endpoints
 */

import { POST as ValidatePOST } from "@/app/api/(admin)/quizzes/validate/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";

jest.setTimeout(30000);

describe("Admin Quiz Validate Endpoint", () => {
  let adminUser: User;
  let normalUser: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminvalidate@example.com", "uservalidate@example.com"] } },
    });
    adminUser = await prisma.user.create({
      data: { email: "adminvalidate@example.com", isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: "uservalidate@example.com", isAdmin: false },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminvalidate@example.com", "uservalidate@example.com"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /(admin)/quizzes/validate", () => {
    it("returns 401 if not admin", async () => {
      const formData = new FormData();
      formData.append("file", new Blob(['{"questions": []}'], { type: "application/json" }));

      const req = new Request("http://localhost/api/(admin)/quizzes/validate", {
        method: "POST",
        headers: { "x-test-user-email": normalUser.email },
        body: formData,
      });
      const res = await ValidatePOST(req as unknown as NextRequest);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/admin/i);
    });

    it("validates JSON file as admin", async () => {
      const jsonContent = JSON.stringify({
        questions: [
          { question: "What is AI?", text: "What is AI?" },
          { question: "What is ML?", text: "What is ML?" },
        ],
      });
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([jsonContent], { type: "application/json" }),
        "test.json"
      );

      const req = new Request("http://localhost/api/(admin)/quizzes/validate", {
        method: "POST",
        headers: { "x-test-user-email": adminUser.email },
        body: formData,
      });
      const res = await ValidatePOST(req as unknown as NextRequest);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.valid).toBe(true);
      expect(json.fileType).toBe("json");
      expect(json.format).toBe("structured");
      expect(json.extractedText).toBeDefined();
    });

    it("validates TXT file as admin", async () => {
      const textContent = "This is a test file.\nIt contains some text.\nWith multiple lines.";
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([textContent], { type: "text/plain" }),
        "test.txt"
      );

      const req = new Request("http://localhost/api/(admin)/quizzes/validate", {
        method: "POST",
        headers: { "x-test-user-email": adminUser.email },
        body: formData,
      });
      const res = await ValidatePOST(req as unknown as NextRequest);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.valid).toBe(true);
      expect(json.fileType).toBe("text");
      expect(json.format).toBe("text");
    });

    it("returns 400 if no file provided", async () => {
      const formData = new FormData();
      // Don't append any file

      const req = new Request("http://localhost/api/(admin)/quizzes/validate", {
        method: "POST",
        headers: { "x-test-user-email": adminUser.email },
        body: formData,
      });
      const res = await ValidatePOST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/no file|file provided/i);
    });

    it("returns 400 for unsupported file type", async () => {
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["binary data"], { type: "application/octet-stream" }),
        "test.bin"
      );

      const req = new Request("http://localhost/api/(admin)/quizzes/validate", {
        method: "POST",
        headers: { "x-test-user-email": adminUser.email },
        body: formData,
      });
      const res = await ValidatePOST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/unsupported|file type/i);
    });

    it("returns 400 for invalid JSON", async () => {
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["{invalid json}"], { type: "application/json" }),
        "invalid.json"
      );

      const req = new Request("http://localhost/api/(admin)/quizzes/validate", {
        method: "POST",
        headers: { "x-test-user-email": adminUser.email },
        body: formData,
      });
      const res = await ValidatePOST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/parse|failed/i);
    });

    it("returns 400 for empty file", async () => {
      const formData = new FormData();
      formData.append("file", new Blob([], { type: "text/plain" }), "empty.txt");

      const req = new Request("http://localhost/api/(admin)/quizzes/validate", {
        method: "POST",
        headers: { "x-test-user-email": adminUser.email },
        body: formData,
      });
      const res = await ValidatePOST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/empty|no content/i);
    });

    it("handles PDF file type", async () => {
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["mock pdf content"], { type: "application/pdf" }),
        "test.pdf"
      );

      const req = new Request("http://localhost/api/(admin)/quizzes/validate", {
        method: "POST",
        headers: { "x-test-user-email": adminUser.email },
        body: formData,
      });
      const res = await ValidatePOST(req as unknown as NextRequest);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.fileType).toBe("pdf");
      expect(json.format).toBe("document");
    });
  });
});
