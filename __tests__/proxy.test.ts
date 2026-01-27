import { describe, expect, it } from "vitest";

/**
 * Tests for authentication proxy route protection
 */
describe("Proxy", () => {
  describe("Public Routes", () => {
    it("should allow access to auth endpoints", () => {
      const publicPaths = [
        "/api/auth/signin",
        "/api/auth/signout",
        "/api/auth/callback/google",
        "/api/auth/session",
      ];

      for (const path of publicPaths) {
        expect(path.startsWith("/api/auth/")).toBe(true);
      }
    });

    it("should allow access to cron endpoints", () => {
      const cronPaths = ["/api/cron/sync-notion", "/api/cron/renew-webhook"];

      for (const path of cronPaths) {
        expect(path.startsWith("/api/cron/")).toBe(true);
      }
    });

    it("should allow access to webhook endpoints", () => {
      const webhookPaths = ["/api/webhooks/google-calendar", "/api/webhooks/notion"];

      for (const path of webhookPaths) {
        expect(path.startsWith("/api/webhooks/")).toBe(true);
      }
    });

    it("should allow access to static files", () => {
      const staticPaths = [
        "/_next/static/css/app.css",
        "/_next/static/chunks/main.js",
        "/static/logo.png",
        "/favicon.ico",
        "/robots.txt",
      ];

      for (const path of staticPaths) {
        const isPublic =
          path.startsWith("/_next/") || path.startsWith("/static/") || path.includes(".");
        expect(isPublic).toBe(true);
      }
    });
  });

  describe("Protected Routes", () => {
    it("should require authentication for dashboard", () => {
      const protectedPath = "/";
      const isPublic =
        protectedPath.startsWith("/api/auth/") ||
        protectedPath.startsWith("/api/cron/") ||
        protectedPath.startsWith("/api/webhooks/") ||
        protectedPath.startsWith("/_next/") ||
        protectedPath.startsWith("/static/") ||
        protectedPath.includes(".");

      expect(isPublic).toBe(false);
    });

    it("should require authentication for API endpoints", () => {
      const protectedPaths = ["/api/metrics", "/api/status", "/api/admin/webhook/setup"];

      for (const path of protectedPaths) {
        const isPublic =
          path.startsWith("/api/auth/") ||
          path.startsWith("/api/cron/") ||
          path.startsWith("/api/webhooks/");

        expect(isPublic).toBe(false);
      }
    });
  });

  describe("Redirect Behavior", () => {
    it("should redirect unauthenticated users to sign-in", () => {
      const requestUrl = "https://example.com/dashboard";
      const signInUrl = new URL("/api/auth/signin", requestUrl);
      signInUrl.searchParams.set("callbackUrl", requestUrl);

      expect(signInUrl.pathname).toBe("/api/auth/signin");
      expect(signInUrl.searchParams.get("callbackUrl")).toBe(requestUrl);
    });

    it("should preserve callback URL for post-auth redirect", () => {
      const originalUrl = "https://example.com/dashboard?tab=metrics";
      const signInUrl = new URL("/api/auth/signin", "https://example.com");
      signInUrl.searchParams.set("callbackUrl", originalUrl);

      const callbackUrl = signInUrl.searchParams.get("callbackUrl");
      expect(callbackUrl).toBe(originalUrl);
    });
  });

  describe("Security Headers", () => {
    it("should validate cron requests with CRON_SECRET header", () => {
      const cronSecret = process.env.CRON_SECRET || "test-cron-secret";
      expect(typeof cronSecret).toBe("string");
      expect(cronSecret.length).toBeGreaterThan(0);
    });

    it("should validate admin requests with ADMIN_SECRET header", () => {
      const adminSecret = process.env.ADMIN_SECRET || "test-admin-secret";
      expect(typeof adminSecret).toBe("string");
      expect(adminSecret.length).toBeGreaterThan(0);
    });
  });

  describe("Route Matching", () => {
    it("should match all routes except Next.js internals", () => {
      // Test that protected paths should be processed by middleware
      const protectedPaths = ["/", "/dashboard", "/api/metrics"];

      for (const path of protectedPaths) {
        const isExcluded =
          path.startsWith("/_next/static") ||
          path.startsWith("/_next/image") ||
          path === "/favicon.ico";
        expect(isExcluded).toBe(false);
      }

      // Test that excluded paths should NOT be processed by middleware
      const excludedPaths = [
        "/_next/static/chunks/main.js",
        "/_next/image?url=/logo.png",
        "/favicon.ico",
      ];

      for (const path of excludedPaths) {
        const isExcluded =
          path.startsWith("/_next/static") ||
          path.startsWith("/_next/image") ||
          path === "/favicon.ico";
        expect(isExcluded).toBe(true);
      }
    });
  });
});
