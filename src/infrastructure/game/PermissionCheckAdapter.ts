import type { PermissionCheckPort } from "@/application/ports/out/PermissionCheckPort";
import { findUserBanStatus, findUserRevokeStatus } from "@/server/repositories/userRepository";

export class PermissionCheckAdapter implements PermissionCheckPort {
  canUserAccessResource(
    userId: string,
    resourceOwnerId: string,
    isAdmin: boolean,
  ): boolean {
    return isAdmin || userId === resourceOwnerId;
  }

  async isUserBanned(userId: string): Promise<boolean> {
    const user = await findUserBanStatus(userId);
    return user?.banned === true;
  }

  async isUserRevoked(userId: string): Promise<boolean> {
    const user = await findUserRevokeStatus(userId);
    return user?.revoked === true;
  }
}
