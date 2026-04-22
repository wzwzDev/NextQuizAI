import { POST as assignAdminPost } from "@/app/api/(admin)/users/[userId]/assign-admin/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("POST /api/(admin)/users/[userId]/assign-admin", () => {
  let adminUser: User;
  let targetUser: User;
  let regularUser: User;
  let owner: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "admin-assign@example.com",
            "target-assign@example.com",
            "regular-assign@example.com",
            "owner-assign@example.com",
          ],
        },
      },
    });
    owner = await prisma.user.create({
      data: {
        email: "owner-assign@example.com",
        isAdmin: true,
      },
    });
    adminUser = await prisma.user.create({
      data: { email: "admin-assign@example.com", isAdmin: true },
    });
    targetUser = await prisma.user.create({
      data: { email: "target-assign@example.com", isAdmin: false },
    });
    regularUser = await prisma.user.create({
      data: { email: "regular-assign@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    if (owner?.id) {
      await prisma.user.delete({ where: { id: owner.id } });
    }
    if (adminUser?.id) {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
    if (targetUser?.id) {
      await prisma.user.delete({ where: { id: targetUser.id } });
    }
    if (regularUser?.id) {
      await prisma.user.delete({ where: { id: regularUser.id } });
    }
    await prisma.$disconnect();
  });

  const callPost = async (userId: string, email?: string) => {
    const req = new Request(
      `http://localhost/api/(admin)/users/${userId}/assign-admin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(email ? { "x-test-user-email": email } : {}),
        },
      },
    );
    return await assignAdminPost(req, {
      params: Promise.resolve({ userId }),
    });
  };

  it("should return 401 if not admin", async () => {
    const response = await callPost(targetUser.id, regularUser.email);
    expect(response.status).toBe(401);
  });

  it("should return 400 if no userId provided", async () => {
    const req = new Request(
      "http://localhost/api/(admin)/users/undefined/assign-admin",
      {
        method: "POST",
        headers: { "x-test-user-email": adminUser.email },
      },
    );
    const response = await assignAdminPost(req, {
      params: Promise.resolve({ userId: "" }),
    });
    expect(response.status).toBe(400);
  });

  it("should assign admin role to target user", async () => {
    const response = await callPost(targetUser.id, adminUser.email);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    // Verify the user is now admin
    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUser.id },
    });
    expect(updatedUser?.isAdmin).toBe(true);
  });
});
