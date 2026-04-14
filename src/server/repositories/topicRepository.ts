import { prisma } from "@/server/core/db";

function isUniqueConstraintViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function incrementTopicCount(topic: string) {
  try {
    return await prisma.topicCount.upsert({
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
  } catch (error: unknown) {
    // Concurrent requests can race on upsert; fall back to a simple increment.
    if (isUniqueConstraintViolation(error)) {
      return prisma.topicCount.update({
        where: { topic },
        data: {
          count: {
            increment: 1,
          },
        },
      });
    }

    throw error;
  }
}