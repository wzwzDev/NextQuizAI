import nodemailer from "nodemailer";
import { SMTPEmailSenderAdapter } from "@/infrastructure/mail/SMTPEmailSenderAdapter";
import { ResendEmailSenderAdapter } from "@/infrastructure/mail/ResendEmailSenderAdapter";

// Mock nodemailer
jest.mock("nodemailer");

// Mock fetch for Resend API
global.fetch = jest.fn();

function setTestNodeEnv(value: string | undefined) {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });
}

describe("SMTPEmailSenderAdapter", () => {
  const originalEnv = process.env;
  let mockTransporter: any;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
    jest.clearAllMocks();

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id", response: "250 OK" }),
      verify: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe("sendVerification", () => {
    it("should send verification email with valid SMTP config", async () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASS = "password";
      process.env.EMAIL_FROM = "noreply@example.com";

      const adapter = new SMTPEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await adapter.sendVerification(input);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@example.com",
          to: "user@test.com",
          subject: "Verify your QuizUPM account",
        }),
      );
      expect(mockTransporter.close).toHaveBeenCalled();
    });

    it("should use default FROM address when EMAIL_FROM not set", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";
      delete process.env.EMAIL_FROM;

      const adapter = new SMTPEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await adapter.sendVerification(input);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "no-reply@nextquizai.local",
        }),
      );
    });

    it("should include verification URL in email content", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      const adapter = new SMTPEmailSenderAdapter();
      const verificationUrl = "https://example.com/verify?token=abc123xyz";
      const input = {
        to: "user@test.com",
        verificationUrl,
      };

      await adapter.sendVerification(input);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain(verificationUrl);
      expect(callArgs.html).toContain(verificationUrl);
    });

    it("should throw error when SMTP_HOST is missing", async () => {
      delete process.env.SMTP_HOST;
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      const adapter = new SMTPEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await expect(adapter.sendVerification(input)).rejects.toThrow(
        "SMTP configuration incomplete",
      );
    });

    it("should throw error when SMTP_PORT is missing", async () => {
      process.env.SMTP_HOST = "localhost";
      delete process.env.SMTP_PORT;
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      const adapter = new SMTPEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await expect(adapter.sendVerification(input)).rejects.toThrow(
        "SMTP configuration incomplete",
      );
    });

    it("should throw error when SMTP_USER is missing", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      delete process.env.SMTP_USER;
      process.env.SMTP_PASS = "pass";

      const adapter = new SMTPEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await expect(adapter.sendVerification(input)).rejects.toThrow(
        "SMTP configuration incomplete",
      );
    });

    it("should throw error when SMTP_PASS is missing", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      delete process.env.SMTP_PASS;

      const adapter = new SMTPEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await expect(adapter.sendVerification(input)).rejects.toThrow(
        "SMTP configuration incomplete",
      );
    });

    it("should set secure flag based on port 465", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      const adapter = new SMTPEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true,
        }),
      );
    });

    it("should not set secure flag for port 587", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      const adapter = new SMTPEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 587,
          secure: false,
        }),
      );
    });

    it("should skip transporter.verify() in test environment", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";
      const originalNodeEnv = process.env.NODE_ENV;
      setTestNodeEnv("test");

      const adapter = new SMTPEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(mockTransporter.verify).not.toHaveBeenCalled();
      setTestNodeEnv(originalNodeEnv);
    });

    it("should reject unauthorized certs in production", async () => {
      // Ensure NODE_ENV is production - don't use beforeEach's test env
      delete process.env.SMTP_ALLOW_SELF_SIGNED;
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";
      // Critically: Override NODE_ENV right before adapter call
      const originalNodeEnv = process.env.NODE_ENV;
      setTestNodeEnv("production");

      const adapter = new SMTPEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          tls: expect.objectContaining({
            rejectUnauthorized: true,
          }),
        }),
      );
      setTestNodeEnv(originalNodeEnv);
    });

    it("should allow self-signed certs in development", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";
      const originalNodeEnv = process.env.NODE_ENV;
      setTestNodeEnv("development");
      delete process.env.SMTP_ALLOW_SELF_SIGNED;

      const adapter = new SMTPEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          tls: expect.objectContaining({
            rejectUnauthorized: false,
          }),
        }),
      );
      setTestNodeEnv(originalNodeEnv);
    });

    it("should allow self-signed certs when explicitly enabled", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";
      const originalNodeEnv = process.env.NODE_ENV;
      setTestNodeEnv("production");
      process.env.SMTP_ALLOW_SELF_SIGNED = "true";

      const adapter = new SMTPEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          tls: expect.objectContaining({
            rejectUnauthorized: false,
          }),
        }),
      );
      setTestNodeEnv(originalNodeEnv);
    });

    it("should log successful email send", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      const consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
      const adapter = new SMTPEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("Verification email sent to user@test.com"),
      );
      consoleInfoSpy.mockRestore();
    });

    it("should log and re-throw send errors", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      mockTransporter.sendMail.mockRejectedValueOnce(new Error("SMTP send failed"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const adapter = new SMTPEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await expect(adapter.sendVerification(input)).rejects.toThrow("SMTP send failed");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send verification email"),
      );
      consoleErrorSpy.mockRestore();
    });

    it("should extract messageId from transporter response", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      mockTransporter.sendMail.mockResolvedValueOnce({
        messageId: "<abc123@localhost>",
        response: "250 OK",
      });

      const adapter = new SMTPEmailSenderAdapter();
      const consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("<abc123@localhost>"),
      );
      consoleInfoSpy.mockRestore();
    });

    it("should always close transporter even if send fails", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      mockTransporter.sendMail.mockRejectedValueOnce(new Error("Send failed"));
      jest.spyOn(console, "error").mockImplementation(() => {});

      const adapter = new SMTPEmailSenderAdapter();

      try {
        await adapter.sendVerification({
          to: "user@test.com",
          verificationUrl: "https://example.com/verify?token=123",
        });
      } catch (e) {
        // Expected error
      }

      expect(mockTransporter.close).toHaveBeenCalled();
    });
  });
});

