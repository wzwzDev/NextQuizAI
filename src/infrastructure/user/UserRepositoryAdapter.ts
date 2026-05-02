import type { UserRepositoryPort } from "@/application/ports/out/UserRepositoryPort";
import {
  findUserBanStatusByEmail,
  findUserIdentityByEmail,
  findUserIdentityById,
  findUserRevokeStatus,
  updateUserOnlineByEmail,
} from "@/server/repositories/userRepository";

export class UserRepositoryAdapter implements UserRepositoryPort {
  async findById(id: string) {
    const user = await findUserIdentityById(id);
    if (!user) {
      return null;
    }

    return { id: user.id, email: user.email };
  }

  async findByEmail(email: string) {
    const user = await findUserIdentityByEmail(email);
    if (!user) {
      return null;
    }

    return { id: user.id, email: user.email };
  }

  async findBanStatusByEmail(email: string) {
    return findUserBanStatusByEmail(email);
  }

  async findRevokeStatus(userId: string) {
    return findUserRevokeStatus(userId);
  }

  async setOnlineByEmail(email: string, isOnline: boolean) {
    return updateUserOnlineByEmail(email, isOnline);
  }
}