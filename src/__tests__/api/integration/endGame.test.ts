import { POST } from "@/app/api/endGame/route";
import { endGame } from "@/lib/services/gameService";

jest.mock("@/lib/services/gameService", () => ({
  endGame: jest.fn(),
}));

describe("/api/endGame Route Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const callPost = async (body: unknown) => {
    const req = new Request("http://localhost/api/endGame", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    return POST(req);
  };

  it("returns 200 when game is ended", async () => {
    (endGame as jest.Mock).mockResolvedValue({
      status: 200,
      body: { message: "Game ended" },
    });

    const res = await callPost({ gameId: "game-1" });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Game ended");
    expect(endGame).toHaveBeenCalledWith("game-1");
  });

  it("returns 404 when game does not exist", async () => {
    (endGame as jest.Mock).mockResolvedValue({
      status: 404,
      body: { message: "Game not found" },
    });

    const res = await callPost({ gameId: "missing" });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.message).toBe("Game not found");
  });

  it("returns 500 when payload is invalid", async () => {
    const res = await callPost({});
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.message).toBe("Something went wrong");
  });

  it("returns 500 when service throws", async () => {
    (endGame as jest.Mock).mockRejectedValue(new Error("boom"));

    const res = await callPost({ gameId: "game-1" });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.message).toBe("Something went wrong");
  });
});