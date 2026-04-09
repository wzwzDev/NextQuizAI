import {
  findUserBanStatus,
  findUserRevokeStatus,
  listUsersForAdmin,
  updateUserAdmin,
  updateUserBan,
  updateUserOnlineByEmail,
  updateUserRevoke,
} from "@/server/repositories/userRepository";

export async function getUsersForAdmin() {
  return listUsersForAdmin();
}

export async function setUserBanned(userId: string, banned: boolean) {
  return updateUserBan(userId, banned);
}

export async function setUserRevoked(userId: string, revoked: boolean) {
  return updateUserRevoke(userId, revoked);
}

export async function setUserAdmin(userId: string, isAdmin: boolean) {
  return updateUserAdmin(userId, isAdmin);
}

export async function getUserBanStatus(userId: string) {
  return findUserBanStatus(userId);
}

export async function getUserRevokeStatus(userId: string) {
  return findUserRevokeStatus(userId);
}

export async function markUserOfflineByEmail(email: string) {
  return updateUserOnlineByEmail(email, false);
}