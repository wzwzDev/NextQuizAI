import { prisma } from "@/server/core/db";

export async function listUsersForAdmin() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      lastSeen: true,
      banned: true,
      revoked: true,
      isAdmin: true,
    },
  });
}

export async function updateUserBan(userId: string, banned: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { banned },
  });
}

export async function updateUserRevoke(userId: string, revoked: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { revoked },
  });
}

export async function updateUserAdmin(userId: string, isAdmin: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { isAdmin },
  });
}

export async function deleteUserById(userId: string) {
  return prisma.user.delete({
    where: { id: userId },
  });
}

export async function findUserIdentityById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isAdmin: true,
    },
  });
}

export async function findUserIdentityByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isAdmin: true,
    },
  });
}

export async function findUserBanStatus(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { banned: true },
  });
}

export async function findUserBanStatusByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { banned: true },
  });
}

export async function findUserRevokeStatus(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { revoked: true },
  });
}

export async function updateUserOnlineByEmail(email: string, isOnline: boolean) {
  return prisma.user.update({
    where: { email },
    data: { isOnline },
  });
}