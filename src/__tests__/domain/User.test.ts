import { User } from "@/domain/entities/User";

describe("User", () => {
  describe("constructor", () => {
    it("should create user with all properties", () => {
      const emailVerified = new Date("2024-01-15");
      const lastSeen = new Date("2024-01-20");

      const user = new User(
        "user1",
        "John Doe",
        "john@example.com",
        "hashedpass123",
        emailVerified,
        "https://example.com/image.jpg",
        false,
        false,
        true,
        false,
        lastSeen
      );

      expect(user.id).toBe("user1");
      expect(user.name).toBe("John Doe");
      expect(user.email).toBe("john@example.com");
      expect(user.passwordHash).toBe("hashedpass123");
      expect(user.emailVerified).toEqual(emailVerified);
      expect(user.image).toBe("https://example.com/image.jpg");
      expect(user.banned).toBe(false);
      expect(user.revoked).toBe(false);
      expect(user.isOnline).toBe(true);
      expect(user.isAdmin).toBe(false);
      expect(user.lastSeen).toEqual(lastSeen);
    });

    it("should handle user with null optional properties", () => {
      const lastSeen = new Date();

      const user = new User(
        "user1",
        null,
        "user@example.com",
        null,
        null,
        null,
        false,
        false,
        false,
        false,
        lastSeen
      );

      expect(user.name).toBeNull();
      expect(user.passwordHash).toBeNull();
      expect(user.emailVerified).toBeNull();
      expect(user.image).toBeNull();
    });

    it("should create admin user", () => {
      const user = new User(
        "admin1",
        "Admin User",
        "admin@example.com",
        "hashedpass",
        new Date(),
        null,
        false,
        false,
        true,
        true,
        new Date()
      );

      expect(user.isAdmin).toBe(true);
    });

    it("should create banned user", () => {
      const user = new User(
        "user1",
        "Banned User",
        "banned@example.com",
        "hashedpass",
        null,
        null,
        true,
        false,
        false,
        false,
        new Date()
      );

      expect(user.banned).toBe(true);
    });

    it("should create revoked user", () => {
      const user = new User(
        "user1",
        "Revoked User",
        "revoked@example.com",
        null,
        null,
        null,
        false,
        true,
        false,
        false,
        new Date()
      );

      expect(user.revoked).toBe(true);
    });
  });

  describe("fromPrisma", () => {
    it("should create User from prisma data with all properties", () => {
      const prismaData = {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        passwordHash: "hashedpass123",
        emailVerified: new Date("2024-01-15"),
        image: "https://example.com/image.jpg",
        banned: false,
        revoked: false,
        isOnline: true,
        isAdmin: false,
        lastSeen: new Date("2024-01-20"),
      };

      const user = User.fromPrisma(prismaData);

      expect(user).not.toBeNull();
      expect(user!.id).toBe("user1");
      expect(user!.name).toBe("John Doe");
      expect(user!.email).toBe("john@example.com");
      expect(user!.isAdmin).toBe(false);
    });

    it("should return null for null input", () => {
      const result = User.fromPrisma(null);
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      const result = User.fromPrisma(undefined);
      expect(result).toBeNull();
    });

    it("should handle missing properties with defaults", () => {
      const prismaData = {};
      const user = User.fromPrisma(prismaData);

      expect(user).not.toBeNull();
      expect(user!.id).toBe("");
      expect(user!.email).toBe("");
      expect(user!.name).toBeNull();
      expect(user!.passwordHash).toBeNull();
      expect(user!.banned).toBe(false);
      expect(user!.isAdmin).toBe(false);
    });

    it("should handle null name", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        name: null,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.name).toBeNull();
    });

    it("should handle null passwordHash", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        passwordHash: null,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.passwordHash).toBeNull();
    });

    it("should handle null emailVerified", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        emailVerified: null,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.emailVerified).toBeNull();
    });

    it("should handle null image", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        image: null,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.image).toBeNull();
    });

    it("should handle undefined lastSeen with default Date", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.lastSeen).toBeInstanceOf(Date);
    });

    it("should handle admin user from prisma", () => {
      const prismaData = {
        id: "admin1",
        email: "admin@example.com",
        isAdmin: true,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.isAdmin).toBe(true);
    });

    it("should handle banned user from prisma", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        banned: true,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.banned).toBe(true);
    });

    it("should handle revoked user from prisma", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        revoked: true,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.revoked).toBe(true);
    });

    it("should handle online user from prisma", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        isOnline: true,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.isOnline).toBe(true);
    });

    it("should convert string dates to Date objects", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        emailVerified: "2024-01-15T10:00:00Z",
        lastSeen: "2024-01-20T15:30:00Z",
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.emailVerified).toBeInstanceOf(Date);
      expect(user!.lastSeen).toBeInstanceOf(Date);
    });

    it("should handle multiple null properties", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        name: null,
        passwordHash: null,
        emailVerified: null,
        image: null,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.name).toBeNull();
      expect(user!.passwordHash).toBeNull();
      expect(user!.emailVerified).toBeNull();
      expect(user!.image).toBeNull();
    });

    it("should handle user with empty string name (should be null)", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        name: "",
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.name).toBeNull();
    });

    it("should handle admin banned and revoked user", () => {
      const prismaData = {
        id: "user1",
        email: "user@example.com",
        isAdmin: true,
        banned: true,
        revoked: true,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.isAdmin).toBe(true);
      expect(user!.banned).toBe(true);
      expect(user!.revoked).toBe(true);
    });

    it("should convert numeric ID to string", () => {
      const prismaData = {
        id: 12345,
        email: 67890,
      };

      const user = User.fromPrisma(prismaData);

      expect(user!.id).toBe("12345");
      expect(user!.email).toBe("67890");
    });
  });
});
