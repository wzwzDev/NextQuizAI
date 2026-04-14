import { updateUserOnlineByEmail } from "@/server/repositories/userRepository";

export {
  getUsersForAdmin,
  getUserBanStatus,
  getUserRevokeStatus,
  setUserAdmin,
  setUserBanned,
  setUserRevoked,
} from "@/server/admin/services/adminUserManagementService";

export async function markUserOfflineByEmail(email: string) {
  return updateUserOnlineByEmail(email, false);
}