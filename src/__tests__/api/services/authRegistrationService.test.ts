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

import { registerUserWithEmailPassword, RegistrationConflictError } from "@/server/services/authRegistrationService";
import { prisma } from "@/server/core/db";

jest.setTimeout(30000);

describe("authRegistrationService", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: "register-service-test-" } },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { email: { startsWith: "register-service-test-" } },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: "register-service-test-" } },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { email: { startsWith: "register-service-test-" } },
    });
    await prisma.$disconnect();
  });

  it("should register user with email and password", async () => {
    const email = `register-service-test-${Date.now()}@example.com`;

    await registerUserWithEmailPassword({
      email,
      password: "ValidPassword123",
      name: "Test User",
    });

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeDefined();
    expect(user?.email).toBe(email);
    expect(user?.name).toBe("Test User");
    expect(user?.passwordHash).toBeDefined();
    expect(user?.emailVerified).toBeNull();
  });

  it("should create verification token on registration", async () => {
    const email = `register-service-token-${Date.now()}@example.com`;

    await registerUserWithEmailPassword({
      email,
      password: "ValidPassword123",
    });

    const token = await prisma.emailVerificationToken.findFirst({
      where: { email },
    });

    expect(token).toBeDefined();
    expect(token?.consumedAt).toBeNull();
  });

  it("should reject duplicate email registration", async () => {
    const email = `register-service-duplicate-${Date.now()}@example.com`;

    // First registration
    await registerUserWithEmailPassword({
      email,
      password: "Password123",
    });

    // Second registration should throw
    await expect(
      registerUserWithEmailPassword({
        email,
        password: "AnotherPassword123",
      }),
    ).rejects.toThrow(RegistrationConflictError);

    await expect(
      registerUserWithEmailPassword({
        email,
        password: "AnotherPassword123",
      }),
    ).rejects.toThrow("already exists");
  });

  it("should normalize email before checking duplicates", async () => {
    const baseEmail = `register-service-normalize-${Date.now()}@example.com`;

    // Register with lowercase
    await registerUserWithEmailPassword({
      email: baseEmail,
      password: "Password123",
    });

    // Try to register with uppercase
    await expect(
      registerUserWithEmailPassword({
        email: baseEmail.toUpperCase(),
        password: "AnotherPassword123",
      }),
    ).rejects.toThrow(RegistrationConflictError);
  });

  it("should trim and handle optional name", async () => {
    const email = `register-service-trim-${Date.now()}@example.com`;

    await registerUserWithEmailPassword({
      email,
      password: "Password123",
      name: "   Padded Name   ",
    });

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.name).toBe("Padded Name");
  });

  it("should set name to null if empty after trim", async () => {
    const email = `register-service-empty-name-${Date.now()}@example.com`;

    await registerUserWithEmailPassword({
      email,
      password: "Password123",
      name: "   ",
    });

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.name).toBeNull();
  });

  it("should hash password", async () => {
    const email = `register-service-hash-${Date.now()}@example.com`;
    const plainPassword = "MySecurePassword123";

    await registerUserWithEmailPassword({
      email,
      password: plainPassword,
    });

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe(plainPassword);
    expect(user?.passwordHash).toContain(":");
  });

  it("should throw error with message if database fails", async () => {
    // Mock prisma to fail
    const originalCreate = prisma.user.create;
    prisma.user.create = jest.fn().mockRejectedValueOnce(new Error("DB Error"));

    const email = `register-service-db-error-${Date.now()}@example.com`;

    await expect(
      registerUserWithEmailPassword({
        email,
        password: "Password123",
      }),
    ).rejects.toThrow();

    // Restore
    prisma.user.create = originalCreate;
  });

  it("should tolerate RegistrationConflictError being thrown explicitly", async () => {
    const error = new RegistrationConflictError("Test error message");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Test error message");
  });
});
