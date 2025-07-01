import { authOptions, getAuthSession } from "@/lib/nextauth";
import * as nextAuth from "next-auth";
import { prisma } from "@/lib/db";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("nextauth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authOptions has providers", () => {
    expect(authOptions.providers).toBeDefined();
  });

  it("getAuthSession calls getServerSession", () => {
    getAuthSession();
    expect(nextAuth.getServerSession).toHaveBeenCalledWith(authOptions);
  });

  describe("signIn callback", () => {
    it("returns false for banned user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ banned: true });
      const mockUser = { id: "1", email: "banned@example.com", emailVerified: null };
      const result = await authOptions.callbacks!.signIn!({ user: mockUser, account: null });
      expect(result).toBe(false);
    });

    it("returns true for allowed user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ banned: false });
      const mockUser = { id: "2", email: "user@example.com", emailVerified: null };
      const result = await authOptions.callbacks!.signIn!({ user: mockUser, account: null });
      expect(result).toBe(true);
    });

    it("returns true if user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const mockUser = { id: "3", email: "notfound@example.com", emailVerified: null };
      const result = await authOptions.callbacks!.signIn!({ user: mockUser, account: null });
      expect(result).toBe(true);
    });
  });

  describe("jwt callback", () => {
    

  
    
  });

  describe("session callback", () => {
    

   
  });
});