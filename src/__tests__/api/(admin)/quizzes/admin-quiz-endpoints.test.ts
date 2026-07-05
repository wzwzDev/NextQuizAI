/**
 * Admin Quiz Endpoints - Integration Tests
 * 
 * Tests for POST/GET /(admin)/quizzes endpoints
 */

import { GET, POST } from "@/app/api/(admin)/quizzes/route";
import { prisma } from "@/server/core/db";
import { NextRequest } from "next/server";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("/api/(admin)/quizzes Endpoints", () => {
  let adminUser: User;
  let normalUser: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminquizzes@example.com", "userquizzes@example.com"] } },
    });
    adminUser = await prisma.user.create({
      data: { email: "adminquizzes@example.com", isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: "userquizzes@example.com", isAdmin: false },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminquizzes@example.com", "userquizzes@example.com"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /(admin)/quizzes - Create Quiz", () => {
    it("returns 401 if not admin", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes", {
        method: "POST",
        headers: {
          "x-test-user-email": normalUser.email,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Quiz",
          category: "General",
          difficulty: "easy",
          questions: [{ question: "Q1?", answer: "A1" }],
        }),
      });
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/admin/i);
    });

    it("creates quiz as admin with valid data", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes", {
        method: "POST",
        headers: {
          "x-test-user-email": adminUser.email,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: `Test Quiz for Create ${Date.now()}`,
          category: "General",
          difficulty: "easy",
          questions: [{ question: "Q1?", answer: "A1", type: "mcq" }],
        }),
      });
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.quiz).toBeDefined();
      expect(json.quiz.title).toMatch(/Test Quiz for Create/);
      expect(json.message).toMatch(/successfully/i);
    });

    it("returns 400 for invalid validation (missing required fields)", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes", {
        method: "POST",
        headers: {
          "x-test-user-email": adminUser.email,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Short", // too short
          category: "",  // missing
          difficulty: "invalid", // invalid enum
        }),
      });
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/validation|invalid/i);
    });

    it("returns 400 for empty questions array", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes", {
        method: "POST",
        headers: {
          "x-test-user-email": adminUser.email,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Quiz",
          category: "General",
          difficulty: "easy",
          questions: [], // empty
        }),
      });
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/validation|at least one/i);
    });

    it("creates quiz with optional quizType parameter", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes", {
        method: "POST",
        headers: {
          "x-test-user-email": adminUser.email,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: `Test Quiz with Type ${Date.now()}`,
          category: "General",
          difficulty: "medium",
          quizType: "open_ended",
          questions: [{ question: "Explain this", answer: "Explanation", type: "open_ended" }],
        }),
      });
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.quiz).toBeDefined();
      expect(json.quiz.id).toBeDefined();
    });

    it("handles null body gracefully", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes", {
        method: "POST",
        headers: {
          "x-test-user-email": adminUser.email,
          "content-type": "application/json",
        },
        body: JSON.stringify(null),
      });
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });

  describe("GET /(admin)/quizzes - List Quizzes", () => {
    it("returns 401 if not admin", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes", {
        method: "GET",
        headers: { "x-test-user-email": normalUser.email },
      });
      const res = await GET(req as unknown as NextRequest);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/admin/i);
    });
  });
});

