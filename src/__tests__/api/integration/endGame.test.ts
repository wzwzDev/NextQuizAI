import { POST } from "@/app/api/endGame/route";
import { prisma } from "@/server/core/db";
import type { Game, User } from "@prisma/client";

jest.setTimeout(30000);

describe("/api/endGame Route Handler", () => {
  let user: User;
  let game: Game;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: "endgameuser@example.com" } });
    user = await prisma.user.create({
      data: { email: "endgameuser@example.com" },
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
    await prisma.$disconnect();
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
    const res = await callPost({ gameId: game.id });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Game ended");

    const updatedGame = await prisma.game.findUnique({ where: { id: game.id } });
    expect(updatedGame?.timeEnded).toBeTruthy();
  });

  it("returns 404 when game does not exist", async () => {
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

  it("returns 500 when payload is not valid JSON", async () => {
    const req = new Request("http://localhost/api/endGame", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.message).toBe("Something went wrong");
  });
});