jest.mock("@/server/core/db", () => ({
  prisma: {
    topicCount: {
      upsert: jest.fn(),
    },
  },
}));

import { incrementTopicCount } from "@/server/repositories/topicRepository";
import { prisma } from "@/server/core/db";

describe("topicRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("increments topic count using upsert", async () => {
    await incrementTopicCount("history");

    expect(prisma.topicCount.upsert).toHaveBeenCalledWith({
      where: { topic: "history" },
      create: { topic: "history", count: 1 },
      update: { count: { increment: 1 } },
    });
  });
});