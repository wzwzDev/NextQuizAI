import {
  deleteUserById,
  findUserIdentityById,
  findUserBanStatus,
  findUserRevokeStatus,
  listUsersForAdmin,
  updateUserAdmin,
  updateUserBan,
  updateUserRevoke,
} from "@/server/repositories/userRepository";
import { isOwnerEmail } from "@/server/core/roles";

export class OwnerProtectedError extends Error {
  constructor() {
    super("Owner account is protected.");
    this.name = "OwnerProtectedError";
  }
}

export class SelfDeleteNotAllowedError extends Error {
  constructor() {
    super("You cannot delete your own account.");
    this.name = "SelfDeleteNotAllowedError";
  }
}

async function assertTargetIsNotOwner(userId: string) {
  const user = await findUserIdentityById(userId);
  if (user && isOwnerEmail(user.email)) {
    throw new OwnerProtectedError();
  }
}

export async function getUsersForAdmin() {
  const users = await listUsersForAdmin();
  return users.map((user) => ({
    ...user,
    isOwner: isOwnerEmail(user.email),
  }));
}

export async function setUserBanned(userId: string, banned: boolean) {
  await assertTargetIsNotOwner(userId);
  return updateUserBan(userId, banned);
}

export async function setUserRevoked(userId: string, revoked: boolean) {
  await assertTargetIsNotOwner(userId);
  return updateUserRevoke(userId, revoked);
}

export async function setUserAdmin(userId: string, isAdmin: boolean) {
  await assertTargetIsNotOwner(userId);
  return updateUserAdmin(userId, isAdmin);
}

export async function deleteUserForAdmin(actorUserId: string, targetUserId: string) {
  if (actorUserId === targetUserId) {
    throw new SelfDeleteNotAllowedError();
  }

  await assertTargetIsNotOwner(targetUserId);
  return deleteUserById(targetUserId);
}

export async function getUserBanStatus(userId: string) {
  return findUserBanStatus(userId);
}

export async function getUserRevokeStatus(userId: string) {
  return findUserRevokeStatus(userId);
}
