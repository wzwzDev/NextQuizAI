import { POST, GET } from "@/app/api/game/route";
import { prisma } from "@/server/core/db";
import type { Game, User } from "@prisma/client";

jest.setTimeout(30000);

describe("/api/game Route Handler", () => {
  let user: User;
  let otherUser: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["testuser2@example.com", "testuser3@example.com"] } },
    });
    user = await prisma.user.create({
      data: { email: "testuser2@example.com", isAdmin: false },
    });
    otherUser = await prisma.user.create({
      data: { email: "testuser3@example.com", isAdmin: false },
    });
  });

  afterEach(async () => {
    await prisma.question.deleteMany({ where: { game: { userId: user.id } } });
    await prisma.game.deleteMany({ where: { userId: user.id } });
  });

  afterAll(async () => {
    if (user?.id) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    if (otherUser?.id) {
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
    await prisma.$disconnect();
  });

  const callPost = async (body: object, email?: string) => {
    const req = new Request("http://localhost/api/game", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(email ? { "x-test-user-email": email } : {}),
      },
    });
    return await POST(req);
  };

  const callGet = async (gameId?: string, email?: string) => {
    const url = `http://localhost/api/game${gameId ? `?gameId=${gameId}` : ""}`;
    const req = new Request(url, {
      method: "GET",
      headers: email ? { "x-test-user-email": email } : undefined,
    });
    return await GET(req);
  };

  // POST tests
  it("returns 401 if not authenticated (POST)", async () => {
    const res = await callPost({ topic: "math", type: "mcq", amount: 1 });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body (POST)", async () => {
    const res = await callPost({ topic: "", type: "mcq", amount: 0 }, user.email);
    expect(res.status).toBe(400);
  });

  it("returns 500 when questions upstream is unavailable (POST)", async () => {
    const previousApiUrl = process.env.API_URL;
    process.env.API_URL = "http://127.0.0.1:1";

    const res = await callPost(
      { topic: "math", type: "mcq", amount: 1 },
      user.email,
    );

    process.env.API_URL = previousApiUrl;
    expect(res.status).toBe(500);
  });

  // GET tests
  it("returns 401 if not authenticated (GET)", async () => {
    const res = await callGet("missing-id");
    expect(res.status).toBe(401);
  });

  it("returns 400 if gameId is missing (GET)", async () => {
    const res = await callGet(undefined, user.email);
    expect(res.status).toBe(400);
  });

  it("returns 404 if game not found (GET)", async () => {
    const res = await callGet("nonexistentid", user.email);
    expect(res.status).toBe(404);
  });

  it("returns game with questions (GET)", async () => {
    const game: Game = await prisma.game.create({
      data: {
        userId: user.id,
        topic: "history",
        gameType: "mcq",
        timeStarted: new Date(),
        questions: {
          create: [
            {
              question: "Who discovered America?",
              answer: "Columbus",
              questionType: "mcq",
              options: ["Columbus", "Magellan", "Cook", "Marco Polo"],
            },
          ],
        },
      },
    });

    const res = await callGet(game.id, user.email);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.game).toBeDefined();
    expect(json.game.questions).toBeDefined();
    expect(json.game.id).toBe(game.id);
  });

  it("returns 403 when user tries to access another user's game", async () => {
    const game: Game = await prisma.game.create({
      data: {
        userId: user.id,
        topic: "biology",
        gameType: "mcq",
        timeStarted: new Date(),
      },
    });

    const res = await callGet(game.id, otherUser.email);
    expect(res.status).toBe(403);
  });
});