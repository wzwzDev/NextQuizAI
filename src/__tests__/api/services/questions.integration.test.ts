import { POST } from "@/app/api/questions/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(45000);

describe("/api/questions Route Handler", () => {
  let user: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: "questions-user@example.com" } });
    user = await prisma.user.create({
      data: { email: "questions-user@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  const callHandler = async (body: object, email?: string) => {
    const req = new Request("http://localhost/api/questions", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    return await POST(req);
  };

  it("returns 401 when unauthenticated", async () => {
    const res = await callHandler({ amount: 1, topic: "AI", type: "open_ended" });
    expect(res.status).toBe(401);
  });

  it("handles valid request with real dependency behavior", async () => {
    const res = await callHandler(
      { amount: 1, topic: "AI", type: "open_ended" },
      user.email,
    );
    const json = await res.json();

    if (process.env.OPENAI_API_KEY) {
      expect(res.status).toBe(200);
      expect(Array.isArray(json.questions)).toBe(true);
      expect(json.questions[0].question).toBeDefined();
      expect(json.questions[0].answer).toBeDefined();
      return;
    }

    expect(res.status).toBe(500);
    expect(json.error).toBe("An unexpected error occurred.");
  });

  it("returns 400 for invalid body (fails zod validation)", async () => {
    const res = await callHandler(
      { topic: "", type: "mcq", amount: 0 },
      user.email,
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(Array.isArray(json.error)).toBe(true);
  });

  it("returns 400 on invalid JSON", async () => {
    const badRequest = new Request("http://localhost/api/questions", {
      method: "POST",
      body: "not-json",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": user.email,
      },
    });
    const res = await POST(badRequest);
    expect(res?.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON");
  });
});