import type { AuthSessionPort } from "@/application/ports/out/AuthSessionPort";
import { getAuthSession } from "@/server/core/auth";

export class NextAuthSessionAdapter implements AuthSessionPort {
  async getSession(req?: Request) {
    return getAuthSession(req);
  }
}