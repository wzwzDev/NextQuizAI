import { GET } from "@/app/api/(admin)/quiz-statistics/route";
import { getAuthSession } from "@/server/core/auth";
import * as adminService from "@/server/admin/services/adminQuizService";

jest.mock("@/server/core/auth");
jest.mock("@/server/admin/services/adminQuizService");

describe("/api/(admin)/quiz-statistics Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    (getAuthSession as jest.Mock).mockResolvedValue(null);
    
    const req = new Request("http://localhost/api/(admin)/quiz-statistics", {
      method: "GET",
    });
    const res = await GET(req);
    
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 when user is not admin", async () => {
    (getAuthSession as jest.Mock).mockResolvedValue({
      user: {
        id: "user-123",
        email: "user@example.com",
        isAdmin: false,
      },
    });
    
    const req = new Request("http://localhost/api/(admin)/quiz-statistics", {
      method: "GET",
    });
    const res = await GET(req);
    
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 200 with statistics when user is admin", async () => {
    (getAuthSession as jest.Mock).mockResolvedValue({
      user: {
        id: "admin-123",
        email: "admin@example.com",
        isAdmin: true,
      },
    });
    
    const mockStats = {
      totalQuizzes: 10,
      totalAttempts: 100,
      averageScore: 75,
    };
    
    (adminService.getQuizStatisticsSummary as jest.Mock).mockResolvedValue(mockStats);
    
    const req = new Request("http://localhost/api/(admin)/quiz-statistics", {
      method: "GET",
    });
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockStats);
  });

  it("calls getQuizStatisticsSummary function", async () => {
    (getAuthSession as jest.Mock).mockResolvedValue({
      user: { id: "admin-123", isAdmin: true },
    });
    
    (adminService.getQuizStatisticsSummary as jest.Mock).mockResolvedValue({});
    
    const req = new Request("http://localhost/api/(admin)/quiz-statistics", {
      method: "GET",
    });
    await GET(req);
    
    expect(adminService.getQuizStatisticsSummary).toHaveBeenCalled();
  });
});
