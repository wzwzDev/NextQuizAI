import {
  deleteUserForAdmin,
  getUserBanStatus,
  getUserRevokeStatus,
  getUsersForAdmin,
  OwnerProtectedError,
  SelfDeleteNotAllowedError,
  setUserAdmin,
  setUserBanned,
  setUserRevoked,
} from "@/server/admin/services/adminUserManagementService";
import { markUserOfflineByEmail } from "@/server/services/userService";
import { prisma } from "@/server/core/db";
import type { User } from "@prisma/client";
import {
  cleanupUsersByEmail,
  createTestUser,
  uniqueEmail,
} from "../../../utils/prismaUsers";

jest.setTimeout(30000);

describe("userService", () => {
  let user: User;
  let actor: User;
  let owner: User;
  const previousOwnerEmail = process.env.OWNER_EMAIL;
  const ownerEmail = uniqueEmail("owner-service");
  const actorEmail = uniqueEmail("service-actor");
  const userEmail = uniqueEmail("service-user");

  beforeAll(async () => {
    process.env.OWNER_EMAIL = ownerEmail;
    await cleanupUsersByEmail(prisma, [userEmail, actorEmail, ownerEmail]);

    actor = await createTestUser(prisma, {
      email: actorEmail,
      isAdmin: true,
    });

    user = await createTestUser(prisma, {
      email: userEmail,
      isOnline: true,
    });

    owner = await createTestUser(prisma, {
      email: ownerEmail,
      isAdmin: true,
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [user.id, actor.id, owner.id] } } });

    if (typeof previousOwnerEmail === "string") {
      process.env.OWNER_EMAIL = previousOwnerEmail;
    } else {
      delete process.env.OWNER_EMAIL;
    }

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

  it("deletes a target user for admin", async () => {
    const deletable = await createTestUser(prisma, {
      email: uniqueEmail("service-delete"),
    });

    await deleteUserForAdmin(actor.id, deletable.id);

    const deleted = await prisma.user.findUnique({ where: { id: deletable.id } });
    expect(deleted).toBeNull();
  });

  it("blocks deleting owner account", async () => {
    await expect(deleteUserForAdmin(actor.id, owner.id)).rejects.toBeInstanceOf(
      OwnerProtectedError,
    );
  });

  it("blocks deleting self", async () => {
    await expect(deleteUserForAdmin(actor.id, actor.id)).rejects.toBeInstanceOf(
      SelfDeleteNotAllowedError,
    );
  });
});