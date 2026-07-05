import { POST } from "@/app/api/(admin)/quizzes/generate-from-file/route";
import { prisma } from "@/server/core/db";
import type { NextRequest } from "next/server";
import type { User } from "@prisma/client";

jest.setTimeout(60000);

describe("POST /api/(admin)/quizzes/generate-from-file - Integration", () => {
  let adminUser: User;

  beforeAll(async () => {
    const timestamp = Date.now();
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: `generate-file-int-${timestamp}@example.com`,
        },
      },
    });
    adminUser = await prisma.user.create({
      data: {
        email: `admin-generate-file-int-${timestamp}@example.com`,
        isAdmin: true,
      },
    });
  });

  afterAll(async () => {
    if (adminUser?.id) {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
    await prisma.$disconnect();
  });

  const createRequest = (
    file: Blob,
    options: {
      quizType?: string;
      questionCount?: string;
      category?: string;
      difficulty?: string;
      email?: string;
    } = {},
  ) => {
    const formData = new FormData();
    formData.append("file", file, "test.txt");

    if (options.quizType) formData.append("quizType", options.quizType);
    if (options.questionCount)
      formData.append("questionCount", options.questionCount);
    if (options.category) formData.append("category", options.category);
    if (options.difficulty) formData.append("difficulty", options.difficulty);

    const req = new Request(
      "http://localhost/api/(admin)/quizzes/generate-from-file",
      {
        method: "POST",
        body: formData,
        headers: {
          "x-test-user-email": options.email || adminUser.email,
        },
      },
    );

    return req as unknown as NextRequest;
  };

  describe("Authentication", () => {
    it("should reject non-admin with 401", async () => {
      const timestamp = Date.now();
      const regularUser = await prisma.user.create({
        data: {
          email: `regular-gen-file-${timestamp}@example.com`,
          isAdmin: false,
        },
      });

      const file = new Blob(["sample content"], { type: "text/plain" });

      const response = await POST(
        createRequest(file, {
          quizType: "mcq",
          questionCount: "5",
          email: regularUser.email,
        }),
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toContain("admin");

      await prisma.user.delete({ where: { id: regularUser.id } });
    });
  });

  describe("File validation", () => {
    it("should return 400 when no file provided", async () => {
      const formData = new FormData();
      formData.append("quizType", "mcq");
      formData.append("questionCount", "5");

      const req = new Request(
        "http://localhost/api/(admin)/quizzes/generate-from-file",
        {
          method: "POST",
          body: formData,
          headers: {
            "x-test-user-email": adminUser.email,
          },
        },
      );

      const response = await POST(req as unknown as NextRequest);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("file");
    });
  });

  describe("Quiz type validation", () => {
    it("should return 400 when quiz type is missing", async () => {
      const file = new Blob(["sample content"], { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", file, "test.txt");
      formData.append("questionCount", "5");

      const req = new Request(
        "http://localhost/api/(admin)/quizzes/generate-from-file",
        {
          method: "POST",
          body: formData,
          headers: {
            "x-test-user-email": adminUser.email,
          },
        },
      );

      const response = await POST(req as unknown as NextRequest);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid quiz type");
    });

    it("should return 400 when quiz type is invalid", async () => {
      const file = new Blob(["sample content"], { type: "text/plain" });

      const response = await POST(
        createRequest(file, {
          quizType: "invalid",
          questionCount: "5",
        }),
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid quiz type");
    });

    it("should accept mcq quiz type", async () => {
      const file = new Blob(["sample content"], { type: "text/plain" });

      const response = await POST(
        createRequest(file, {
          quizType: "mcq",
          questionCount: "5",
        }),
      );

      // May fail due to API call, but should not fail on quiz type
      if (response.status === 400) {
        const body = await response.json();
        expect(body.error).not.toContain("Invalid quiz type");
      }
    });

    it("should accept open_ended quiz type", async () => {
      const file = new Blob(["sample content"], { type: "text/plain" });

      const response = await POST(
        createRequest(file, {
          quizType: "open_ended",
          questionCount: "5",
        }),
      );

      // May fail due to API call, but should not fail on quiz type
      if (response.status === 400) {
        const body = await response.json();
        expect(body.error).not.toContain("Invalid quiz type");
      }
    });
  });

  describe("Question count validation", () => {
    it("should return 400 when question count is missing", async () => {
      const file = new Blob(["sample content"], { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", file, "test.txt");
      formData.append("quizType", "mcq");

      const req = new Request(
        "http://localhost/api/(admin)/quizzes/generate-from-file",
        {
          method: "POST",
          body: formData,
          headers: {
            "x-test-user-email": adminUser.email,
          },
        },
      );

      const response = await POST(req as unknown as NextRequest);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("between 1 and 50");
    });

    it("should return 400 when question count is 0", async () => {
      const file = new Blob(["sample content"], { type: "text/plain" });

      const response = await POST(
        createRequest(file, {
          quizType: "mcq",
          questionCount: "0",
        }),
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("between 1 and 50");
    });

    it("should return 400 when question count exceeds 50", async () => {
      const file = new Blob(["sample content"], { type: "text/plain" });

      const response = await POST(
        createRequest(file, {
          quizType: "mcq",
          questionCount: "100",
        }),
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("between 1 and 50");
    });

    it("should pass for valid question count", async () => {
      const file = new Blob(["sample content"], { type: "text/plain" });

      const response = await POST(
        createRequest(file, {
          quizType: "mcq",
          questionCount: "5",
        }),
      );

      // Won't return 400 for question count if valid
      if (response.status === 400) {
        const body = await response.json();
        expect(body.error).not.toContain("between 1 and 50");
      }
    });
  });
});
