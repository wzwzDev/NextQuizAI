import type { AuthRegistrationRepositoryPort } from "@/application/ports/out/AuthRegistrationRepositoryPort";
import {
  createUserWithPassword,
  findUserByEmail,
} from "@/server/repositories/authRegistrationRepository";

export class AuthRegistrationRepositoryAdapter
  implements AuthRegistrationRepositoryPort
{
  async findUserByEmail(email: string) {
    return findUserByEmail(email);
  }

  async createUserWithPassword(input: {
    email: string;
    name: string | null;
    passwordHash: string;
  }) {
    await createUserWithPassword(input);
  }
}
