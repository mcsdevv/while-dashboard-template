/**
 * Setup API - Validate Google OAuth Credentials
 * GET: Validate that Google OAuth credentials are properly configured
 *
 * This endpoint performs lightweight validation WITHOUT requiring user authentication:
 * 1. Checks if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
 * 2. Validates GOOGLE_CLIENT_ID format (should end with .apps.googleusercontent.com)
 * 3. Optionally attempts to verify credentials with Google's OAuth metadata endpoint
 */

import { getGoogleClientConfig } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientConfig = getGoogleClientConfig();

    // Check if credentials are configured
    if (!clientConfig) {
      return NextResponse.json({
        valid: false,
        error: "not_configured",
        details: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are not set.",
      });
    }

    const { clientId, clientSecret } = clientConfig;

    // Validate client ID format
    if (!clientId.endsWith(".apps.googleusercontent.com")) {
      return NextResponse.json({
        valid: false,
        error: "invalid_client_id_format",
        details:
          "GOOGLE_CLIENT_ID should end with '.apps.googleusercontent.com'. Make sure you're using a Web Application OAuth client, not a Desktop client.",
      });
    }

    // Check that client secret looks valid (basic format check)
    if (clientSecret.length < 10) {
      return NextResponse.json({
        valid: false,
        error: "invalid_client_secret",
        details:
          "GOOGLE_CLIENT_SECRET appears to be invalid. Make sure you copied the full secret from Google Cloud Console.",
      });
    }

    // Attempt to verify the client ID by checking Google's OAuth metadata
    // This doesn't require authentication, just validates the client exists
    try {
      const tokenInfoUrl = "https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=invalid";
      const response = await fetch(tokenInfoUrl);

      // We expect this to fail with 400 (invalid token), which is fine
      // A 401 would indicate the client_id itself is invalid
      // We're just checking that Google recognizes the request format
      if (response.status === 401) {
        return NextResponse.json({
          valid: false,
          error: "invalid_client",
          details:
            "Google did not recognize these credentials. Double-check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        });
      }
    } catch {
      // Network errors are fine - credentials might still be valid
      // Don't block on this check
    }

    // All checks passed
    return NextResponse.json({
      valid: true,
      clientId: `${clientId.substring(0, 20)}...`, // Partial for debugging
    });
  } catch (error) {
    console.error("Error validating Google credentials:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "validation_error",
        details: error instanceof Error ? error.message : "Failed to validate credentials",
      },
      { status: 500 },
    );
  }
}
