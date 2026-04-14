import { incrementTopicCount } from "@/server/repositories/topicRepository";
import { prisma } from "@/server/core/db";

jest.setTimeout(30000);

describe("topicRepository", () => {
  beforeAll(async () => {
    await prisma.topicCount.deleteMany({ where: { topic: "history-repo" } });
  });

  afterAll(async () => {
    await prisma.topicCount.deleteMany({ where: { topic: "history-repo" } });
    await prisma.$disconnect();
  });

  it("increments topic count using upsert", async () => {
    await incrementTopicCount("history-repo");
    await incrementTopicCount("history-repo");

    const topic = await prisma.topicCount.findUnique({ where: { topic: "history-repo" } });
    expect(topic?.count).toBe(2);
  });
});