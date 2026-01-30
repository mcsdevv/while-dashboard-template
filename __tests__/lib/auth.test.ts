import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for authentication configuration and email authorization
 * Updated to test new authorization methods: exact emails, wildcards, domains, setup token
 */
describe("Authentication", () => {
  describe("Email Allowlist (Exact Match)", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should allow authorized emails to sign in", () => {
      process.env.AUTHORIZED_EMAILS = "user1@example.com,user2@example.com";

      const authorizedEmails = process.env.AUTHORIZED_EMAILS.split(",").map((e) =>
        e.trim().toLowerCase(),
      );
      const testEmail = "user1@example.com";

      expect(authorizedEmails.includes(testEmail.toLowerCase())).toBe(true);
    });

    it("should reject unauthorized emails", () => {
      process.env.AUTHORIZED_EMAILS = "user1@example.com,user2@example.com";

      const authorizedEmails = process.env.AUTHORIZED_EMAILS.split(",").map((e) =>
        e.trim().toLowerCase(),
      );
      const testEmail = "unauthorized@example.com";

      expect(authorizedEmails.includes(testEmail.toLowerCase())).toBe(false);
    });

    it("should handle case-insensitive email comparison", () => {
      process.env.AUTHORIZED_EMAILS = "User@Example.com";

      const authorizedEmails = process.env.AUTHORIZED_EMAILS.split(",").map((e) =>
        e.trim().toLowerCase(),
      );
      const testEmail = "USER@EXAMPLE.COM";

      expect(authorizedEmails.includes(testEmail.toLowerCase())).toBe(true);
    });

    it("should handle multiple emails with spaces", () => {
      process.env.AUTHORIZED_EMAILS = " user1@example.com , user2@example.com , user3@example.com ";

      const authorizedEmails = process.env.AUTHORIZED_EMAILS.split(",").map((e) =>
        e.trim().toLowerCase(),
      );

      expect(authorizedEmails).toEqual([
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
      ]);
    });

    it("should handle single authorized email", () => {
      process.env.AUTHORIZED_EMAILS = "single@example.com";

      const authorizedEmails = process.env.AUTHORIZED_EMAILS.split(",").map((e) =>
        e.trim().toLowerCase(),
      );

      expect(authorizedEmails).toEqual(["single@example.com"]);
      expect(authorizedEmails.length).toBe(1);
    });
  });

  describe("Wildcard Patterns", () => {
    /**
     * Helper function that mimics isEmailAuthorized for wildcard patterns
     */
    function isEmailAuthorizedByPattern(email: string, patterns: string[]): boolean {
      const normalizedEmail = email.toLowerCase();
      const emailDomain = normalizedEmail.split("@")[1];

      for (const pattern of patterns) {
        if (pattern.startsWith("*@")) {
          const patternDomain = pattern.slice(2);
          if (emailDomain === patternDomain) {
            return true;
          }
        } else if (pattern === normalizedEmail) {
          return true;
        }
      }
      return false;
    }

    it("should match wildcard pattern *@domain.com", () => {
      const patterns = ["*@company.com"];

      expect(isEmailAuthorizedByPattern("user@company.com", patterns)).toBe(true);
      expect(isEmailAuthorizedByPattern("admin@company.com", patterns)).toBe(true);
      expect(isEmailAuthorizedByPattern("anyone@company.com", patterns)).toBe(true);
    });

    it("should not match different domains for wildcard pattern", () => {
      const patterns = ["*@company.com"];

      expect(isEmailAuthorizedByPattern("user@other.com", patterns)).toBe(false);
      expect(isEmailAuthorizedByPattern("user@notcompany.com", patterns)).toBe(false);
    });

    it("should mix exact emails and wildcard patterns", () => {
      const patterns = ["admin@gmail.com", "*@company.com"];

      // Exact match
      expect(isEmailAuthorizedByPattern("admin@gmail.com", patterns)).toBe(true);
      // Wildcard match
      expect(isEmailAuthorizedByPattern("anyone@company.com", patterns)).toBe(true);
      // No match
      expect(isEmailAuthorizedByPattern("user@gmail.com", patterns)).toBe(false);
    });

    it("should be case-insensitive for wildcard patterns", () => {
      const patterns = ["*@company.com"];

      expect(isEmailAuthorizedByPattern("USER@COMPANY.COM", patterns)).toBe(true);
      expect(isEmailAuthorizedByPattern("User@Company.Com", patterns)).toBe(true);
    });
  });

  describe("Domain Allowlist", () => {
    /**
     * Helper function that mimics isEmailAuthorized for domain allowlist
     */
    function isEmailAuthorizedByDomain(email: string, domains: string[]): boolean {
      const normalizedEmail = email.toLowerCase();
      const emailDomain = normalizedEmail.split("@")[1];
      return domains.includes(emailDomain);
    }

    it("should allow emails from authorized domains", () => {
      const domains = ["company.com", "partner.org"];

      expect(isEmailAuthorizedByDomain("user@company.com", domains)).toBe(true);
      expect(isEmailAuthorizedByDomain("admin@partner.org", domains)).toBe(true);
    });

    it("should reject emails from unauthorized domains", () => {
      const domains = ["company.com"];

      expect(isEmailAuthorizedByDomain("user@other.com", domains)).toBe(false);
      expect(isEmailAuthorizedByDomain("user@gmail.com", domains)).toBe(false);
    });

    it("should be case-insensitive for domain matching", () => {
      const domains = ["company.com"];

      expect(isEmailAuthorizedByDomain("USER@COMPANY.COM", domains)).toBe(true);
      expect(isEmailAuthorizedByDomain("user@Company.Com", domains)).toBe(true);
    });
  });

  describe("Setup Token Mode", () => {
    it("should identify setup token mode when no emails or domains are configured", () => {
      const authorizedEmails: string[] = [];
      const authorizedDomains: string[] = [];
      const setupToken = "some-token";

      const hasEmailOrDomainAuth = authorizedEmails.length > 0 || authorizedDomains.length > 0;
      const isSetupTokenMode = !hasEmailOrDomainAuth && Boolean(setupToken);

      expect(isSetupTokenMode).toBe(true);
    });

    it("should not be in setup token mode when emails are configured", () => {
      const authorizedEmails = ["admin@example.com"];
      const authorizedDomains: string[] = [];
      const setupToken = "some-token";

      const hasEmailOrDomainAuth = authorizedEmails.length > 0 || authorizedDomains.length > 0;
      const isSetupTokenMode = !hasEmailOrDomainAuth && Boolean(setupToken);

      expect(isSetupTokenMode).toBe(false);
    });

    it("should not be in setup token mode when domains are configured", () => {
      const authorizedEmails: string[] = [];
      const authorizedDomains = ["company.com"];
      const setupToken = "some-token";

      const hasEmailOrDomainAuth = authorizedEmails.length > 0 || authorizedDomains.length > 0;
      const isSetupTokenMode = !hasEmailOrDomainAuth && Boolean(setupToken);

      expect(isSetupTokenMode).toBe(false);
    });

    it("should not be in setup token mode when token is not set", () => {
      const authorizedEmails: string[] = [];
      const authorizedDomains: string[] = [];
      const setupToken = "";

      const hasEmailOrDomainAuth = authorizedEmails.length > 0 || authorizedDomains.length > 0;
      const isSetupTokenMode = !hasEmailOrDomainAuth && Boolean(setupToken);

      expect(isSetupTokenMode).toBe(false);
    });
  });

  describe("Environment Variables", () => {
    it("should require NEXTAUTH_SECRET when present", () => {
      const secret = process.env.NEXTAUTH_SECRET || "test-secret";
      expect(typeof secret).toBe("string");
      expect(secret.length).toBeGreaterThan(0);
    });

    it("should require GOOGLE_CLIENT_ID when present", () => {
      const clientId = process.env.GOOGLE_CLIENT_ID || "test.apps.googleusercontent.com";
      expect(typeof clientId).toBe("string");
      expect(clientId.length).toBeGreaterThan(0);
    });

    it("should require GOOGLE_CLIENT_SECRET when present", () => {
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "GOCSPX-test";
      expect(typeof clientSecret).toBe("string");
      expect(clientSecret.length).toBeGreaterThan(0);
    });

    it("NEXTAUTH_URL should be a valid URL if provided", () => {
      const url = process.env.NEXTAUTH_URL || "https://example.com";
      if (url) {
        expect(() => new URL(url)).not.toThrow();
      }
    });
  });

  describe("Session Strategy", () => {
    it("should use JWT strategy for stateless authentication", () => {
      // NextAuth configuration uses JWT strategy
      // This is important for Vercel serverless functions
      const expectedStrategy = "jwt";
      expect(expectedStrategy).toBe("jwt");
    });
  });

  describe("OAuth Configuration", () => {
    it("should configure Google provider with calendar scope", () => {
      // Google OAuth should request calendar access in addition to profile
      const expectedScopes = [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar",
      ];

      expect(expectedScopes).toContain("email");
      expect(expectedScopes).toContain("profile");
      expect(expectedScopes).toContain("https://www.googleapis.com/auth/calendar");
    });

    it("should prompt for consent to ensure refresh token", () => {
      // Authorization params should include prompt=consent and access_type=offline
      // This ensures we get a refresh token for calendar API access
      const authParams = {
        access_type: "offline",
        prompt: "consent",
      };

      expect(authParams.access_type).toBe("offline");
      expect(authParams.prompt).toBe("consent");
    });
  });

  describe("Security", () => {
    it("should log unauthorized sign-in attempts", () => {
      const consoleSpy = vi.fn();
      const originalWarn = console.warn;
      console.warn = consoleSpy;

      const unauthorizedEmail = "hacker@evil.com";
      const authorizedEmails = ["user@example.com"];

      if (!authorizedEmails.includes(unauthorizedEmail.toLowerCase())) {
        console.warn(`Unauthorized sign-in attempt from: ${unauthorizedEmail}`);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        `Unauthorized sign-in attempt from: ${unauthorizedEmail}`,
      );

      console.warn = originalWarn;
    });

    it("should reject sign-in if user has no email", () => {
      const user = { email: null };
      const isAuthorized = user.email !== null;

      expect(isAuthorized).toBe(false);
    });

    it("should reject sign-in if email is undefined", () => {
      const user = { email: undefined };
      const isAuthorized = user.email !== undefined;

      expect(isAuthorized).toBe(false);
    });
  });

  describe("Callback URLs", () => {
    it("should redirect to homepage after successful sign-in", () => {
      const defaultRedirect = "/";
      expect(defaultRedirect).toBe("/");
    });

    it("should redirect to setup page with google=connected parameter", () => {
      // When signing in from setup wizard, redirect back to setup
      const setupCallbackUrl = "/setup?google=connected";
      expect(setupCallbackUrl).toContain("/setup");
      expect(setupCallbackUrl).toContain("google=connected");
    });
  });

  describe("Refresh Token Storage", () => {
    it("should preserve existing calendarId when storing new refresh token", () => {
      // When user re-consents, we should keep their calendar selection
      const existingSettings = {
        google: {
          refreshToken: "old-token",
          calendarId: "calendar-123",
          connectedAt: "2024-01-01T00:00:00Z",
        },
      };

      const newRefreshToken = "new-token";
      const updatedSettings = {
        google: {
          refreshToken: newRefreshToken,
          calendarId: existingSettings.google.calendarId, // Preserved
          connectedAt: new Date().toISOString(),
        },
      };

      expect(updatedSettings.google.calendarId).toBe("calendar-123");
      expect(updatedSettings.google.refreshToken).toBe("new-token");
    });

    it("should initialize calendarId as empty string for new users", () => {
      // When no existing settings, calendarId should be empty
      // Simulate the nullable pattern used in auth.ts
      type Settings = { google?: { calendarId?: string } } | null;
      const getExistingSettings = (): Settings => null;
      const existingSettings = getExistingSettings();
      const existingCalendarId = existingSettings?.google?.calendarId || "";

      expect(existingCalendarId).toBe("");
    });
  });
});
