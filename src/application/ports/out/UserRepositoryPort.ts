export interface UserRepositoryPort {
  findById(id: string): Promise<{ id: string; email: string } | null>;
  findByEmail(email: string): Promise<{ id: string; email: string } | null>;
  findBanStatusByEmail(email: string): Promise<{ banned: boolean } | null>;
  findRevokeStatus(userId: string): Promise<{ revoked: boolean } | null>;
  setOnlineByEmail(email: string, isOnline: boolean): Promise<unknown>;
}
