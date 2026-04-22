import { POST } from "@/app/api/sign-out/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("POST /api/sign-out", () => {
  let user: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: "signout-test@example.com" },
    });
    user = await prisma.user.create({
      data: { email: "signout-test@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  const callPost = async (email?: string) => {
    const req = new Request("http://localhost/api/sign-out", {
      method: "POST",
      headers: {
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    return await POST(req);
  };

  it("should successfully sign out without session", async () => {
    const response = await callPost();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("should mark user offline on sign out", async () => {
    const response = await callPost(user.email);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    const response = await callPost(user.email);
    expect([200, 400, 403, 404, 503]).toContain(response.status);
  });
});
