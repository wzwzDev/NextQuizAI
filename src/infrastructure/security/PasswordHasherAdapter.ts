import type { PasswordHasherPort } from "@/application/ports/out/PasswordHasherPort";
import { hashPassword, verifyPassword } from "@/server/auth/password";

export class PasswordHasherAdapter implements PasswordHasherPort {
  async hash(password: string) {
    return hashPassword(password);
  }

  async verify(password: string, hash: string) {
    return verifyPassword(password, hash);
  }
}
