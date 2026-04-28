import { prisma } from "@/server/core/db";

export async function getUserRevokedStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { revoked: true },
  });

  return user?.revoked === true;
}
