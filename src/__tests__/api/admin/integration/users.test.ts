import { GET } from "@/app/api/(admin)/users/route";
import { prisma } from "@/server/core/db";
jest.setTimeout(30000);

describe("/api/users Route Handler", () => {
  let adminUser: any;
  let normalUser: any;

  beforeAll(async () => {
    // Clean up users with these emails before creating them
    await prisma.user.deleteMany({
      where: { email: { in: ["adminusers@example.com", "userusers@example.com"] } },
    });
    adminUser = await prisma.user.create({
      data: { email: "adminusers@example.com", isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: "userusers@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["adminusers@example.com", "userusers@example.com"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if not admin", async () => {
    const req = new Request("http://localhost/api/users", {
      method: "GET",
      headers: { "x-test-user-email": normalUser.email },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("returns all users for admin", async () => {
    const req = new Request("http://localhost/api/users", {
      method: "GET",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const users = await res.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.some((u: any) => u.email === "adminusers@example.com")).toBe(true);
    expect(users.some((u: any) => u.email === "userusers@example.com")).toBe(true);
    // Check selected fields
    const user = users.find((u: any) => u.email === "adminusers@example.com");
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("isAdmin");
    expect(user).toHaveProperty("banned");
    expect(user).toHaveProperty("revoked");
    expect(user).toHaveProperty("lastSeen");
    expect(user).toHaveProperty("name");
  });
});