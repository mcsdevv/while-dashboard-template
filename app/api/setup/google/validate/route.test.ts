import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

// Mock the env module
vi.mock("@/lib/env", () => ({
  getGoogleClientConfig: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { getGoogleClientConfig } from "@/lib/env";

const mockGetGoogleClientConfig = vi.mocked(getGoogleClientConfig);

describe("GET /api/setup/google/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("not_configured error", () => {
    it("returns not_configured when credentials are missing", async () => {
      mockGetGoogleClientConfig.mockReturnValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        valid: false,
        error: "not_configured",
        details: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are not set.",
      });
    });
  });

  describe("invalid_client_id_format error", () => {
    it("returns error when client ID does not end with .apps.googleusercontent.com", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789-abc.apps.google.com", // Wrong suffix (Desktop client format)
        clientSecret: "GOCSPX-validclientsecret123",
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.error).toBe("invalid_client_id_format");
      expect(data.details).toContain("Web Application OAuth client");
      expect(data.details).toContain(".apps.googleusercontent.com");
    });

    it("catches Desktop app client ID format", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789012-abcdefghijklmnop.apps.google.com",
        clientSecret: "GOCSPX-validclientsecret123",
      });

      const response = await GET();
      const data = await response.json();

      expect(data.valid).toBe(false);
      expect(data.error).toBe("invalid_client_id_format");
    });

    it("catches completely invalid client ID", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "not-a-valid-client-id",
        clientSecret: "GOCSPX-validclientsecret123",
      });

      const response = await GET();
      const data = await response.json();

      expect(data.valid).toBe(false);
      expect(data.error).toBe("invalid_client_id_format");
    });
  });

  describe("invalid_client_secret error", () => {
    it("returns error when client secret is too short", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789012-abcdefghijklmnop.apps.googleusercontent.com",
        clientSecret: "short", // Less than 10 characters
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.error).toBe("invalid_client_secret");
      expect(data.details).toContain("copied the full secret");
    });

    it("catches truncated/incomplete secret", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789012-abcdefghijklmnop.apps.googleusercontent.com",
        clientSecret: "GOCSPX-", // Truncated
      });

      const response = await GET();
      const data = await response.json();

      expect(data.valid).toBe(false);
      expect(data.error).toBe("invalid_client_secret");
    });

    it("catches empty string secret", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789012-abcdefghijklmnop.apps.googleusercontent.com",
        clientSecret: "",
      });

      const response = await GET();
      const data = await response.json();

      expect(data.valid).toBe(false);
      expect(data.error).toBe("invalid_client_secret");
    });

    it("accepts secret with exactly 10 characters", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789012-abcdefghijklmnop.apps.googleusercontent.com",
        clientSecret: "1234567890", // Exactly 10 characters
      });
      mockFetch.mockResolvedValue({ status: 400 }); // Expected response

      const response = await GET();
      const data = await response.json();

      expect(data.valid).toBe(true);
    });
  });

  describe("invalid_client error (Google validation)", () => {
    it("returns error when Google returns 401", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789012-abcdefghijklmnop.apps.googleusercontent.com",
        clientSecret: "GOCSPX-validclientsecret123",
      });
      mockFetch.mockResolvedValue({ status: 401 });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.error).toBe("invalid_client");
      expect(data.details).toContain("Google did not recognize");
    });
  });

  describe("valid credentials", () => {
    it("returns valid when all checks pass (Google returns 400)", async () => {
      const clientId = "123456789012-abcdefghijklmnop.apps.googleusercontent.com";
      mockGetGoogleClientConfig.mockReturnValue({
        clientId,
        clientSecret: "GOCSPX-validclientsecret123",
      });
      mockFetch.mockResolvedValue({ status: 400 }); // 400 = invalid token (expected)

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      // First 20 chars: "123456789012-abcdefg" + "..."
      expect(data.clientId).toBe("123456789012-abcdefg...");
    });

    it("returns valid when all checks pass (Google returns 200)", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789012-abcdefghijklmnop.apps.googleusercontent.com",
        clientSecret: "GOCSPX-validclientsecret123",
      });
      mockFetch.mockResolvedValue({ status: 200 }); // Unexpected but not an error

      const response = await GET();
      const data = await response.json();

      expect(data.valid).toBe(true);
    });

    it("returns valid when Google check fails due to network error", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789012-abcdefghijklmnop.apps.googleusercontent.com",
        clientSecret: "GOCSPX-validclientsecret123",
      });
      mockFetch.mockRejectedValue(new Error("Network error"));

      const response = await GET();
      const data = await response.json();

      // Network errors are gracefully ignored - credentials might still be valid
      expect(data.valid).toBe(true);
    });

    it("truncates client ID for debugging", async () => {
      const longClientId = "12345678901234567890123456789.apps.googleusercontent.com";
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: longClientId,
        clientSecret: "GOCSPX-validclientsecret123",
      });
      mockFetch.mockResolvedValue({ status: 400 });

      const response = await GET();
      const data = await response.json();

      // substring(0, 20) = "12345678901234567890" + "..."
      expect(data.clientId).toBe("12345678901234567890...");
      expect(data.clientId.length).toBe(23); // 20 chars + "..."
    });
  });

  describe("validation_error (unexpected exceptions)", () => {
    it("returns 500 when getGoogleClientConfig throws", async () => {
      mockGetGoogleClientConfig.mockImplementation(() => {
        throw new Error("Unexpected error in env parsing");
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.valid).toBe(false);
      expect(data.error).toBe("validation_error");
      expect(data.details).toBe("Unexpected error in env parsing");
    });

    it("handles non-Error exceptions", async () => {
      mockGetGoogleClientConfig.mockImplementation(() => {
        throw "string error";
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.valid).toBe(false);
      expect(data.error).toBe("validation_error");
      expect(data.details).toBe("Failed to validate credentials");
    });
  });

  describe("Google OAuth metadata check", () => {
    it("calls tokeninfo endpoint with invalid token", async () => {
      mockGetGoogleClientConfig.mockReturnValue({
        clientId: "123456789012-abcdefghijklmnop.apps.googleusercontent.com",
        clientSecret: "GOCSPX-validclientsecret123",
      });
      mockFetch.mockResolvedValue({ status: 400 });

      await GET();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=invalid",
      );
    });
  });
});
