export interface AuthSessionPort {
  getSession(req?: Request): Promise<{
    user?: {
      id: string;
      isAdmin?: boolean;
      email?: string | null;
    };
  } | null>;
}
