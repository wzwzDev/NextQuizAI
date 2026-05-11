jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: "m-1" }),
      verify: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/server/core/db";
import type { NextRequest } from "next/server";

jest.setTimeout(30000);

describe("POST /api/auth/register", () => {
  const testEmail = `register-test-${Date.now()}@example.com`;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.emailVerificationToken.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  const callPost = async (body: unknown) => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as NextRequest;
    return await POST(req);
  };

  it("should register user with valid email and password", async () => {
    const response = await callPost({
      email: testEmail,
      password: "ValidPassword123",
      name: "Test User",
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { success?: boolean; message?: string };
    expect(body.success).toBe(true);
    expect(body.message).toContain("Check your email");

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).toBeDefined();
    expect(user?.name).toBe("Test User");
  });

  it("should reject invalid email", async () => {
    const response = await callPost({
      email: "not-an-email",
      password: "ValidPassword123",
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBeDefined();
  });

  it("should reject password shorter than 8 characters", async () => {
    const response = await callPost({
      email: "short-pass@example.com",
      password: "short",
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBeDefined();
  });

  it("should reject duplicate email registration", async () => {
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;
    
    // First registration
    await callPost({
      email: duplicateEmail,
      password: "ValidPassword123",
    });

    // Second registration with same email
    const response = await callPost({
      email: duplicateEmail,
      password: "ValidPassword456",
    });

    expect(response.status).toBe(409);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("already exists");
  });

  it("should return 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json",
    }) as NextRequest;
    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("Invalid JSON");
  });

  it("should create email verification token on registration", async () => {
    const newEmail = `verify-token-${Date.now()}@example.com`;
    
    await callPost({
      email: newEmail,
      password: "ValidPassword123",
    });

    const token = await prisma.emailVerificationToken.findFirst({
      where: { email: newEmail },
    });

    expect(token).toBeDefined();
    expect(token?.tokenHash).toBeDefined();
    expect(token?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should normalize email to lowercase", async () => {
    const mixedCaseEmail = `MixedCase${Date.now()}@Example.com`;
    
    await callPost({
      email: mixedCaseEmail,
      password: "ValidPassword123",
    });

    const user = await prisma.user.findUnique({
      where: { email: mixedCaseEmail.toLowerCase() },
    });

    expect(user).toBeDefined();
    expect(user?.email).toBe(mixedCaseEmail.toLowerCase());
  });

  it("should accept optional name field", async () => {
    const noNameEmail = `no-name-${Date.now()}@example.com`;
    
    const response = await callPost({
      email: noNameEmail,
      password: "ValidPassword123",
    });

    expect(response.status).toBe(201);

    const user = await prisma.user.findUnique({ where: { email: noNameEmail } });
    expect(user?.name).toBeNull();
  });
});
