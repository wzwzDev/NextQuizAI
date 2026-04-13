import { POST } from "@/app/api/sign-out/route";
import { prisma } from "@/server/core/db";
jest.setTimeout(30000);

describe("/api/sign-out Route Handler", () => {
  let user: any;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: { email: "signoutuser@example.com", isOnline: true },
    });
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const callHandler = async (email?: string) => {
    const req = new Request("http://localhost/api/sign-out", {
      method: "POST",
      headers: email ? { "x-test-user-email": email } : undefined,
    });
    return await POST(req as any);
  };

  it("sets isOnline to false for signed-in user", async () => {
    const res = await callHandler(user.email);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.isOnline).toBe(false);
  });

  it("returns success even if no session", async () => {
    const res = await callHandler();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});