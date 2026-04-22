import { getAuthSession } from "@/server/core/auth";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("getAuthSession", () => {
  let user: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: "auth-test@example.com" },
    });
    user = await prisma.user.create({
      data: { email: "auth-test@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  const createRequest = (email?: string, isAdmin: boolean = false) => {
    const headers = new Headers();
    if (email) {
      headers.set("x-test-user-email", email);
    }
    if (isAdmin) {
      headers.set("x-test-user-admin", "true");
    }
    return new Request("http://localhost", { headers });
  };

  it("should return null session if no email in request", async () => {
    const req = createRequest();
    const session = await getAuthSession(req);
    expect(session).toBeNull();
  });

  it("should return session with user info if email provided", async () => {
    const req = createRequest(user.email, false);
    const session = await getAuthSession(req);
    
    expect(session).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          email: user.email,
          id: user.id,
        }),
      }),
    );
  });

  it("should include admin flag when user is admin", async () => {
    const adminUser = await prisma.user.create({
      data: { email: "auth-admin@example.com", isAdmin: true },
    });

    try {
      const req = createRequest(adminUser.email, true);
      const session = await getAuthSession(req);
      
      expect(session?.user).toEqual(
        expect.objectContaining({
          isAdmin: true,
        }),
      );
    } finally {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
  });

  it("should return null for banned user", async () => {
    const bannedUser = await prisma.user.create({
      data: {
        email: "auth-banned@example.com",
        isAdmin: false,
        banned: true,
      },
    });

    try {
      const req = createRequest(bannedUser.email, false);
      const session = await getAuthSession(req);
      
      expect(session?.user?.banned).toBe(true);
    } finally {
      await prisma.user.delete({ where: { id: bannedUser.id } });
    }
  });

  it("should return session with revoked flag if user is revoked", async () => {
    const revokedUser = await prisma.user.create({
      data: {
        email: "auth-revoked@example.com",
        isAdmin: false,
        revoked: true,
      },
    });

    try {
      const req = createRequest(revokedUser.email, false);
      const session = await getAuthSession(req);
      
      expect(session?.user?.revoked).toBe(true);
    } finally {
      await prisma.user.delete({ where: { id: revokedUser.id } });
    }
  });
});
