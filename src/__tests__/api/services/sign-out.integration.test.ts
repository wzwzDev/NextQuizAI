import { POST } from "@/app/api/sign-out/route";
import { prisma } from "@/server/core/db";
import { cleanupUsersByEmail, createTestUser, uniqueEmail } from "../../utils/prismaUsers";
jest.setTimeout(30000);

describe("/api/sign-out Route Handler", () => {
  let user: any;
  const userEmail = uniqueEmail("signoutuser");

  beforeAll(async () => {
    await cleanupUsersByEmail(prisma, [userEmail]);
    user = await createTestUser(prisma, { email: userEmail, isOnline: true });
  });

  afterAll(async () => {
    await cleanupUsersByEmail(prisma, [userEmail]);
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