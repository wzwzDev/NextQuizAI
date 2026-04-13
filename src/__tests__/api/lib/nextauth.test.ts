import { authOptions, getAuthSession } from "@/server/core/auth";
import { prisma } from "@/server/core/db";

jest.setTimeout(30000);

describe("nextauth", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "nextauth-banned@example.com",
            "nextauth-user@example.com",
          ],
        },
      },
    });

    await prisma.user.create({
      data: {
        email: "nextauth-banned@example.com",
        banned: true,
      },
    });

    await prisma.user.create({
      data: {
        email: "nextauth-user@example.com",
        banned: false,
        isAdmin: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "nextauth-banned@example.com",
            "nextauth-user@example.com",
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  it("authOptions has providers", () => {
    expect(authOptions.providers).toBeDefined();
  });

  it("getAuthSession resolves user from test header", async () => {
    const req = new Request("http://localhost", {
      headers: { "x-test-user-email": "nextauth-user@example.com" },
    });

    const session = await getAuthSession(req);
    expect(session?.user?.email).toBe("nextauth-user@example.com");
    expect(session?.user?.isAdmin).toBe(true);
  });

  describe("signIn callback", () => {
    it("returns false for banned user", async () => {
      const mockUser = { id: "1", email: "banned@example.com", emailVerified: null };
      const result = await authOptions.callbacks!.signIn!({
        user: { ...mockUser, email: "nextauth-banned@example.com" },
        account: null,
      });
      expect(result).toBe(false);
    });

    it("returns true for allowed user", async () => {
      const mockUser = { id: "2", email: "user@example.com", emailVerified: null };
      const result = await authOptions.callbacks!.signIn!({
        user: { ...mockUser, email: "nextauth-user@example.com" },
        account: null,
      });
      expect(result).toBe(true);
    });

    it("returns true if user not found", async () => {
      const mockUser = { id: "3", email: "notfound@example.com", emailVerified: null };
      const result = await authOptions.callbacks!.signIn!({ user: mockUser, account: null });
      expect(result).toBe(true);
    });
  });
});