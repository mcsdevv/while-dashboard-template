import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * Tests for environment variable validation schema
 * Updated to reflect consolidated Google OAuth (single client for auth + calendar)
 */
describe("Environment Variables", () => {
  // Schema matching the actual implementation in lib/env.ts
  const authEnvSchema = z.object({
    NEXTAUTH_SECRET: z.string().min(1, "NextAuth secret is required"),
    NEXTAUTH_URL: z.string().url().optional(),
    GOOGLE_CLIENT_ID: z.string().min(1, "Google OAuth client ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "Google OAuth client secret is required"),
    AUTHORIZED_EMAILS: z
      .string()
      .optional()
      .transform((str) =>
        str
          ?.split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
  });

  describe("NEXTAUTH_SECRET", () => {
    it("should require NEXTAUTH_SECRET", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "test@example.com",
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid NEXTAUTH_SECRET", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "my-super-secret-key-that-is-32-chars",
        GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "GOCSPX-test",
        AUTHORIZED_EMAILS: "test@example.com",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("NEXTAUTH_URL", () => {
    it("should accept valid URL for NEXTAUTH_URL", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        NEXTAUTH_URL: "https://example.com",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "test@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid URL for NEXTAUTH_URL", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        NEXTAUTH_URL: "not-a-url",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "test@example.com",
      });

      expect(result.success).toBe(false);
    });

    it("should allow NEXTAUTH_URL to be optional", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "test@example.com",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("GOOGLE_CLIENT_ID", () => {
    it("should require GOOGLE_CLIENT_ID", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "test@example.com",
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid Google Client ID format", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "123456789-abc123.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "test@example.com",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("GOOGLE_CLIENT_SECRET", () => {
    it("should require GOOGLE_CLIENT_SECRET", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "",
        AUTHORIZED_EMAILS: "test@example.com",
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid Google Client Secret format", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "GOCSPX-abc123xyz789",
        AUTHORIZED_EMAILS: "test@example.com",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("AUTHORIZED_EMAILS", () => {
    it("should allow AUTHORIZED_EMAILS to be optional in schema (runtime validation is separate)", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        // Schema allows empty, but runtime validation requires at least one email
      });

      expect(result.success).toBe(true);
    });

    it("should parse single email", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "user@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTHORIZED_EMAILS).toEqual(["user@example.com"]);
      }
    });

    it("should parse multiple emails separated by commas", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "user1@example.com,user2@example.com,user3@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTHORIZED_EMAILS).toEqual([
          "user1@example.com",
          "user2@example.com",
          "user3@example.com",
        ]);
      }
    });

    it("should trim whitespace and lowercase emails", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: " User1@Example.COM , USER2@example.com ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTHORIZED_EMAILS).toEqual(["user1@example.com", "user2@example.com"]);
      }
    });

    it("should filter out empty entries", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "user@example.com,,  ,another@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTHORIZED_EMAILS).toEqual(["user@example.com", "another@example.com"]);
      }
    });

    it("should accept wildcard patterns", () => {
      const result = authEnvSchema.safeParse({
        NEXTAUTH_SECRET: "secret",
        GOOGLE_CLIENT_ID: "test",
        GOOGLE_CLIENT_SECRET: "test",
        AUTHORIZED_EMAILS: "*@company.com,admin@gmail.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTHORIZED_EMAILS).toEqual(["*@company.com", "admin@gmail.com"]);
      }
    });
  });

  describe("Complete Configuration", () => {
    it("should validate complete auth configuration with emails", () => {
      const validConfig = {
        NEXTAUTH_SECRET: "my-super-secret-key-that-is-32-chars",
        NEXTAUTH_URL: "https://my-app.vercel.app",
        GOOGLE_CLIENT_ID: "123456789-abc123.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "GOCSPX-abc123xyz789",
        AUTHORIZED_EMAILS: "admin@example.com,user@example.com",
      };

      const result = authEnvSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NEXTAUTH_SECRET).toBe(validConfig.NEXTAUTH_SECRET);
        expect(result.data.NEXTAUTH_URL).toBe(validConfig.NEXTAUTH_URL);
        expect(result.data.GOOGLE_CLIENT_ID).toBe(validConfig.GOOGLE_CLIENT_ID);
        expect(result.data.GOOGLE_CLIENT_SECRET).toBe(validConfig.GOOGLE_CLIENT_SECRET);
        expect(result.data.AUTHORIZED_EMAILS).toEqual(["admin@example.com", "user@example.com"]);
      }
    });

    it("should validate configuration with wildcard patterns", () => {
      const validConfig = {
        NEXTAUTH_SECRET: "my-super-secret-key",
        GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "GOCSPX-test",
        AUTHORIZED_EMAILS: "*@company.com,*@partner.org",
      };

      const result = authEnvSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTHORIZED_EMAILS).toEqual(["*@company.com", "*@partner.org"]);
      }
    });

    it("should reject invalid configuration", () => {
      const invalidConfig = {
        NEXTAUTH_SECRET: "", // Invalid: empty
        NEXTAUTH_URL: "not-a-url", // Invalid: not a URL
        GOOGLE_CLIENT_ID: "", // Invalid: empty
        GOOGLE_CLIENT_SECRET: "", // Invalid: empty
      };

      const result = authEnvSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
    });
  });
});
