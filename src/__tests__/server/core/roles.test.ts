import { getOwnerEmail, isOwnerEmail, getAdminCredentialsConfig } from "@/server/core/roles";

describe("roles", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("normalizeEmail (via getOwnerEmail)", () => {
    it("should normalize email to lowercase", () => {
      process.env.OWNER_EMAIL = "Owner@Example.COM";
      process.env.NODE_ENV = "test";
      const email = getOwnerEmail();
      expect(email).toBe("owner@example.com");
    });

    it("should trim whitespace from email", () => {
      process.env.OWNER_EMAIL = "  owner@example.com  ";
      process.env.NODE_ENV = "test";
      const email = getOwnerEmail();
      expect(email).toBe("owner@example.com");
    });

    it("should handle empty string", () => {
      process.env.OWNER_EMAIL = "";
      process.env.NODE_ENV = "test";
      const email = getOwnerEmail();
      expect(email).toBe("");
    });
  });

  describe("getOwnerEmail", () => {
    it("should return owner email from environment", () => {
      process.env.OWNER_EMAIL = "owner@example.com";
      process.env.NODE_ENV = "test";
      const email = getOwnerEmail();
      expect(email).toBe("owner@example.com");
    });

    it("should return empty string when OWNER_EMAIL is not set in test environment", () => {
      delete process.env.OWNER_EMAIL;
      process.env.NODE_ENV = "test";
      const email = getOwnerEmail();
      expect(email).toBe("");
    });

    it("should return empty string when OWNER_EMAIL is null in test environment", () => {
      process.env.OWNER_EMAIL = "";
      process.env.NODE_ENV = "test";
      const email = getOwnerEmail();
      expect(email).toBe("");
    });

    it("should return empty string during production build prerender phase", () => {
      delete process.env.OWNER_EMAIL;
      process.env.NODE_ENV = "production";
      process.env.NEXT_PHASE = "phase-production-build";
      const email = getOwnerEmail();
      expect(email).toBe("");
    });

    it("should throw error when OWNER_EMAIL missing in production (not prerender)", () => {
      delete process.env.OWNER_EMAIL;
      process.env.NODE_ENV = "production";
      delete process.env.NEXT_PHASE;
      expect(() => getOwnerEmail()).toThrow(
        "Missing OWNER_EMAIL environment variable. This is required in production."
      );
    });

    it("should normalize owner email", () => {
      process.env.OWNER_EMAIL = "  OWNER@EXAMPLE.COM  ";
      process.env.NODE_ENV = "test";
      const email = getOwnerEmail();
      expect(email).toBe("owner@example.com");
    });
  });

  describe("isOwnerEmail", () => {
    it("should return true for matching owner email", () => {
      process.env.OWNER_EMAIL = "owner@example.com";
      process.env.NODE_ENV = "test";
      const result = isOwnerEmail("owner@example.com");
      expect(result).toBe(true);
    });

    it("should return true for owner email with different case", () => {
      process.env.OWNER_EMAIL = "owner@example.com";
      process.env.NODE_ENV = "test";
      const result = isOwnerEmail("OWNER@EXAMPLE.COM");
      expect(result).toBe(true);
    });

    it("should return true for owner email with whitespace", () => {
      process.env.OWNER_EMAIL = "owner@example.com";
      process.env.NODE_ENV = "test";
      const result = isOwnerEmail("  owner@example.com  ");
      expect(result).toBe(true);
    });

    it("should return false for non-matching email", () => {
      process.env.OWNER_EMAIL = "owner@example.com";
      process.env.NODE_ENV = "test";
      const result = isOwnerEmail("other@example.com");
      expect(result).toBe(false);
    });

    it("should return false when email is null", () => {
      process.env.OWNER_EMAIL = "owner@example.com";
      process.env.NODE_ENV = "test";
      const result = isOwnerEmail(null);
      expect(result).toBe(false);
    });

    it("should return false when email is undefined", () => {
      process.env.OWNER_EMAIL = "owner@example.com";
      process.env.NODE_ENV = "test";
      expect(isOwnerEmail()).toBe(false);
    });

    it("should handle empty OWNER_EMAIL", () => {
      process.env.OWNER_EMAIL = "";
      process.env.NODE_ENV = "test";
      const result = isOwnerEmail("");
      expect(result).toBe(true);
    });
  });

  describe("getAdminCredentialsConfig", () => {
    it("should return admin config with all env vars set", () => {
      process.env.ADMIN_USERNAME = "admin";
      process.env.ADMIN_PASSWORD = "password123";
      process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
      process.env.ADMIN_DISPLAY_NAME = "Admin User";
      process.env.NODE_ENV = "test";

      const config = getAdminCredentialsConfig();

      expect(config.username).toBe("admin");
      expect(config.password).toBe("password123");
      expect(config.loginEmail).toBe("admin@example.com");
      expect(config.displayName).toBe("Admin User");
    });

    it("should use default display name when not set", () => {
      process.env.ADMIN_USERNAME = "admin";
      process.env.ADMIN_PASSWORD = "password123";
      process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
      delete process.env.ADMIN_DISPLAY_NAME;
      process.env.NODE_ENV = "test";

      const config = getAdminCredentialsConfig();

      expect(config.displayName).toBe("Admin Account");
    });

    it("should trim username", () => {
      process.env.ADMIN_USERNAME = "  admin  ";
      process.env.ADMIN_PASSWORD = "password";
      process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
      process.env.NODE_ENV = "test";

      const config = getAdminCredentialsConfig();

      expect(config.username).toBe("admin");
    });

    it("should trim display name", () => {
      process.env.ADMIN_USERNAME = "admin";
      process.env.ADMIN_PASSWORD = "password";
      process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
      process.env.ADMIN_DISPLAY_NAME = "  Custom Admin  ";
      process.env.NODE_ENV = "test";

      const config = getAdminCredentialsConfig();

      expect(config.displayName).toBe("Custom Admin");
    });

    it("should normalize admin login email", () => {
      process.env.ADMIN_USERNAME = "admin";
      process.env.ADMIN_PASSWORD = "password";
      process.env.ADMIN_LOGIN_EMAIL = "  ADMIN@EXAMPLE.COM  ";
      process.env.NODE_ENV = "test";

      const config = getAdminCredentialsConfig();

      expect(config.loginEmail).toBe("admin@example.com");
    });

    it("should return empty password when not set", () => {
      process.env.ADMIN_USERNAME = "admin";
      delete process.env.ADMIN_PASSWORD;
      process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
      process.env.NODE_ENV = "test";

      const config = getAdminCredentialsConfig();

      expect(config.password).toBe("");
    });

    it("should return empty username when not set in test env", () => {
      delete process.env.ADMIN_USERNAME;
      process.env.ADMIN_PASSWORD = "password";
      process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
      process.env.NODE_ENV = "test";

      const config = getAdminCredentialsConfig();

      expect(config.username).toBe("");
    });

    it("should throw error when ADMIN_USERNAME missing in production", () => {
      delete process.env.ADMIN_USERNAME;
      process.env.ADMIN_PASSWORD = "password";
      process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
      process.env.NODE_ENV = "production";

      expect(() => getAdminCredentialsConfig()).toThrow(
        "Missing ADMIN_USERNAME environment variable."
      );
    });

    it("should throw error when ADMIN_PASSWORD missing in production", () => {
      process.env.ADMIN_USERNAME = "admin";
      delete process.env.ADMIN_PASSWORD;
      process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
      process.env.NODE_ENV = "production";

      expect(() => getAdminCredentialsConfig()).toThrow(
        "Missing ADMIN_PASSWORD environment variable."
      );
    });

    it("should throw error when ADMIN_LOGIN_EMAIL missing in production", () => {
      process.env.ADMIN_USERNAME = "admin";
      process.env.ADMIN_PASSWORD = "password";
      delete process.env.ADMIN_LOGIN_EMAIL;
      process.env.NODE_ENV = "production";

      expect(() => getAdminCredentialsConfig()).toThrow(
        "Missing ADMIN_LOGIN_EMAIL environment variable."
      );
    });

    it("should handle empty username", () => {
      process.env.ADMIN_USERNAME = "";
      process.env.ADMIN_PASSWORD = "password";
      process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
      process.env.NODE_ENV = "test";

      const config = getAdminCredentialsConfig();

      expect(config.username).toBe("");
    });

    it("should handle whitespace in all fields", () => {
      process.env.ADMIN_USERNAME = "  admin  ";
      process.env.ADMIN_PASSWORD = "  pass  ";
      process.env.ADMIN_LOGIN_EMAIL = "  Admin@Example.COM  ";
      process.env.ADMIN_DISPLAY_NAME = "  Admin User  ";
      process.env.NODE_ENV = "test";

      const config = getAdminCredentialsConfig();

      expect(config.username).toBe("admin");
      expect(config.password).toBe("  pass  ");
      expect(config.loginEmail).toBe("admin@example.com");
      expect(config.displayName).toBe("Admin User");
    });
  });
});
