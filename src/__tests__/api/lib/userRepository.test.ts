jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import {
  findUserBanStatus,
  findUserRevokeStatus,
  listUsersForAdmin,
  updateUserAdmin,
  updateUserBan,
  updateUserOnlineByEmail,
  updateUserRevoke,
} from "@/lib/repositories/userRepository";
import { prisma } from "@/lib/db";

describe("userRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists users for admin", async () => {
    await listUsersForAdmin();
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it("updates ban/revoke/admin fields", async () => {
    await updateUserBan("u1", true);
    await updateUserRevoke("u1", true);
    await updateUserAdmin("u1", true);

    expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: "u1" },
      data: { banned: true },
    });
    expect(prisma.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: "u1" },
      data: { revoked: true },
    });
    expect(prisma.user.update).toHaveBeenNthCalledWith(3, {
      where: { id: "u1" },
      data: { isAdmin: true },
    });
  });

  it("fetches user ban/revoke status", async () => {
    await findUserBanStatus("u1");
    await findUserRevokeStatus("u1");

    expect(prisma.user.findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: "u1" },
      select: { banned: true },
    });
    expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
      where: { id: "u1" },
      select: { revoked: true },
    });
  });

  it("updates online status by email", async () => {
    await updateUserOnlineByEmail("user@example.com", false);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      data: { isOnline: false },
    });
  });
});