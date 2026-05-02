import {
  findUserBanStatusByEmail,
  findUserIdentityByEmail,
  findUserIdentityById,
  findUserBanStatus,
  findUserRevokeStatus,
  listUsersForAdmin,
  updateUserAdmin,
  updateUserBan,
  updateUserOnlineByEmail,
  updateUserRevoke,
} from "@/server/repositories/userRepository";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";

jest.setTimeout(30000);

describe("userRepository", () => {
  let user: User;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: "repo-user@example.com" } });
    user = await prisma.user.create({
      data: {
        email: "repo-user@example.com",
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

  it("lists users for admin", async () => {
    const users = await listUsersForAdmin();
    const found = users.find((candidate) => candidate.id === user.id);
    expect(found).toBeDefined();
    expect(found).toHaveProperty("email");
    expect(found).toHaveProperty("isAdmin");
    expect(found).toHaveProperty("banned");
    expect(found).toHaveProperty("revoked");
  });

  it("updates ban/revoke/admin fields", async () => {
    await updateUserBan(user.id, true);
    await updateUserRevoke(user.id, true);
    await updateUserAdmin(user.id, true);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.banned).toBe(true);
    expect(updated?.revoked).toBe(true);
    expect(updated?.isAdmin).toBe(true);
  });

  it("fetches user ban/revoke status", async () => {
    const ban = await findUserBanStatus(user.id);
    const revoke = await findUserRevokeStatus(user.id);

    expect(ban?.banned).toBe(true);
    expect(revoke?.revoked).toBe(true);
  });

  it("fetches identity and ban status by email", async () => {
    const identityById = await findUserIdentityById(user.id);
    const identityByEmail = await findUserIdentityByEmail(user.email);
    const banByEmail = await findUserBanStatusByEmail(user.email);

    expect(identityById?.id).toBe(user.id);
    expect(identityByEmail?.email).toBe(user.email);
    expect(banByEmail?.banned).toBe(true);
  });

  it("updates online status by email", async () => {
    await updateUserOnlineByEmail(user.email, false);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.isOnline).toBe(false);
  });
});