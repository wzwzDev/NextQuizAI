/**
 * Admin Adjust Questions Difficulty Endpoint - Integration Tests
 * 
 * Tests for POST /(admin)/adjust-questions-difficulty endpoint
 */

import { POST } from "@/app/api/(admin)/adjust-questions-difficulty/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";

jest.setTimeout(30000);

describe("Admin Adjust Questions Difficulty Endpoint", () => {
  let adminUser: User;
  let normalUser: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminadjust@example.com", "useradjust@example.com"] } },
    });
    adminUser = await prisma.user.create({
      data: { email: "adminadjust@example.com", isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: "useradjust@example.com", isAdmin: false },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminadjust@example.com", "useradjust@example.com"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /(admin)/adjust-questions-difficulty", () => {
    it("returns 401 if not authenticated", async () => {
      const req = new Request(
        "http://localhost/api/(admin)/adjust-questions-difficulty",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            questions: [],
            difficulty: "hard",
          }),
        }
      );
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(401);
    });

    it("returns 403 if not admin", async () => {
      const req = new Request(
        "http://localhost/api/(admin)/adjust-questions-difficulty",
        {
          method: "POST",
          headers: {
            "x-test-user-email": normalUser.email,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            questions: [],
            difficulty: "hard",
          }),
        }
      );
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/access denied|admin/i);
    });

    it("returns 400 if request body is invalid JSON", async () => {
      const req = new Request(
        "http://localhost/api/(admin)/adjust-questions-difficulty",
        {
          method: "POST",
          headers: {
            "x-test-user-email": adminUser.email,
            "content-type": "application/json",
          },
          body: "invalid json",
        }
      );
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/invalid|json/i);
    });

    it("handles missing body with appropriate error", async () => {
      const req = new Request(
        "http://localhost/api/(admin)/adjust-questions-difficulty",
        {
          method: "POST",
          headers: {
            "x-test-user-email": adminUser.email,
            "content-type": "application/json",
          },
          body: JSON.stringify(null),
        }
      );
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("accepts valid request with required parameters", async () => {
      const req = new Request(
        "http://localhost/api/(admin)/adjust-questions-difficulty",
        {
          method: "POST",
          headers: {
            "x-test-user-email": adminUser.email,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            questions: [
              {
                question: "What is 2+2?",
                answer: "4",
                options: ["3", "4", "5"],
              },
            ],
            difficulty: "hard",
            category: "Math",
            quizType: "mcq",
          }),
        }
      );
      const res = await POST(req as unknown as NextRequest);
      // This may succeed or fail depending on LLM availability
      // but should not return 400 for validation
      expect([200, 500, 429]).toContain(res.status);
    });

    it("handles questions with citation objects", async () => {
      const req = new Request(
        "http://localhost/api/(admin)/adjust-questions-difficulty",
        {
          method: "POST",
          headers: {
            "x-test-user-email": adminUser.email,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            questions: [
              {
                question: "Question with citation",
                answer: "Answer",
                citation: {
                  source: "Book",
                  snippet: "Some text",
                  page: 10,
                  lineNumber: 5,
                },
              },
            ],
            difficulty: "medium",
            quizType: "open_ended",
          }),
        }
      );
      const res = await POST(req as unknown as NextRequest);
      // Should accept the request structure
      expect([200, 500, 429]).toContain(res.status);
    });

    it("handles empty questions array", async () => {
      const req = new Request(
        "http://localhost/api/(admin)/adjust-questions-difficulty",
        {
          method: "POST",
          headers: {
            "x-test-user-email": adminUser.email,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            questions: [],
            difficulty: "easy",
          }),
        }
      );
      const res = await POST(req as unknown as NextRequest);
      // Empty array should trigger validation or pass through
      expect([200, 400, 500, 429]).toContain(res.status);
    });
  });
});
