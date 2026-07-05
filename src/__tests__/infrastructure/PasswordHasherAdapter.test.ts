import { PasswordHasherAdapter } from "@/infrastructure/security/PasswordHasherAdapter";
import * as password from "@/server/auth/password";

jest.mock("@/server/auth/password");

describe("PasswordHasherAdapter", () => {
  let adapter: PasswordHasherAdapter;

  beforeEach(() => {
    adapter = new PasswordHasherAdapter();
    jest.clearAllMocks();
  });

  describe("hash", () => {
    it("should hash password", async () => {
      const plainPassword = "myPassword123";
      const hashedPassword = "hashed_value_123";

      (password.hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await adapter.hash(plainPassword);

      expect(result).toBe(hashedPassword);
      expect(password.hashPassword).toHaveBeenCalledWith(plainPassword);
    });

    it("should handle empty password", async () => {
      (password.hashPassword as jest.Mock).mockResolvedValue("hash_of_empty");

      const result = await adapter.hash("");

      expect(password.hashPassword).toHaveBeenCalledWith("");
      expect(result).toBe("hash_of_empty");
    });

    it("should handle special characters in password", async () => {
      const specialPassword = "p@ssw0rd!#$%";
      const hashedValue = "hashed_special";

      (password.hashPassword as jest.Mock).mockResolvedValue(hashedValue);

      const result = await adapter.hash(specialPassword);

      expect(password.hashPassword).toHaveBeenCalledWith(specialPassword);
      expect(result).toBe(hashedValue);
    });

    it("should handle long password", async () => {
      const longPassword = "a".repeat(1000);
      const hashedValue = "hashed_long";

      (password.hashPassword as jest.Mock).mockResolvedValue(hashedValue);

      const result = await adapter.hash(longPassword);

      expect(password.hashPassword).toHaveBeenCalledWith(longPassword);
      expect(result).toBe(hashedValue);
    });

    it("should handle unicode characters in password", async () => {
      const unicodePassword = "пароль123";
      const hashedValue = "hashed_unicode";

      (password.hashPassword as jest.Mock).mockResolvedValue(hashedValue);

      await adapter.hash(unicodePassword);

      expect(password.hashPassword).toHaveBeenCalledWith(unicodePassword);
    });

    it("should propagate hash errors", async () => {
      (password.hashPassword as jest.Mock).mockRejectedValue(
        new Error("Hash failed")
      );

      await expect(adapter.hash("password")).rejects.toThrow("Hash failed");
    });
  });

  describe("verify", () => {
    it("should verify correct password", async () => {
      const plainPassword = "myPassword123";
      const hashedPassword = "hashed_value_123";

      (password.verifyPassword as jest.Mock).mockResolvedValue(true);

      const result = await adapter.verify(plainPassword, hashedPassword);

      expect(result).toBe(true);
      expect(password.verifyPassword).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it("should reject incorrect password", async () => {
      const plainPassword = "wrongPassword";
      const hashedPassword = "hashed_value_123";

      (password.verifyPassword as jest.Mock).mockResolvedValue(false);

      const result = await adapter.verify(plainPassword, hashedPassword);

      expect(result).toBe(false);
      expect(password.verifyPassword).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it("should verify with empty password", async () => {
      (password.verifyPassword as jest.Mock).mockResolvedValue(false);

      const result = await adapter.verify("", "hash");

      expect(password.verifyPassword).toHaveBeenCalledWith("", "hash");
      expect(result).toBe(false);
    });

    it("should verify with special characters", async () => {
      const specialPassword = "p@ssw0rd!#$%";
      const hashedPassword = "hashed_value_123";

      (password.verifyPassword as jest.Mock).mockResolvedValue(true);

      const result = await adapter.verify(specialPassword, hashedPassword);

      expect(password.verifyPassword).toHaveBeenCalledWith(specialPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it("should verify with very long password", async () => {
      const longPassword = "a".repeat(1000);
      const hashedPassword = "hashed_value";

      (password.verifyPassword as jest.Mock).mockResolvedValue(true);

      await adapter.verify(longPassword, hashedPassword);

      expect(password.verifyPassword).toHaveBeenCalledWith(longPassword, hashedPassword);
    });

    it("should handle verify errors", async () => {
      (password.verifyPassword as jest.Mock).mockRejectedValue(
        new Error("Verify failed")
      );

      await expect(adapter.verify("password", "hash")).rejects.toThrow(
        "Verify failed"
      );
    });

    it("should handle corrupted hash", async () => {
      const password_value = "password";
      const corruptedHash = "corrupted_hash_data";

      (password.verifyPassword as jest.Mock).mockResolvedValue(false);

      const result = await adapter.verify(password_value, corruptedHash);

      expect(result).toBe(false);
    });
  });

  describe("multiple operations", () => {
    it("should hash then verify successfully", async () => {
      const plainPassword = "myPassword123";
      const hashedPassword = "hashed_value";

      (password.hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      (password.verifyPassword as jest.Mock).mockResolvedValue(true);

      const hashed = await adapter.hash(plainPassword);
      const verified = await adapter.verify(plainPassword, hashed);

      expect(hashed).toBe(hashedPassword);
      expect(verified).toBe(true);
    });

    it("should handle multiple consecutive hashes", async () => {
      (password.hashPassword as jest.Mock)
        .mockResolvedValueOnce("hash1")
        .mockResolvedValueOnce("hash2")
        .mockResolvedValueOnce("hash3");

      const h1 = await adapter.hash("pass1");
      const h2 = await adapter.hash("pass2");
      const h3 = await adapter.hash("pass3");

      expect(h1).toBe("hash1");
      expect(h2).toBe("hash2");
      expect(h3).toBe("hash3");
      expect(password.hashPassword).toHaveBeenCalledTimes(3);
    });

    it("should handle multiple verifications", async () => {
      (password.verifyPassword as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const v1 = await adapter.verify("pass1", "hash1");
      const v2 = await adapter.verify("pass2", "hash2");
      const v3 = await adapter.verify("pass3", "hash3");

      expect(v1).toBe(true);
      expect(v2).toBe(false);
      expect(v3).toBe(true);
      expect(password.verifyPassword).toHaveBeenCalledTimes(3);
    });
  });
});
