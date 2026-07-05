import { Account } from "@/domain/entities/Account";

describe("Account", () => {
  describe("constructor", () => {
    it("should create account with all properties", () => {
      const account = new Account(
        "acc1",
        "user1",
        "oauth",
        "google",
        "google_id_123",
        "refresh_token_value",
        "access_token_value",
        1234567890,
        "Bearer",
        "email profile",
        "id_token_value",
        "session_state_value"
      );

      expect(account.id).toBe("acc1");
      expect(account.userId).toBe("user1");
      expect(account.type).toBe("oauth");
      expect(account.provider).toBe("google");
      expect(account.providerAccountId).toBe("google_id_123");
      expect(account.refresh_token).toBe("refresh_token_value");
      expect(account.access_token).toBe("access_token_value");
      expect(account.expires_at).toBe(1234567890);
      expect(account.token_type).toBe("Bearer");
      expect(account.scope).toBe("email profile");
      expect(account.id_token).toBe("id_token_value");
      expect(account.session_state).toBe("session_state_value");
    });

    it("should create account with null optional fields", () => {
      const account = new Account(
        "acc1",
        "user1",
        "oauth",
        "github",
        "github_123",
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );

      expect(account.refresh_token).toBeNull();
      expect(account.access_token).toBeNull();
      expect(account.expires_at).toBeNull();
      expect(account.token_type).toBeNull();
      expect(account.scope).toBeNull();
      expect(account.id_token).toBeNull();
      expect(account.session_state).toBeNull();
    });
  });

  describe("fromPrisma", () => {
    it("should create Account from prisma data with all properties", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "google_id_123",
        refresh_token: "refresh_token_value",
        access_token: "access_token_value",
        expires_at: 1234567890,
        token_type: "Bearer",
        scope: "email profile",
        id_token: "id_token_value",
        session_state: "session_state_value",
      };

      const account = Account.fromPrisma(prismaData);

      expect(account).not.toBeNull();
      expect(account!.id).toBe("acc1");
      expect(account!.userId).toBe("user1");
      expect(account!.provider).toBe("google");
    });

    it("should return null for null input", () => {
      const result = Account.fromPrisma(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = Account.fromPrisma(undefined);
      expect(result).toBeNull();
    });

    it("should handle empty object with defaults", () => {
      const prismaData = {};
      const account = Account.fromPrisma(prismaData);

      expect(account).not.toBeNull();
      expect(account!.id).toBe("");
      expect(account!.userId).toBe("");
      expect(account!.type).toBe("");
      expect(account!.provider).toBe("");
      expect(account!.providerAccountId).toBe("");
    });

    it("should handle null refresh_token", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "gid",
        refresh_token: null,
      };

      const account = Account.fromPrisma(prismaData);
      expect(account!.refresh_token).toBeNull();
    });

    it("should handle null access_token", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "gid",
        access_token: null,
      };

      const account = Account.fromPrisma(prismaData);
      expect(account!.access_token).toBeNull();
    });

    it("should handle null expires_at", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "gid",
        expires_at: null,
      };

      const account = Account.fromPrisma(prismaData);
      expect(account!.expires_at).toBeNull();
    });

    it("should handle null token_type", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "gid",
        token_type: null,
      };

      const account = Account.fromPrisma(prismaData);
      expect(account!.token_type).toBeNull();
    });

    it("should handle null scope", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "gid",
        scope: null,
      };

      const account = Account.fromPrisma(prismaData);
      expect(account!.scope).toBeNull();
    });

    it("should handle null id_token", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "gid",
        id_token: null,
      };

      const account = Account.fromPrisma(prismaData);
      expect(account!.id_token).toBeNull();
    });

    it("should handle null session_state", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "gid",
        session_state: null,
      };

      const account = Account.fromPrisma(prismaData);
      expect(account!.session_state).toBeNull();
    });

    it("should convert numeric expires_at to number", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "gid",
        expires_at: 1234567890,
      };

      const account = Account.fromPrisma(prismaData);
      expect(account!.expires_at).toBe(1234567890);
      expect(typeof account!.expires_at).toBe("number");
    });

    it("should handle string expires_at and convert to number", () => {
      const prismaData = {
        id: "acc1",
        userId: "user1",
        type: "oauth",
        provider: "google",
        providerAccountId: "gid",
        expires_at: "1234567890",
      };

      const account = Account.fromPrisma(prismaData);
      expect(account!.expires_at).toBe(1234567890);
    });

    it("should handle GitHub provider account", () => {
      const prismaData = {
        id: "acc2",
        userId: "user2",
        type: "oauth",
        provider: "github",
        providerAccountId: "github_456",
        access_token: "github_access_token",
        token_type: "bearer",
      };

      const account = Account.fromPrisma(prismaData);

      expect(account!.provider).toBe("github");
      expect(account!.providerAccountId).toBe("github_456");
      expect(account!.access_token).toBe("github_access_token");
    });

    it("should handle credentials type account", () => {
      const prismaData = {
        id: "acc3",
        userId: "user3",
        type: "credentials",
        provider: "credentials",
        providerAccountId: "user3",
        refresh_token: null,
        access_token: null,
      };

      const account = Account.fromPrisma(prismaData);

      expect(account!.type).toBe("credentials");
      expect(account!.provider).toBe("credentials");
    });

    it("should handle all null token fields with valid account fields", () => {
      const prismaData = {
        id: "acc4",
        userId: "user4",
        type: "oauth",
        provider: "google",
        providerAccountId: "google_789",
        refresh_token: null,
        access_token: null,
        expires_at: null,
        token_type: null,
        scope: null,
        id_token: null,
        session_state: null,
      };

      const account = Account.fromPrisma(prismaData);

      expect(account).not.toBeNull();
      expect(account!.id).toBe("acc4");
      expect(account!.refresh_token).toBeNull();
      expect(account!.access_token).toBeNull();
      expect(account!.session_state).toBeNull();
    });

    it("should handle empty string values", () => {
      const prismaData = {
        id: "acc5",
        userId: "user5",
        type: "",
        provider: "",
        providerAccountId: "",
        refresh_token: "",
        access_token: "",
        token_type: "",
      };

      const account = Account.fromPrisma(prismaData);

      expect(account!.type).toBe("");
      expect(account!.provider).toBe("");
      // Empty strings should NOT be treated as null
      expect(account!.refresh_token).toBeNull();
    });

    it("should handle complex scope with multiple permissions", () => {
      const prismaData = {
        id: "acc6",
        userId: "user6",
        type: "oauth",
        provider: "google",
        providerAccountId: "google_scope_test",
        scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
      };

      const account = Account.fromPrisma(prismaData);

      expect(account!.scope).toContain("userinfo.email");
      expect(account!.scope).toContain("userinfo.profile");
    });
  });
});
