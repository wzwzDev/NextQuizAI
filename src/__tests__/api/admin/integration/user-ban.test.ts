import { POST, GET } from "@/app/api/(admin)/users/[userId]/ban/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";
jest.setTimeout(30000);

describe("/api/users/[userId]/ban Route Handler", () => {
  let adminUser: User;
  let normalUser: User;
  let targetUser: User;
  let ownerUser: User;
  const previousOwnerEmail = process.env.OWNER_EMAIL;
  const ownerEmail = `userban-owner-${Date.now()}@example.com`;

 beforeAll(async () => {
  process.env.OWNER_EMAIL = ownerEmail;

  // Clean up users with these emails before creating them
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "adminban@example.com",
          "userban@example.com",
          "targetban@example.com",
          ownerEmail,
        ],
      },
    },
  });
  adminUser = await prisma.user.create({
    data: { email: "adminban@example.com", isAdmin: true },
  });
  normalUser = await prisma.user.create({
    data: { email: "userban@example.com", isAdmin: false },
  });
  targetUser = await prisma.user.create({
    data: { email: "targetban@example.com" },
  });

  ownerUser = await prisma.user.create({
    data: { email: ownerEmail, isAdmin: true },
  });
},30000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "adminban@example.com",
            "userban@example.com",
            "targetban@example.com",
            ownerEmail,
          ],
        },
      },
    });

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

  // POST tests
  it("returns 401 if not admin (POST)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/ban", {
      method: "POST",
      headers: { "x-test-user-email": normalUser.email },
    });
    const res = await POST(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: targetUser.id }),
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("bans a user as admin (POST)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/ban", {
      method: "POST",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await POST(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: targetUser.id }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: targetUser.id } });
    expect(updated?.banned).toBe(true);
  });

  it("returns 403 when trying to ban owner", async () => {
    const req = new Request("http://localhost/api/users/[userId]/ban", {
      method: "POST",
      headers: { "x-test-user-email": adminUser.email },
    });

    const res = await POST(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: ownerUser.id }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/owner account is protected/i);
  });

  // GET tests
  it("returns 401 if not admin (GET)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/ban", {
      method: "GET",
      headers: { "x-test-user-email": normalUser.email },
    });
    const res = await GET(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: targetUser.id }),
    });
    expect(res.status).toBe(401);
  });

  it("returns banned status for user (GET)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/ban", {
      method: "GET",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await GET(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: targetUser.id }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.banned).toBe("boolean");
  });

  it("returns 404 if user not found (GET)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/ban", {
      method: "GET",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await GET(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: "nonexistentid" }),
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });
});