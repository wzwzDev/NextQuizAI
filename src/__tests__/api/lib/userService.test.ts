import {
  getUserBanStatus,
  getUserRevokeStatus,
  getUsersForAdmin,
  markUserOfflineByEmail,
  setUserAdmin,
  setUserBanned,
  setUserRevoked,
} from "@/server/services/userService";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("userService", () => {
  let user: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: "service-user@example.com" } });
    user = await prisma.user.create({
      data: {
        email: "service-user@example.com",
        banned: false,
        revoked: false,
        isAdmin: false,
        isOnline: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  it("reads users for admin", async () => {
    const users = await getUsersForAdmin();
    expect(users.some((candidate) => candidate.id === user.id)).toBe(true);
  });

  it("updates user ban/revoke/admin flags", async () => {
    await setUserBanned(user.id, true);
    await setUserRevoked(user.id, true);
    await setUserAdmin(user.id, true);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.banned).toBe(true);
    expect(updated?.revoked).toBe(true);
    expect(updated?.isAdmin).toBe(true);
  });

  it("reads status flags", async () => {
    const banned = await getUserBanStatus(user.id);
    const revoked = await getUserRevokeStatus(user.id);

    expect(banned?.banned).toBe(true);
    expect(revoked?.revoked).toBe(true);
  });

  it("marks user offline by email", async () => {
    await markUserOfflineByEmail(user.email);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.isOnline).toBe(false);
  });
});