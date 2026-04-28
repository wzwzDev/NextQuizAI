export interface UserRepositoryPort {
  findById(id: string): Promise<{ id: string; email: string } | null>;
  findByEmail(email: string): Promise<{ id: string; email: string } | null>;
}
