import { hashPassword, verifyPassword, normalizeEmail } from "@/server/auth/password";
import {
  createEmailVerificationToken,
  verifyEmailToken,
} from "@/server/auth/emailVerification";
import { prisma } from "@/server/core/db";
import {
  cleanupUsersByEmail,
  createTestUser,
  uniqueEmail,
} from "../../utils/prismaUsers";

jest.setTimeout(30000);

describe("Password utilities", () => {
  it("should hash password consistently", async () => {
    const password = "MySecurePassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // Hashes should be different (random salt)
    expect(hash1).not.toBe(hash2);

    // Both should verify correctly
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const password = "CorrectPassword123";
    const hash = await hashPassword(password);

    expect(await verifyPassword("WrongPassword123", hash)).toBe(false);
  });

  it("should reject malformed hash", async () => {
    expect(await verifyPassword("password", "malformed-hash")).toBe(false);
    expect(await verifyPassword("password", "no-colon-hash")).toBe(false);
  });

  it("should normalize email to lowercase", () => {
    expect(normalizeEmail("USER@Example.com")).toBe("user@example.com");
    expect(normalizeEmail("  UPPERCASE@DOMAIN.COM  ")).toBe("uppercase@domain.com");
  });

  it("should handle empty and whitespace emails", () => {
    expect(normalizeEmail("   ")).toBe("");
    expect(normalizeEmail("")).toBe("");
  });
});

describe("Email verification token utilities", () => {
  let testEmail: string;

  beforeAll(async () => {
    testEmail = uniqueEmail("token-test");
    await cleanupUsersByEmail(prisma, [testEmail]);
  });

  afterAll(async () => {
    await cleanupUsersByEmail(prisma, [testEmail]);
    await prisma.$disconnect();
  });

  it("should create and verify valid token", async () => {
    await createTestUser(prisma, { email: testEmail });

    const { token } = await createEmailVerificationToken(testEmail);
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    const result = await verifyEmailToken(token);
    expect(result.ok).toBe(true);
    expect(result.email).toBe(testEmail);
  });

  it("should reject invalid token", async () => {
    const result = await verifyEmailToken("invalid-token-format");
    expect(result.ok).toBe(false);
  });

  it("should reject token for non-existent user", async () => {
    const nonExistentEmail = `non-existent-${Date.now()}@example.com`;
    const { token } = await createEmailVerificationToken(nonExistentEmail);

    const result = await verifyEmailToken(token);
    expect(result.ok).toBe(false);
  });

  it("should replace previous unclaimed tokens", async () => {
    const multiEmail = uniqueEmail("multi-token");
    await cleanupUsersByEmail(prisma, [multiEmail]);
    await createTestUser(prisma, { email: multiEmail });

    const { token: token1 } = await createEmailVerificationToken(multiEmail);
    const { token: token2 } = await createEmailVerificationToken(multiEmail);

    // Only the latest token should be valid
    const result1 = await verifyEmailToken(token1);
    expect(result1.ok).toBe(false);

    const result2 = await verifyEmailToken(token2);
    expect(result2.ok).toBe(true);

    await cleanupUsersByEmail(prisma, [multiEmail]);
  });

  it("should mark token as consumed after verification", async () => {
    const consumeEmail = uniqueEmail("consume-token");
    await cleanupUsersByEmail(prisma, [consumeEmail]);
    await createTestUser(prisma, { email: consumeEmail });

    const { token } = await createEmailVerificationToken(consumeEmail);

    // First verification should succeed
    const result1 = await verifyEmailToken(token);
    expect(result1.ok).toBe(true);

    // Second verification should fail (token consumed)
    const result2 = await verifyEmailToken(token);
    expect(result2.ok).toBe(false);

    await cleanupUsersByEmail(prisma, [consumeEmail]);
  });

  it("should set user emailVerified timestamp", async () => {
    const verifyEmail = uniqueEmail("verify-timestamp");
    await cleanupUsersByEmail(prisma, [verifyEmail]);
    const user = await createTestUser(prisma, { email: verifyEmail });
    
    expect(user.emailVerified).toBeNull();

    const { token } = await createEmailVerificationToken(verifyEmail);
    await verifyEmailToken(token);

    const updatedUser = await prisma.user.findUnique({ where: { email: verifyEmail } });
    expect(updatedUser?.emailVerified).toBeTruthy();
    expect(updatedUser!.emailVerified!.getTime()).toBeLessThanOrEqual(Date.now());

    await cleanupUsersByEmail(prisma, [verifyEmail]);
  });
});
