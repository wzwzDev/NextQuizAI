import { POST } from "@/app/api/endGame/route";
import { prisma } from "@/server/core/db";
import type { Game, User } from "@prisma/client";

jest.setTimeout(30000);

describe("/api/endGame Route Handler", () => {
  let user: User;
  let otherUser: User;
  let game: Game;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ["endgameuser@example.com", "endgameuser2@example.com"] },
      },
    });
    user = await prisma.user.create({
      data: { email: "endgameuser@example.com" },
    });
    otherUser = await prisma.user.create({
      data: { email: "endgameuser2@example.com" },
    });

    game = await prisma.game.create({
      data: {
        userId: user.id,
        topic: "General",
        gameType: "mcq",
        timeStarted: new Date(),
      },
    });
  });

  afterAll(async () => {
    if (game?.id) {
      await prisma.question.deleteMany({ where: { gameId: game.id } });
      await prisma.game.deleteMany({ where: { id: game.id } });
    }
    if (user?.id) {
      await prisma.user.deleteMany({ where: { id: user.id } });
    }
    if (otherUser?.id) {
      await prisma.user.deleteMany({ where: { id: otherUser.id } });
    }
    await prisma.$disconnect();
  });

  const callPost = async (body: unknown, email?: string) => {
    const req = new Request("http://localhost/api/endGame", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });

    return POST(req);
  };

  it("returns 401 when unauthenticated", async () => {
    const res = await callPost({ gameId: game.id });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toBe("Unauthorized");
  });

  it("returns 403 when authenticated user does not own the game", async () => {
    const res = await callPost({ gameId: game.id }, otherUser.email);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.message).toBe("Forbidden");
  });

  it("returns 200 when game is ended", async () => {
    const res = await callPost({ gameId: game.id }, user.email);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Game ended");

    const updatedGame = await prisma.game.findUnique({ where: { id: game.id } });
    expect(updatedGame?.timeEnded).toBeTruthy();
  });

  it("returns 404 when game does not exist", async () => {
    const res = await callPost({ gameId: "missing" }, user.email);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.message).toBe("Game not found");
  });

  it("returns 400 when payload is invalid", async () => {
    const res = await callPost({}, user.email);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(Array.isArray(json.message)).toBe(true);
  });

  it("returns 400 when payload is not valid JSON", async () => {
    const req = new Request("http://localhost/api/endGame", {
      method: "POST",
      body: "not-json",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-email": user.email,
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toBe("Invalid JSON");
  });
});