import { DELETE } from "@/app/api/(admin)/users/[userId]/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";
import {
  cleanupUsersByEmail,
  createTestUser,
  uniqueEmail,
} from "../../../utils/prismaUsers";

jest.setTimeout(30000);

describe("/api/users/[userId] DELETE Route Handler", () => {
  let adminUser: User;
  let normalUser: User;
  let targetUser: User;
  let ownerUser: User;
  const unique = Date.now();
  const adminEmail = uniqueEmail(`admin-delete-${unique}`);
  const userEmail = uniqueEmail(`user-delete-${unique}`);
  const targetEmail = uniqueEmail(`target-delete-${unique}`);
  const ownerEmail = uniqueEmail(`owner-delete-${unique}`);
  const previousOwnerEmail = process.env.OWNER_EMAIL;

  beforeAll(async () => {
    process.env.OWNER_EMAIL = ownerEmail;

    await cleanupUsersByEmail(prisma, [adminEmail, userEmail, targetEmail, ownerEmail]);

    adminUser = await createTestUser(prisma, { email: adminEmail, isAdmin: true });
    normalUser = await createTestUser(prisma, { email: userEmail });
    targetUser = await createTestUser(prisma, { email: targetEmail });
    ownerUser = await createTestUser(prisma, { email: ownerEmail, isAdmin: true });
  });

  afterAll(async () => {
    await cleanupUsersByEmail(prisma, [adminEmail, userEmail, targetEmail, ownerEmail]);

    if (typeof previousOwnerEmail === "string") {
      process.env.OWNER_EMAIL = previousOwnerEmail;
    } else {
      delete process.env.OWNER_EMAIL;
    }

    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if not admin", async () => {
    const req = new Request("http://localhost/api/users/[userId]", {
      method: "DELETE",
      headers: { "x-test-user-email": normalUser.email },
    });

    const res = await DELETE(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: targetUser.id }),
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("deletes a target user as admin", async () => {
    const deletable = await createTestUser(prisma, {
      email: uniqueEmail("target-delete-now"),
    });

    const req = new Request("http://localhost/api/users/[userId]", {
      method: "DELETE",
      headers: { "x-test-user-email": adminUser.email },
    });

    const res = await DELETE(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: deletable.id }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const deleted = await prisma.user.findUnique({ where: { id: deletable.id } });
    expect(deleted).toBeNull();
  });

  it("returns 403 when trying to delete owner", async () => {
    const req = new Request("http://localhost/api/users/[userId]", {
      method: "DELETE",
      headers: { "x-test-user-email": adminUser.email },
    });

    const res = await DELETE(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: ownerUser.id }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/owner account is protected/i);
  });

  it("returns 400 when trying to delete self", async () => {
    const req = new Request("http://localhost/api/users/[userId]", {
      method: "DELETE",
      headers: { "x-test-user-email": adminUser.email },
    });

    const res = await DELETE(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: adminUser.id }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/cannot delete your own account/i);
  });
});
