import { POST } from "@/app/api/sign-out/route";
import { prisma } from "@/lib/db";

// Mock getServerSession
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from "next-auth";

describe("/api/sign-out Route Handler", () => {
  let user: any;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: { email: "signoutuser@example.com", isOnline: true },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const callHandler = async (sessionUser: any = user) => {
    (getServerSession as jest.Mock).mockResolvedValue(sessionUser ? { user: sessionUser } : null);
    const req = new Request("http://localhost/api/sign-out", { method: "POST" });
    return await POST(req as any);
  };

  it("sets isOnline to false for signed-in user", async () => {
    const res = await callHandler(user);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.isOnline).toBe(false);
  });

  it("returns success even if no session", async () => {
    const res = await callHandler(null);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 404 if user not found (P2025)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "notfound@example.com" } });
    // Mock Prisma error
    jest.spyOn(prisma.user, "update").mockRejectedValue({ code: "P2025" });
    const req = new Request("http://localhost/api/sign-out", { method: "POST" });
    const res = await POST(req as any);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/no encontrado/i);
  });

  it("returns 503 if DB connection error (ECONNREFUSED)", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { email: user.email } });
    jest.spyOn(prisma.user, "update").mockRejectedValue({ code: "ECONNREFUSED" });
    const req = new Request("http://localhost/api/sign-out", { method: "POST" });
    const res = await POST(req as any);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/base de datos/i);
  });

  it("returns 500 for unexpected error", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { email: user.email } });
    jest.spyOn(prisma.user, "update").mockRejectedValue({ code: "OTHER", message: "fail" });
    const req = new Request("http://localhost/api/sign-out", { method: "POST" });
    const res = await POST(req as any);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/inesperado/i);
  });
});