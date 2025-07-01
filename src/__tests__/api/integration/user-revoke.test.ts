import { POST, GET } from "@/app/api/users/[userId]/revoke/route";
import { prisma } from "@/lib/db";
jest.setTimeout(30000);
// Mock getServerSession and authOptions
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from "next-auth";
jest.mock("@/lib/nextauth", () => ({
  authOptions: {},
}));
import { authOptions } from "@/lib/nextauth";

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
    (getServerSession as jest.Mock).mockResolvedValue({ user: normalUser });
    const req = new Request("http://localhost/api/users/[userId]/revoke", { method: "POST" });
    // @ts-ignore
    const res = await POST(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("revokes a user as admin (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    const req = new Request("http://localhost/api/users/[userId]/revoke", { method: "POST" });
    // @ts-ignore
    const res = await POST(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: targetUser.id } });
    expect(updated?.revoked).toBe(true);
  });

  it("returns 500 if DB error (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    jest.spyOn(prisma.user, "update").mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost/api/users/[userId]/revoke", { method: "POST" });
    // @ts-ignore
    const res = await POST(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/failed to revoke user/i);
  });

  it("returns revoked status for user (GET)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/revoke", { method: "GET" });
    // @ts-ignore
    const res = await GET(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.revoked).toBe("boolean");
  });

  it("returns 404 if user not found (GET)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/revoke", { method: "GET" });
    // @ts-ignore
    const res = await GET(req, { params: { userId: "nonexistentid" } });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });

  it("returns 500 if DB error (GET)", async () => {
    jest.spyOn(prisma.user, "findUnique").mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost/api/users/[userId]/revoke", { method: "GET" });
    // @ts-ignore
    const res = await GET(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/failed to fetch user/i);
  });
});