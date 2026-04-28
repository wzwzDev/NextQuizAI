import { POST } from "@/app/api/auth/verify-email/route";
import { createEmailVerificationToken } from "@/server/auth/emailVerification";
import { prisma } from "@/server/core/db";
import type { NextRequest } from "next/server";

jest.setTimeout(30000);

describe("POST /api/auth/verify-email", () => {
  let testEmail: string;
  let testToken: string;

  beforeAll(async () => {
    testEmail = `verify-email-test-${Date.now()}@example.com`;
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.emailVerificationToken.deleteMany({ where: { email: testEmail } });

    // Create a user to verify
    await prisma.user.create({
      data: { email: testEmail, name: "Test User" },
    });

    // Create a verification token
    const result = await createEmailVerificationToken(testEmail);
    testToken = result.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.emailVerificationToken.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  const callPost = async (body: unknown) => {
    const req = new Request("http://localhost/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as NextRequest;
    return await POST(req);
  };

  it("should verify valid token and mark user as verified", async () => {
    const response = await callPost({ token: testToken });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { success?: boolean; email?: string };
    expect(body.success).toBe(true);
    expect(body.email).toBe(testEmail);

    // Verify user has emailVerified set
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user?.emailVerified).toBeTruthy();
  });

  it("should reject invalid token", async () => {
    const response = await callPost({ token: "invalid-token-123" });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBe("Invalid token");
  });

  it("should reject already consumed token", async () => {
    const newEmail = `verify-consumed-${Date.now()}@example.com`;
    await prisma.user.deleteMany({ where: { email: newEmail } });
    await prisma.user.create({ data: { email: newEmail } });

    const { token } = await createEmailVerificationToken(newEmail);

    // First verification should succeed
    const firstResponse = await callPost({ token });
    expect(firstResponse.status).toBe(200);

    // Second attempt with same token should fail
    const secondResponse = await callPost({ token });
    expect(secondResponse.status).toBe(400);

    await prisma.user.deleteMany({ where: { email: newEmail } });
    await prisma.emailVerificationToken.deleteMany({ where: { email: newEmail } });
  });

  it("should reject expired token", async () => {
    const expiredEmail = `verify-expired-${Date.now()}@example.com`;
    await prisma.user.deleteMany({ where: { email: expiredEmail } });
    await prisma.user.create({ data: { email: expiredEmail } });

    // Create token with past expiry
    const token = "expired-token-" + Math.random().toString(36);
    const tokenHash = require("crypto").createHash("sha256").update(token).digest("hex");

    await prisma.emailVerificationToken.create({
      data: {
        email: expiredEmail,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      },
    });

    const response = await callPost({ token });
    expect(response.status).toBe(400);

    await prisma.user.deleteMany({ where: { email: expiredEmail } });
    await prisma.emailVerificationToken.deleteMany({ where: { email: expiredEmail } });
  });

  it("should return 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json",
    }) as NextRequest;
    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("Invalid JSON");
  });

  it("should reject token shorter than minimum length", async () => {
    const response = await callPost({ token: "short" });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBeDefined();
  });
});