describe("ResendEmailSenderAdapter", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe("sendVerification", () => {
    it("should send verification email with valid API key", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      process.env.EMAIL_FROM = "noreply@example.com";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-id-123" }),
        text: async () => "OK",
      });

      const adapter = new ResendEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await adapter.sendVerification(input);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should throw error when RESEND_API_KEY is not configured", async () => {
      delete process.env.RESEND_API_KEY;

      const adapter = new ResendEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await expect(adapter.sendVerification(input)).rejects.toThrow(
        "RESEND_API_KEY is not configured",
      );
    });

    it("should use default FROM address when EMAIL_FROM not set", async () => {
      process.env.RESEND_API_KEY = "test-api-key";
      delete process.env.EMAIL_FROM;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-id-123" }),
        text: async () => "OK",
      });

      const adapter = new ResendEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.from).toBe("onboarding@resend.dev");
    });

    it("should include verification URL in email content", async () => {
      process.env.RESEND_API_KEY = "test-api-key";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-id-123" }),
        text: async () => "OK",
      });

      const adapter = new ResendEmailSenderAdapter();
      const verificationUrl = "https://example.com/verify?token=abc123xyz";
      const input = {
        to: "user@test.com",
        verificationUrl,
      };

      await adapter.sendVerification(input);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.text).toContain(verificationUrl);
      expect(body.html).toContain(verificationUrl);
    });

    it("should throw error when API response is not ok", async () => {
      process.env.RESEND_API_KEY = "test-api-key";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      const adapter = new ResendEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await expect(adapter.sendVerification(input)).rejects.toThrow(
        "Resend API error: 401 - Unauthorized",
      );
    });

    it("should throw error when API response does not include email ID", async () => {
      process.env.RESEND_API_KEY = "test-api-key";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        text: async () => "OK",
      });

      const adapter = new ResendEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await expect(adapter.sendVerification(input)).rejects.toThrow(
        "Resend API did not return an email ID",
      );
    });

    it("should log successful email send with message ID", async () => {
      process.env.RESEND_API_KEY = "test-api-key";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-id-123" }),
        text: async () => "OK",
      });

      const consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
      const adapter = new ResendEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("Verification email sent to user@test.com"),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("email-id-123"),
      );
      consoleInfoSpy.mockRestore();
    });

    it("should log and re-throw API errors", async () => {
      process.env.RESEND_API_KEY = "test-api-key";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const adapter = new ResendEmailSenderAdapter();
      const input = {
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      };

      await expect(adapter.sendVerification(input)).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send verification email"),
      );
      consoleErrorSpy.mockRestore();
    });

    it("should send request with correct email subject", async () => {
      process.env.RESEND_API_KEY = "test-api-key";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-id-123" }),
        text: async () => "OK",
      });

      const adapter = new ResendEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.subject).toBe("Verify your QuizUPM account");
    });

    it("should trim API key whitespace", async () => {
      process.env.RESEND_API_KEY = "  test-api-key  ";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-id-123" }),
        text: async () => "OK",
      });

      const adapter = new ResendEmailSenderAdapter();
      await adapter.sendVerification({
        to: "user@test.com",
        verificationUrl: "https://example.com/verify?token=123",
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBe("Bearer test-api-key");
    });

    it("should send email to correct recipient", async () => {
      process.env.RESEND_API_KEY = "test-api-key";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-id-123" }),
        text: async () => "OK",
      });

      const adapter = new ResendEmailSenderAdapter();
      const testEmail = "recipient@example.com";
      await adapter.sendVerification({
        to: testEmail,
        verificationUrl: "https://example.com/verify?token=123",
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.to).toBe(testEmail);
    });
  });
});
