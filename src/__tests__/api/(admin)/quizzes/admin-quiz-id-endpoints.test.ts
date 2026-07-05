/**
 * Admin Quiz ID Endpoints - Integration Tests
 * 
 * Tests for GET/DELETE /(admin)/quizzes/[quizId] endpoints
 */

import { GET, DELETE } from "@/app/api/(admin)/quizzes/[quizId]/route";
import { prisma } from "@/server/core/db";
import { createApprovedAdminQuiz } from "@/server/admin/services/adminQuizService";
import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

jest.setTimeout(30000);

describe("/api/(admin)/quizzes/[quizId] Endpoints", () => {
  let adminUser: User;
  let normalUser: User;
  let testQuizId: string;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminquizid@example.com", "userquizid@example.com"] } },
    });
    adminUser = await prisma.user.create({
      data: { email: "adminquizid@example.com", isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: "userquizid@example.com", isAdmin: false },
    });

    // Create a test quiz
    const quiz = await createApprovedAdminQuiz({
      title: `Test Quiz for ID Endpoint ${Date.now()}`,
      category: "General",
      difficulty: "easy",
      questions: [
        {
          question: "What is 2+2?",
          answer: "4",
          type: "mcq",
          options: ["3", "4", "5"],
        },
      ],
    });
    testQuizId = quiz.id;
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminquizid@example.com", "userquizid@example.com"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /(admin)/quizzes/[quizId] - Get Single Quiz", () => {
    it("returns 401 if not admin", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes/[quizId]", {
        method: "GET",
        headers: { "x-test-user-email": normalUser.email },
      });
      const res = await GET(req as unknown as NextRequest, {
        params: { quizId: testQuizId },
      });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/admin/i);
    });

    it("retrieves quiz details as admin", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes/[quizId]", {
        method: "GET",
        headers: { "x-test-user-email": adminUser.email },
      });
      const res = await GET(req as unknown as NextRequest, {
        params: { quizId: testQuizId },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.quiz).toBeDefined();
      expect(json.quiz.id).toBe(testQuizId);
      expect(json.quiz.title).toMatch(/Test Quiz for ID Endpoint/);
    });

    it("returns 404 for non-existent quiz", async () => {
      const fakeUuid = uuidv4();
      const req = new Request("http://localhost/api/(admin)/quizzes/[quizId]", {
        method: "GET",
        headers: { "x-test-user-email": adminUser.email },
      });
      const res = await GET(req as unknown as NextRequest, {
        params: { quizId: fakeUuid },
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toMatch(/not found/i);
    });

    it("returns 400 for invalid quiz ID format", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes/[quizId]", {
        method: "GET",
        headers: { "x-test-user-email": adminUser.email },
      });
      const res = await GET(req as unknown as NextRequest, {
        params: { quizId: "invalid-id-format" },
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/invalid|quiz id/i);
    });
  });

  describe("DELETE /(admin)/quizzes/[quizId] - Delete Quiz", () => {
    it("returns 401 if not admin", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes/[quizId]", {
        method: "DELETE",
        headers: { "x-test-user-email": normalUser.email },
      });
      const res = await DELETE(req as unknown as NextRequest, {
        params: { quizId: testQuizId },
      });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/admin/i);
    });

    it("deletes quiz as admin", async () => {
      // Create a quiz to delete
      const quizToDelete = await createApprovedAdminQuiz({
        title: `Quiz to Delete ${Date.now()}`,
        category: "General",
        difficulty: "hard",
        questions: [
          {
            question: "Test?",
            answer: "Yes",
            type: "mcq",
            options: ["Yes", "No"],
          },
        ],
      });

      const req = new Request("http://localhost/api/(admin)/quizzes/[quizId]", {
        method: "DELETE",
        headers: { "x-test-user-email": adminUser.email },
      });
      const res = await DELETE(req as unknown as NextRequest, {
        params: { quizId: quizToDelete.id },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toMatch(/successfully/i);
    });

    it("returns 400 for invalid quiz ID format", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes/[quizId]", {
        method: "DELETE",
        headers: { "x-test-user-email": adminUser.email },
      });
      const res = await DELETE(req as unknown as NextRequest, {
        params: { quizId: "invalid-id" },
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/invalid|quiz id/i);
    });

    it("handles empty quiz ID string", async () => {
      const req = new Request("http://localhost/api/(admin)/quizzes/[quizId]", {
        method: "DELETE",
        headers: { "x-test-user-email": adminUser.email },
      });
      const res = await DELETE(req as unknown as NextRequest, {
        params: { quizId: "" },
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });
});
