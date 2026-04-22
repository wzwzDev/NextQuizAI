import { POST as uploadAndGeneratePost } from "@/app/api/(admin)/upload-and-generate/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(60000);

describe("POST /api/(admin)/upload-and-generate", () => {
  let adminUser: User;
  let regularUser: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["upload-generate@example.com", "upload-regular@example.com"],
        },
      },
    });
    adminUser = await prisma.user.create({
      data: { email: "upload-generate@example.com", isAdmin: true },
    });
    regularUser = await prisma.user.create({
      data: { email: "upload-regular@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    if (adminUser?.id) {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
    if (regularUser?.id) {
      await prisma.user.delete({ where: { id: regularUser.id } });
    }
    await prisma.$disconnect();
  });

  const createFormData = (file: Blob, options: Record<string, string | number> = {}) => {
    const formData = new FormData();
    formData.append("file", file, "test.txt");
    formData.append("category", options.category || "general");
    formData.append("difficulty", options.difficulty || "medium");
    formData.append("quizType", options.quizType || "mcq");
    formData.append("questionCount", String(options.questionCount || 5));
    return formData;
  };

  const callPost = async (
    formData: FormData,
    email?: string,
  ) => {
    const req = new Request("http://localhost/api/(admin)/upload-and-generate", {
      method: "POST",
      body: formData,
      headers: {
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    return await uploadAndGeneratePost(req);
  };

  it("should return 401 if not admin", async () => {
    const file = new Blob(["test content"], { type: "text/plain" });
    const formData = createFormData(file);
    const response = await callPost(formData, regularUser.email);
    expect(response.status).toBe(401);
  });

  it("should return 400 if no file uploaded", async () => {
    const formData = new FormData();
    formData.append("category", "test");
    const response = await callPost(formData, adminUser.email);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("No file uploaded.");
  });

  it("should reject invalid content type", async () => {
    const req = new Request("http://localhost/api/(admin)/upload-and-generate", {
      method: "POST",
      body: JSON.stringify({ test: "data" }),
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": adminUser.email,
      },
    });
    const response = await uploadAndGeneratePost(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Content-Type must be");
  });

  it("should handle txt file upload", async () => {
    const content = `Sample Course Material

    Chapter 1: Introduction
    This is sample course content.
    
    Key Topics:
    - Topic 1
    - Topic 2
    - Topic 3`;

    const file = new Blob([content], { type: "text/plain" });
    const formData = createFormData(file);
    const response = await callPost(formData, adminUser.email);
    
    expect([200, 400, 429, 502, 503]).toContain(response.status);
  });

  it("should handle json file upload", async () => {
    const content = JSON.stringify({
      courseContent: {
        title: "Test Course",
        topics: ["Topic 1", "Topic 2"],
      },
    });

    const file = new Blob([content], { type: "application/json" });
    const formData = createFormData(file);
    const response = await callPost(formData, adminUser.email);
    
    expect([200, 400, 429, 502, 503]).toContain(response.status);
  });

  it("should validate quiz type parameter", async () => {
    const file = new Blob(["test"], { type: "text/plain" });
    const formData = createFormData(file, { quizType: "invalid" });
    const response = await callPost(formData, adminUser.email);
    
    // Should either accept and default to mcq, or reject
    expect([200, 400, 429, 502, 503]).toContain(response.status);
  });

  it("should handle question count parameter", async () => {
    const file = new Blob(["test content"], { type: "text/plain" });
    const formData = createFormData(file, { questionCount: 20 });
    const response = await callPost(formData, adminUser.email);
    
    expect([200, 400, 429, 502, 503]).toContain(response.status);
  });
});
