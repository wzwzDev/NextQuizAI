import { POST } from "@/app/api/setAdmin/route";
import { getServerSession } from "next-auth";
import { setUserAdmin } from "@/server/services/userService";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/server/services/userService", () => ({
  setUserAdmin: jest.fn(),
}));

describe("/api/setAdmin Route Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const callPost = async (body: unknown) => {
    const req = new Request("http://localhost/api/setAdmin", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    return POST(req);
  };

  it("returns 401 for non-admin user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "u1", isAdmin: false },
    });

    const res = await callPost({ userId: "target-user" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when userId is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin", isAdmin: true },
    });

    const res = await callPost({});
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing userId");
  });

  it("returns 200 on success", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin", isAdmin: true },
    });
    (setUserAdmin as jest.Mock).mockResolvedValue({
      id: "target-user",
      isAdmin: true,
    });

    const res = await callPost({ userId: "target-user" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(setUserAdmin).toHaveBeenCalledWith("target-user", true);
  });

  it("returns 500 when service fails", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin", isAdmin: true },
    });
    (setUserAdmin as jest.Mock).mockRejectedValue(new Error("db error"));

    const res = await callPost({ userId: "target-user" });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to assign admin role.");
  });
});