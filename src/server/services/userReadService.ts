import { findUserRevokeStatus } from "@/server/repositories/userRepository";

export async function getUserRevokedStatus(userId: string) {
  const user = await findUserRevokeStatus(userId);
  return user?.revoked === true;
}
