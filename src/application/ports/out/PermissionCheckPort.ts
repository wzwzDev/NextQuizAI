export interface PermissionCheckPort {
  /**
   * Check if user can perform action on resource
   * @param userId User attempting the action
   * @param resourceOwnerId Owner of the resource
   * @param isAdmin Whether user is admin
   * @returns true if user can perform action
   */
  canUserAccessResource(
    userId: string,
    resourceOwnerId: string,
    isAdmin: boolean,
  ): boolean;

  /**
   * Check if user is banned
   */
  isUserBanned(userId: string): Promise<boolean>;

  /**
   * Check if user is revoked
   */
  isUserRevoked(userId: string): Promise<boolean>;
}
