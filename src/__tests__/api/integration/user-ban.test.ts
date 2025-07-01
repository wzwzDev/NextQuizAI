import { POST, GET } from "@/app/api/users/[userId]/ban/route";
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

describe("/api/users/[userId]/ban Route Handler", () => {
  let adminUser: any;
  let normalUser: any;
  let targetUser: any;

 beforeAll(async () => {
  // Clean up users with these emails before creating them
  await prisma.user.deleteMany({
    where: { email: { in: ["adminban@example.com", "userban@example.com", "targetban@example.com"] } },
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
},30000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminban@example.com", "userban@example.com", "targetban@example.com"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST tests
  it("returns 401 if not admin (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: normalUser });
    const req = new Request("http://localhost/api/users/[userId]/ban", { method: "POST" });
    // @ts-ignore
    const res = await POST(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("bans a user as admin (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    const req = new Request("http://localhost/api/users/[userId]/ban", { method: "POST" });
    // @ts-ignore
    const res = await POST(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: targetUser.id } });
    expect(updated?.banned).toBe(true);
  });

  it("returns 500 if DB error (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    jest.spyOn(prisma.user, "update").mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost/api/users/[userId]/ban", { method: "POST" });
    // @ts-ignore
    const res = await POST(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/failed to ban user/i);
  });

  // GET tests
  it("returns banned status for user (GET)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/ban", { method: "GET" });
    // @ts-ignore
    const res = await GET(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.banned).toBe("boolean");
  });

  it("returns 404 if user not found (GET)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/ban", { method: "GET" });
    // @ts-ignore
    const res = await GET(req, { params: { userId: "nonexistentid" } });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });

  it("returns 500 if DB error (GET)", async () => {
    jest.spyOn(prisma.user, "findUnique").mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost/api/users/[userId]/ban", { method: "GET" });
    // @ts-ignore
    const res = await GET(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/failed to fetch user/i);
  });
});