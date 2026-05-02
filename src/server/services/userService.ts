import { UserRepositoryAdapter } from "@/infrastructure/user/UserRepositoryAdapter";

export {
  getUsersForAdmin,
  getUserBanStatus,
  getUserRevokeStatus,
  setUserAdmin,
  setUserBanned,
  setUserRevoked,
} from "@/server/admin/services/adminUserManagementService";

const userRepository = new UserRepositoryAdapter();

export async function markUserOfflineByEmail(email: string) {
  return userRepository.setOnlineByEmail(email, false);
}