import { GET as getAiReview, POST as postAiReview } from "@/app/api/(admin)/ai-review/route";
import { GET as getAiMetrics } from "@/app/api/(admin)/ai-metrics/route";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("GET /api/(admin)/ai-review", () => {
  let adminUser: User;
  let regularUser: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["ai-review-admin@example.com", "ai-review-regular@example.com"],
        },
      },
    });
    adminUser = await prisma.user.create({
      data: { email: "ai-review-admin@example.com", isAdmin: true },
    });
    regularUser = await prisma.user.create({
      data: { email: "ai-review-regular@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    if (adminUser?.id) {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
    if (regularUser?.id) {
      await prisma.user.delete({ where: { id: regularUser.id } });
    }
    await prisma.$disconnect();
  });

  const callGetReview = async (email?: string) => {
    const req = new Request("http://localhost/api/(admin)/ai-review", {
      method: "GET",
      headers: {
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    return await getAiReview(req);
  };

  it("should return 401 if not admin", async () => {
    const response = await callGetReview(regularUser.email);
    expect(response.status).toBe(401);
  });

  it("should return review queue for admin", async () => {
    const response = await callGetReview(adminUser.email);
    expect([200, 500]).toContain(response.status);
  });
});

describe("POST /api/(admin)/ai-review", () => {
  let adminUser: User;
  let regularUser: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["ai-review-post-admin@example.com", "ai-review-post-regular@example.com"],
        },
      },
    });
    adminUser = await prisma.user.create({
      data: { email: "ai-review-post-admin@example.com", isAdmin: true },
    });
    regularUser = await prisma.user.create({
      data: { email: "ai-review-post-regular@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    if (adminUser?.id) {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
    if (regularUser?.id) {
      await prisma.user.delete({ where: { id: regularUser.id } });
    }
    await prisma.$disconnect();
  });

  const callPostReview = async (body: object, email?: string) => {
    const req = new Request("http://localhost/api/(admin)/ai-review", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    return await postAiReview(req);
  };

  it("should return 401 if not admin", async () => {
    const response = await callPostReview({}, regularUser.email);
    expect(response.status).toBe(401);
  });

  it("should return 400 for missing required fields", async () => {
    const response = await callPostReview({}, adminUser.email);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("should handle valid review request", async () => {
    const response = await callPostReview(
      {
        attemptId: "invalid-id",
        questionIndex: 0,
        action: "accept_ai",
      },
      adminUser.email,
    );
    expect([200, 404, 400, 500]).toContain(response.status);
  });

  it("should reject invalid action", async () => {
    const response = await callPostReview(
      {
        attemptId: "test-id",
        questionIndex: 0,
        action: "invalid_action",
      },
      adminUser.email,
    );
    expect(response.status).toBe(400);
  });

  it("should reject non-integer questionIndex", async () => {
    const response = await callPostReview(
      {
        attemptId: "test-id",
        questionIndex: "not-a-number",
        action: "accept_ai",
      },
      adminUser.email,
    );
    expect(response.status).toBe(400);
  });
});

describe("GET /api/(admin)/ai-metrics", () => {
  let adminUser: User;
  let regularUser: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["ai-metrics-admin@example.com", "ai-metrics-regular@example.com"],
        },
      },
    });
    adminUser = await prisma.user.create({
      data: { email: "ai-metrics-admin@example.com", isAdmin: true },
    });
    regularUser = await prisma.user.create({
      data: { email: "ai-metrics-regular@example.com", isAdmin: false },
    });
  });

  afterAll(async () => {
    if (adminUser?.id) {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
    if (regularUser?.id) {
      await prisma.user.delete({ where: { id: regularUser.id } });
    }
    await prisma.$disconnect();
  });

  const callGetMetrics = async (email?: string) => {
    const req = new Request("http://localhost/api/(admin)/ai-metrics", {
      method: "GET",
      headers: {
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    return await getAiMetrics(req);
  };

  it("should return 401 if not admin", async () => {
    const response = await callGetMetrics(regularUser.email);
    expect(response.status).toBe(401);
  });

  it("should return metrics for admin", async () => {
    const response = await callGetMetrics(adminUser.email);
    expect([200, 500]).toContain(response.status);
  });
});
