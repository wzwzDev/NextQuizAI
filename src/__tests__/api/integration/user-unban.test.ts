import { POST } from "@/app/api/users/[userId]/unban/route";
import { prisma } from "@/lib/db";

// Mock getServerSession and authOptions
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from "next-auth";
jest.mock("@/lib/nextauth", () => ({
  authOptions: {},
}));
import { authOptions } from "@/lib/nextauth";

describe("/api/users/[userId]/unban Route Handler", () => {
  let adminUser: any;
  let normalUser: any;
  let targetUser: any;

  beforeAll(async () => {
    // Use unique emails for this test file and clean up before creating
    await prisma.user.deleteMany({
      where: { email: { in: ["adminunban@example.com", "userunban@example.com", "targetunban@example.com"] } },
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
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminunban@example.com", "userunban@example.com", "targetunban@example.com"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if not admin (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: normalUser });
    const req = new Request("http://localhost/api/users/[userId]/unban", { method: "POST" });
    // @ts-ignore
    const res = await POST(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("unbans a user as admin (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    const req = new Request("http://localhost/api/users/[userId]/unban", { method: "POST" });
    // @ts-ignore
    const res = await POST(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: targetUser.id } });
    expect(updated?.banned).toBe(false);
  });

  it("returns 500 if DB error (POST)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: adminUser });
    jest.spyOn(prisma.user, "update").mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost/api/users/[userId]/unban", { method: "POST" });
    // @ts-ignore
    const res = await POST(req, { params: { userId: targetUser.id } });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/failed to unban user/i);
  });
});