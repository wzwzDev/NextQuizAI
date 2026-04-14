import { POST, GET } from "@/app/api/(admin)/users/[userId]/revoke/route";
import { prisma } from "@/server/core/db";
jest.setTimeout(30000);

describe("/api/users/[userId]/revoke Route Handler", () => {
  let adminUser: any;
  let normalUser: any;
  let targetUser: any;
  const unique = Date.now();
  const adminEmail = `admin-revoke-${unique}@example.com`;
  const userEmail = `user-revoke-${unique}@example.com`;
  const targetEmail = `target-revoke-${unique}@example.com`;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, userEmail, targetEmail] } },
    });
    adminUser = await prisma.user.create({
      data: { email: adminEmail, isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: userEmail, isAdmin: false },
    });
    targetUser = await prisma.user.create({
      data: { email: targetEmail, revoked: false },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, userEmail, targetEmail] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if not admin (POST)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/revoke", {
      method: "POST",
      headers: { "x-test-user-email": normalUser.email },
    });
    const res = await POST(req as any, {
      params: Promise.resolve({ userId: targetUser.id }),
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("revokes a user as admin (POST)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/revoke", {
      method: "POST",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await POST(req as any, {
      params: Promise.resolve({ userId: targetUser.id }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: targetUser.id } });
    expect(updated?.revoked).toBe(true);
  });

  it("returns revoked status for user (GET)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/revoke", { method: "GET" });
    const res = await GET(req as any, {
      params: Promise.resolve({ userId: targetUser.id }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.revoked).toBe("boolean");
  });

  it("returns 404 if user not found (GET)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/revoke", { method: "GET" });
    const res = await GET(req as any, {
      params: Promise.resolve({ userId: "nonexistentid" }),
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });
});