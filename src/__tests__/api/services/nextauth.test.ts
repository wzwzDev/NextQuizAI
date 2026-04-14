import { authOptions, getAuthSession } from "@/server/core/auth";
import { prisma } from "@/server/core/db";
import { getAdminCredentialsConfig, getOwnerEmail } from "@/server/core/roles";

jest.setTimeout(30000);

describe("nextauth", () => {
  const previousOwnerEmail = process.env.OWNER_EMAIL;
  const previousAdminUsername = process.env.ADMIN_USERNAME;
  const previousAdminPassword = process.env.ADMIN_PASSWORD;
  const previousAdminLoginEmail = process.env.ADMIN_LOGIN_EMAIL;

  beforeAll(async () => {
    process.env.OWNER_EMAIL = "nextauth-owner@example.com";
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "admin";
    process.env.ADMIN_LOGIN_EMAIL = "nextauth-admin@example.com";

    const { loginEmail } = getAdminCredentialsConfig();

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "nextauth-banned@example.com",
            "nextauth-user@example.com",
            getOwnerEmail(),
            loginEmail,
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

    await prisma.user.create({
      data: {
        email: getOwnerEmail(),
        banned: false,
        isAdmin: true,
      },
    });
  });

  afterAll(async () => {
    const { loginEmail } = getAdminCredentialsConfig();

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "nextauth-banned@example.com",
            "nextauth-user@example.com",
            getOwnerEmail(),
            loginEmail,
          ],
        },
      },
    });

    if (typeof previousOwnerEmail === "string") {
      process.env.OWNER_EMAIL = previousOwnerEmail;
    } else {
      delete process.env.OWNER_EMAIL;
    }

    if (typeof previousAdminUsername === "string") {
      process.env.ADMIN_USERNAME = previousAdminUsername;
    } else {
      delete process.env.ADMIN_USERNAME;
    }

    if (typeof previousAdminPassword === "string") {
      process.env.ADMIN_PASSWORD = previousAdminPassword;
    } else {
      delete process.env.ADMIN_PASSWORD;
    }

    if (typeof previousAdminLoginEmail === "string") {
      process.env.ADMIN_LOGIN_EMAIL = previousAdminLoginEmail;
    } else {
      delete process.env.ADMIN_LOGIN_EMAIL;
    }

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
    expect(session?.user?.isOwner).toBe(false);
  });

  it("getAuthSession marks owner session", async () => {
    const req = new Request("http://localhost", {
      headers: { "x-test-user-email": getOwnerEmail() },
    });

    const session = await getAuthSession(req);
    expect(session?.user?.email).toBe(getOwnerEmail());
    expect(session?.user?.isOwner).toBe(true);
  });

  it("credentials provider rejects invalid credentials", async () => {
    const provider = authOptions.providers.find(
      (candidate) => candidate.id === "credentials",
    ) as
      | {
          authorize?: (
            credentials: Record<string, string>,
            req: Request,
          ) => Promise<unknown>;
          options?: {
            authorize?: (
              credentials: Record<string, string>,
              req: Request,
            ) => Promise<unknown>;
          };
        }
      | undefined;

    const authorize = provider?.options?.authorize ?? provider?.authorize;
    expect(typeof authorize).toBe("function");

    const result = await authorize!(
      { username: "wrong", password: "wrong" },
      new Request("http://localhost"),
    );

    expect(result).toBeNull();
  });

  it("credentials provider returns dedicated admin user", async () => {
    const provider = authOptions.providers.find(
      (candidate) => candidate.id === "credentials",
    ) as
      | {
          authorize?: (
            credentials: Record<string, string>,
            req: Request,
          ) => Promise<unknown>;
          options?: {
            authorize?: (
              credentials: Record<string, string>,
              req: Request,
            ) => Promise<unknown>;
          };
        }
      | undefined;

    const authorize = provider?.options?.authorize ?? provider?.authorize;
    expect(typeof authorize).toBe("function");

    const config = getAdminCredentialsConfig();
    const result = (await authorize!(
      { username: config.username, password: config.password },
      new Request("http://localhost"),
    )) as { email?: string } | null;

    expect(result?.email).toBe(config.loginEmail);

    const adminLoginUser = await prisma.user.findUnique({
      where: { email: config.loginEmail },
    });
    expect(adminLoginUser?.isAdmin).toBe(true);
    expect(adminLoginUser?.email).toBe(config.loginEmail);
    expect(adminLoginUser?.email).not.toBe(getOwnerEmail());
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