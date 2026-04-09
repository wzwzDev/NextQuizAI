import { prisma } from "@/server/core/db";

export async function incrementTopicCount(topic: string) {
  return prisma.topicCount.upsert({
    where: { topic },
    create: {
      topic,
      count: 1,
    },
    update: {
      count: {
        increment: 1,
      },
    },
  });
}