import {
  getUserBanStatus,
  getUserRevokeStatus,
  getUsersForAdmin,
  markUserOfflineByEmail,
  setUserAdmin,
  setUserBanned,
  setUserRevoked,
} from "@/server/services/userService";
import {
  findUserBanStatus,
  findUserRevokeStatus,
  listUsersForAdmin,
  updateUserAdmin,
  updateUserBan,
  updateUserOnlineByEmail,
  updateUserRevoke,
} from "@/server/repositories/userRepository";

jest.mock("@/server/repositories/userRepository", () => ({
  findUserBanStatus: jest.fn(),
  findUserRevokeStatus: jest.fn(),
  listUsersForAdmin: jest.fn(),
  updateUserAdmin: jest.fn(),
  updateUserBan: jest.fn(),
  updateUserOnlineByEmail: jest.fn(),
  updateUserRevoke: jest.fn(),
}));

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates user listing", async () => {
    await getUsersForAdmin();
    expect(listUsersForAdmin).toHaveBeenCalled();
  });

  it("delegates user ban/revoke/admin updates", async () => {
    await setUserBanned("u1", true);
    await setUserRevoked("u1", true);
    await setUserAdmin("u1", true);

    expect(updateUserBan).toHaveBeenCalledWith("u1", true);
    expect(updateUserRevoke).toHaveBeenCalledWith("u1", true);
    expect(updateUserAdmin).toHaveBeenCalledWith("u1", true);
  });

  it("delegates status reads", async () => {
    await getUserBanStatus("u1");
    await getUserRevokeStatus("u1");

    expect(findUserBanStatus).toHaveBeenCalledWith("u1");
    expect(findUserRevokeStatus).toHaveBeenCalledWith("u1");
  });

  it("marks user offline by email", async () => {
    await markUserOfflineByEmail("user@example.com");
    expect(updateUserOnlineByEmail).toHaveBeenCalledWith("user@example.com", false);
  });
});