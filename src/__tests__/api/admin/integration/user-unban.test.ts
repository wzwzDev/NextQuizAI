import { POST } from "@/app/api/(admin)/users/[userId]/unban/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
import type { NextRequest } from "next/server";
jest.setTimeout(30000);

describe("/api/users/[userId]/unban Route Handler", () => {
  let adminUser: User;
  let normalUser: User;
  let targetUser: User;
  let ownerUser: User;
  const previousOwnerEmail = process.env.OWNER_EMAIL;
  const ownerEmail = `userunban-owner-${Date.now()}@example.com`;

  beforeAll(async () => {
    process.env.OWNER_EMAIL = ownerEmail;
    // Use unique emails for this test file and clean up before creating
    await prisma.user.deleteMany({
      where: { email: { in: ["adminunban@example.com", "userunban@example.com", "targetunban@example.com", ownerEmail] } },
    });
    adminUser = await prisma.user.create({
      data: { email: "adminunban@example.com", isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: "userunban@example.com", isAdmin: false },
    });
    targetUser = await prisma.user.create({
      data: { email: "targetunban@example.com", banned: true },
    });
    ownerUser = await prisma.user.create({
      data: { email: ownerEmail, isAdmin: true },
    });
  },30000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminunban@example.com", "userunban@example.com", "targetunban@example.com", ownerEmail] } },
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

  it("returns 401 if not admin (POST)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/unban", {
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

  it("unbans a user as admin (POST)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/unban", {
      method: "POST",
      headers: { "x-test-user-email": ownerUser.email },
    });
    const res = await POST(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: targetUser.id }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: targetUser.id } });
    expect(updated?.banned).toBe(false);
  });

  it("returns 403 when trying to unban owner", async () => {
    const req = new Request("http://localhost/api/users/[userId]/unban", {
      method: "POST",
      headers: { "x-test-user-email": ownerUser.email },
    });
    const res = await POST(req as unknown as NextRequest, {
      params: Promise.resolve({ userId: ownerUser.id }),
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/owner account is protected/i);
  });
});