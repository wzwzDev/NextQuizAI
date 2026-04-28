export interface AuthRegistrationRepositoryPort {
  findUserByEmail(email: string): Promise<{ id: string; email: string } | null>;
  createUserWithPassword(input: {
    email: string;
    name: string | null;
    passwordHash: string;
  }): Promise<void>;
}
