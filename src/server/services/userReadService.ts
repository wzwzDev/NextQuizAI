import { UserRepositoryAdapter } from "@/infrastructure/user/UserRepositoryAdapter";

const userRepository = new UserRepositoryAdapter();

export async function getUserRevokedStatus(userId: string) {
  const user = await userRepository.findRevokeStatus(userId);
  return user?.revoked === true;
}

export async function getUserBannedStatusByEmail(email: string) {
  const user = await userRepository.findBanStatusByEmail(email);
  return user?.banned === true;
}
