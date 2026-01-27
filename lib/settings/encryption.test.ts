import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decrypt, encrypt, isEncryptionConfigured, safeDecrypt, safeEncrypt } from "./encryption";

describe("Encryption", () => {
  // Store original env value
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.SETTINGS_ENCRYPTION_KEY;
  });

  afterEach(() => {
    // Restore original env value
    if (originalKey !== undefined) {
      process.env.SETTINGS_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.SETTINGS_ENCRYPTION_KEY;
    }
  });

  describe("with encryption key configured", () => {
    beforeEach(() => {
      // Use a valid 32-byte key (base64 encoded)
      // This is a test key - DO NOT use in production
      process.env.SETTINGS_ENCRYPTION_KEY = "tjeFSvNBFoJJ6vXD0bhgfjZjNw4bISZhqmYMKtEoh1c="; // 32 bytes when decoded
    });

    it("should encrypt and decrypt correctly", () => {
      const plaintext = "my-secret-api-token";
      const encrypted = encrypt(plaintext);

      // Encrypted value should be different from plaintext
      expect(encrypted).not.toBe(plaintext);

      // Encrypted format should be iv:authTag:ciphertext
      expect(encrypted.split(":").length).toBe(3);

      // Decryption should return original value
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertexts for same plaintext (random IV)", () => {
      const plaintext = "same-value";
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Each encryption should produce different ciphertext due to random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same value
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it("should handle empty string", () => {
      const plaintext = "";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should handle unicode characters", () => {
      const plaintext = "日本語テスト 🎉 émojis";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings", () => {
      const plaintext = "a".repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should throw on invalid ciphertext format", () => {
      expect(() => decrypt("invalid-ciphertext")).toThrow("Invalid ciphertext format");
      expect(() => decrypt("only:two:parts:extra")).toThrow("Invalid ciphertext format");
    });

    it("should report encryption as configured", () => {
      expect(isEncryptionConfigured()).toBe(true);
    });
  });

  describe("without encryption key configured", () => {
    beforeEach(() => {
      delete process.env.SETTINGS_ENCRYPTION_KEY;
    });

    it("should throw on encrypt when key not configured", () => {
      expect(() => encrypt("test")).toThrow("SETTINGS_ENCRYPTION_KEY is not configured");
    });

    it("should throw on decrypt when key not configured", () => {
      expect(() => decrypt("iv:tag:data")).toThrow("SETTINGS_ENCRYPTION_KEY is not configured");
    });

    it("should report encryption as not configured", () => {
      expect(isEncryptionConfigured()).toBe(false);
    });
  });

  describe("with invalid encryption key", () => {
    it("should throw when key is too short", () => {
      process.env.SETTINGS_ENCRYPTION_KEY = "c2hvcnQ="; // "short" - only 5 bytes
      expect(() => encrypt("test")).toThrow("must be exactly 32 bytes");
    });
  });

  describe("safeEncrypt", () => {
    it("should encrypt when key is configured", () => {
      process.env.SETTINGS_ENCRYPTION_KEY = "tjeFSvNBFoJJ6vXD0bhgfjZjNw4bISZhqmYMKtEoh1c=";
      const result = safeEncrypt("test");
      expect(result).not.toBe("test");
      expect(result.split(":").length).toBe(3);
    });

    it("should return plaintext when key is not configured", () => {
      delete process.env.SETTINGS_ENCRYPTION_KEY;
      const result = safeEncrypt("test");
      expect(result).toBe("test");
    });
  });

  describe("safeDecrypt", () => {
    it("should decrypt encrypted values when key is configured", () => {
      process.env.SETTINGS_ENCRYPTION_KEY = "tjeFSvNBFoJJ6vXD0bhgfjZjNw4bISZhqmYMKtEoh1c=";
      const encrypted = encrypt("secret");
      const result = safeDecrypt(encrypted);
      expect(result).toBe("secret");
    });

    it("should return value as-is if not in encrypted format", () => {
      process.env.SETTINGS_ENCRYPTION_KEY = "tjeFSvNBFoJJ6vXD0bhgfjZjNw4bISZhqmYMKtEoh1c=";
      const result = safeDecrypt("plain-value");
      expect(result).toBe("plain-value");
    });

    it("should return value as-is if decryption fails", () => {
      process.env.SETTINGS_ENCRYPTION_KEY = "tjeFSvNBFoJJ6vXD0bhgfjZjNw4bISZhqmYMKtEoh1c=";
      // Invalid encrypted format (wrong IV/tag)
      const result = safeDecrypt("YWJj:ZGVm:Z2hp"); // invalid but has 3 parts
      expect(result).toBe("YWJj:ZGVm:Z2hp");
    });
  });
});
