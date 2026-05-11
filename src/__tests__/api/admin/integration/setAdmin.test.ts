import { POST } from "@/app/api/(admin)/setAdmin/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
import {
  cleanupUsersByEmail,
  createTestUser,
  uniqueEmail,
} from "../../../utils/prismaUsers";

jest.setTimeout(30000);

describe("/api/setAdmin Route Handler", () => {
  let adminUser: User;
  let normalUser: User;
  let targetUser: User;
  let ownerUser: User;
  const previousOwnerEmail = process.env.OWNER_EMAIL;
  const ownerEmail = uniqueEmail("setadmin-owner");
  const adminEmail = uniqueEmail("setadmin-admin");
  const userEmail = uniqueEmail("setadmin-user");
  const targetEmail = uniqueEmail("setadmin-target");

  beforeAll(async () => {
    process.env.OWNER_EMAIL = ownerEmail;
    await cleanupUsersByEmail(prisma, [adminEmail, userEmail, targetEmail, ownerEmail]);

    adminUser = await createTestUser(prisma, { email: adminEmail, isAdmin: true });
    normalUser = await createTestUser(prisma, { email: userEmail });
    targetUser = await createTestUser(prisma, { email: targetEmail });
    ownerUser = await createTestUser(prisma, { email: ownerEmail, isAdmin: true });
  });

  afterAll(async () => {
    await cleanupUsersByEmail(prisma, [adminEmail, userEmail, targetEmail, ownerEmail]);

    if (typeof previousOwnerEmail === "string") {
      process.env.OWNER_EMAIL = previousOwnerEmail;
    } else {
      delete process.env.OWNER_EMAIL;
    }

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

  it("returns 403 when trying to mutate owner account", async () => {
    const res = await callPost({ userId: ownerUser.id }, adminUser.email);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toMatch(/owner account is protected/i);
  });
});
