import { incrementTopicCount } from "@/server/repositories/topicRepository";
import { prisma } from "@/server/core/db";

jest.setTimeout(30000);

describe("topicRepository", () => {
  const fallbackTopic = "history-repo-fallback";

  beforeAll(async () => {
    await prisma.topicCount.deleteMany({
      where: { topic: { in: ["history-repo", fallbackTopic] } },
    });
  });

  afterAll(async () => {
    await prisma.topicCount.deleteMany({
      where: { topic: { in: ["history-repo", fallbackTopic] } },
    });
    await prisma.$disconnect();
  });

  it("increments topic count using upsert", async () => {
    await incrementTopicCount("history-repo");
    await incrementTopicCount("history-repo");

    const topic = await prisma.topicCount.findUnique({ where: { topic: "history-repo" } });
    expect(topic?.count).toBe(2);
  });

  it("falls back to update when upsert hits unique constraint race", async () => {
    await prisma.topicCount.create({
      data: { topic: fallbackTopic, count: 1 },
    });

    const upsertSpy = jest
      .spyOn(prisma.topicCount, "upsert")
      .mockRejectedValue({ code: "P2002" });
    const updateSpy = jest.spyOn(prisma.topicCount, "update");

    await incrementTopicCount(fallbackTopic);

    expect(upsertSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith({
      where: { topic: fallbackTopic },
      data: { count: { increment: 1 } },
    });

    const topic = await prisma.topicCount.findUnique({
      where: { topic: fallbackTopic },
    });
    expect(topic?.count).toBe(2);

    upsertSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("rethrows errors that are not unique-constraint conflicts", async () => {
    const upsertSpy = jest
      .spyOn(prisma.topicCount, "upsert")
      .mockRejectedValue(new Error("boom"));
    const updateSpy = jest.spyOn(prisma.topicCount, "update");

    await expect(incrementTopicCount("history-repo-error")).rejects.toThrow(
      "boom",
    );
    expect(updateSpy).not.toHaveBeenCalled();

    upsertSpy.mockRestore();
    updateSpy.mockRestore();
  });
});