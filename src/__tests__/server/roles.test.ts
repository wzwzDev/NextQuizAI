import {
  getOwnerEmail,
  isOwnerEmail,
  getAdminCredentialsConfig,
} from "@/server/core/roles";

describe("Roles - Email and Credentials Management", () => {
  describe("normalizeEmail", () => {
    it("should handle owner email normalization", () => {
      process.env.OWNER_EMAIL = "  OWNER@EXAMPLE.COM  ";
      const ownerEmail = getOwnerEmail();
      expect(ownerEmail).toBe("owner@example.com");
    });
  });

  describe("getOwnerEmail", () => {
    it("should return normalized owner email", () => {
      process.env.OWNER_EMAIL = "Admin@Test.Com";
      
      const result = getOwnerEmail();
      expect(result).toBe("admin@test.com");
    });
  });

  describe("isOwnerEmail", () => {
    it("should return true for owner email match", () => {
      // @ts-ignore
      process.env.NODE_ENV = "test";
      process.env.OWNER_EMAIL = "owner@example.com";
      
      expect(isOwnerEmail("OWNER@EXAMPLE.COM")).toBe(true);
    });

    it("should return false for non-owner email", () => {
      // @ts-ignore
      process.env.NODE_ENV = "test";
      process.env.OWNER_EMAIL = "owner@example.com";
      
      expect(isOwnerEmail("user@example.com")).toBe(false);
    });

    it("should handle null/undefined email gracefully", () => {
      // @ts-ignore
      process.env.NODE_ENV = "test";
      process.env.OWNER_EMAIL = "owner@example.com";
      
      expect(isOwnerEmail(null)).toBe(false);
      expect(isOwnerEmail()).toBe(false);
    });

    it("should be case-insensitive", () => {
      // @ts-ignore
      process.env.NODE_ENV = "test";
      process.env.OWNER_EMAIL = "Owner@Example.COM";
      
      expect(isOwnerEmail("OWNER@EXAMPLE.COM")).toBe(true);
      expect(isOwnerEmail("owner@example.com")).toBe(true);
    });

    it("should trim whitespace", () => {
      // @ts-ignore
      process.env.NODE_ENV = "test";
      process.env.OWNER_EMAIL = "  owner@example.com  ";
      
      expect(isOwnerEmail("  OWNER@EXAMPLE.COM  ")).toBe(true);
    });
  });

  describe("getAdminCredentialsConfig", () => {
    it("should return config with values from environment", () => {
      process.env.ADMIN_USERNAME = "testadmin";
      process.env.ADMIN_PASSWORD = "testpass";
      process.env.ADMIN_LOGIN_EMAIL = "  ADMIN@TEST.COM  ";
      process.env.ADMIN_DISPLAY_NAME = "  Test Admin  ";
      
      const config = getAdminCredentialsConfig();
      expect(config.username).toBe("testadmin");
      expect(config.password).toBe("testpass");
      expect(config.loginEmail).toBe("admin@test.com");
      expect(config.displayName).toBe("Test Admin");
    });

    it("should use default display name when not set", () => {
      process.env.ADMIN_USERNAME = "admin";
      process.env.ADMIN_PASSWORD = "pass";
      process.env.ADMIN_LOGIN_EMAIL = "admin@test.com";
      delete process.env.ADMIN_DISPLAY_NAME;
      
      const config = getAdminCredentialsConfig();
      expect(config.displayName).toBe("Admin Account");
    });

    it("should return empty values when not set in non-production", () => {
      delete process.env.ADMIN_USERNAME;
      delete process.env.ADMIN_PASSWORD;
      delete process.env.ADMIN_LOGIN_EMAIL;
      delete process.env.ADMIN_DISPLAY_NAME;
      
      const config = getAdminCredentialsConfig();
      expect(config.username).toBe("");
      expect(config.password).toBe("");
      expect(config.loginEmail).toBe("");
    });
  });
});

