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

import { buildVerificationUrl, sendVerificationEmail } from "@/server/mailer/email";

describe("server mailer email", () => {
  const OLD_ENV = process.env;

  const setNodeEnv = (value: string) => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value,
      configurable: true,
      writable: true,
    });
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("buildVerificationUrl prefers NEXTAUTH_URL then APP_URL then localhost", () => {
    process.env.NEXTAUTH_URL = "https://nextauth.example";
    process.env.APP_URL = "https://app.example";
    expect(buildVerificationUrl("abc 123")).toContain("https://nextauth.example");

    delete process.env.NEXTAUTH_URL;
    expect(buildVerificationUrl("abc")).toContain("https://app.example");

    delete process.env.APP_URL;
    expect(buildVerificationUrl("abc")).toContain("http://localhost:3000");
  });

  it("throws in production when SMTP is missing", async () => {
    setNodeEnv("production");
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    await expect(
      sendVerificationEmail({
        to: "prod@example.com",
        verificationUrl: "https://example/verify",
      }),
    ).rejects.toThrow(/SMTP configuration incomplete/i);
  });

  it("does not throw when SMTP variables are configured", async () => {
    setNodeEnv("test");
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    delete process.env.EMAIL_FROM;

    await expect(sendVerificationEmail({
      to: "user@example.com",
      verificationUrl: "https://example/verify",
    })).resolves.toBeUndefined();
  });
});
