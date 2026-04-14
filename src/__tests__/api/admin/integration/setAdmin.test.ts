import { POST } from "@/app/api/setAdmin/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("/api/setAdmin Route Handler", () => {
  let adminUser: User;
  let normalUser: User;
  let targetUser: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "setadmin-admin@example.com",
            "setadmin-user@example.com",
            "setadmin-target@example.com",
          ],
        },
      },
    });

    adminUser = await prisma.user.create({
      data: { email: "setadmin-admin@example.com", isAdmin: true },
    });
    normalUser = await prisma.user.create({
      data: { email: "setadmin-user@example.com", isAdmin: false },
    });
    targetUser = await prisma.user.create({
      data: { email: "setadmin-target@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "setadmin-admin@example.com",
            "setadmin-user@example.com",
            "setadmin-target@example.com",
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  const callPost = async (body: unknown, email?: string) => {
    const req = new Request("http://localhost/api/setAdmin", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    return POST(req);
  };

  it("returns 401 for non-admin user", async () => {
    const res = await callPost({ userId: targetUser.id }, normalUser.email);
    expect(res.status).toBe(401);
  });

  it("returns 400 when userId is missing", async () => {
    const res = await callPost({}, adminUser.email);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing userId");
  });

  it("returns 200 on success", async () => {
    const res = await callPost({ userId: targetUser.id }, adminUser.email);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    const updated = await prisma.user.findUnique({ where: { id: targetUser.id } });
    expect(updated?.isAdmin).toBe(true);
  });

  it("returns 500 when target user does not exist", async () => {
    const res = await callPost({ userId: "missing-user-id" }, adminUser.email);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to assign admin role.");
  });
});