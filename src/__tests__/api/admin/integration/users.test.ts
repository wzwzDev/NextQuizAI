import { GET } from "@/app/api/(admin)/users/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("/api/users Route Handler", () => {
  let adminUser: User;
  let normalUser: User;

  beforeAll(async () => {
    // Use unique timestamps to avoid race conditions with other tests
    const timestamp = Date.now();
    const adminEmail = `admin-users-test-${timestamp}@example.com`;
    const normalEmail = `normal-users-test-${timestamp}@example.com`;
    
    // Clean up any existing test users with these emails
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, normalEmail] } },
    });
    
    adminUser = await prisma.user.create({
      data: { email: adminEmail, isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: normalEmail, isAdmin: false },
    });
  });

  afterAll(async () => {
    if (adminUser?.email && normalUser?.email) {
      await prisma.user.deleteMany({
        where: { email: { in: [adminUser.email, normalUser.email] } },
      });
    }
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
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it("returns all users for admin", async () => {
    // Get admin user to search for
    const adminUserData = await prisma.user.findUnique({
      where: { email: adminUser.email },
    });
    expect(adminUserData).not.toBeNull();

    // Fetch all users (increased limit to ensure we get test users)
    const req = new Request("http://localhost/api/users?limit=5000", {
      method: "GET",
      headers: { "x-test-user-email": adminUser.email },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const payload = await res.json();
    const users = Array.isArray(payload) ? payload : payload?.users ?? [];
    expect(Array.isArray(users)).toBe(true);
    
    // Find our admin test user
    const foundAdminUser = users.find((u: User) => u.email === adminUser.email);
    expect(foundAdminUser).toBeDefined();
    expect(foundAdminUser).toHaveProperty("id");
    expect(foundAdminUser).toHaveProperty("email");
    expect(foundAdminUser).toHaveProperty("isAdmin");
    expect(foundAdminUser).toHaveProperty("banned");
    expect(foundAdminUser).toHaveProperty("revoked");
    expect(foundAdminUser).toHaveProperty("lastSeen");
    expect(foundAdminUser).toHaveProperty("name");
  });
});