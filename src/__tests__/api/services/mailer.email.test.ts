import { buildVerificationUrl, sendVerificationEmail } from "@/server/mailer/email";

describe("server mailer email", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
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

  it("sends verification email through the configured provider", async () => {
    await expect(
      sendVerificationEmail({
        to: "user@example.com",
        verificationUrl: "https://example/verify",
      }),
    ).resolves.toBeUndefined();
  });
});
