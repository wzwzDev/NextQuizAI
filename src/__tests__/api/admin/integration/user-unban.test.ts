import { POST } from "@/app/api/(admin)/users/[userId]/unban/route";
import { prisma } from "@/server/core/db";
jest.setTimeout(30000);

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
  },30000);

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
    const req = new Request("http://localhost/api/users/[userId]/unban", {
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

  it("unbans a user as admin (POST)", async () => {
    const req = new Request("http://localhost/api/users/[userId]/unban", {
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
    expect(updated?.banned).toBe(false);
  });
});