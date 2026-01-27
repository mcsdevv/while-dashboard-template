import { z } from "zod";

const envSchema = z.object({
  // Notion (optional - can be configured via settings UI)
  NOTION_API_TOKEN: z.string().optional(),
  NOTION_DATABASE_ID: z.string().optional(),

  // Google OAuth (single client for auth + calendar access)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Settings encryption (required for storing credentials in Redis)
  SETTINGS_ENCRYPTION_KEY: z.string().optional(),

  // Webhooks
  WEBHOOK_URL: z.string().url().optional(),
  ADMIN_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),

  // NextAuth (optional at build time - validated at runtime when auth is used)
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Authorization - at least one must be set for auth to work
  // AUTHORIZED_EMAILS: Comma-separated list of emails or patterns
  //   - Exact emails: user@gmail.com
  //   - Wildcard patterns: *@company.com (matches any email from that domain)
  AUTHORIZED_EMAILS: z
    .string()
    .optional()
    .transform((str) =>
      str
        ?.split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),

  // Optional
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = getEnv();

/**
 * Check if auth environment variables are configured.
 * Use this before requiring auth functionality.
 */
export function isAuthConfigured(): boolean {
  const hasAuthCore = Boolean(
    env.NEXTAUTH_SECRET && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
  );

  // At least one authorization method must be configured
  const hasAuthorization = (env.AUTHORIZED_EMAILS?.length ?? 0) > 0;

  return hasAuthCore && hasAuthorization;
}

/**
 * Check if an email is authorized based on configured env vars.
 * Supports exact emails and wildcard patterns (*@domain.com).
 */
export function isEmailAuthorized(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const emailDomain = normalizedEmail.split("@")[1];

  // Check exact emails and wildcard patterns in AUTHORIZED_EMAILS
  const authorizedEmails = env.AUTHORIZED_EMAILS ?? [];
  for (const pattern of authorizedEmails) {
    if (pattern.startsWith("*@")) {
      // Wildcard pattern: *@domain.com
      const patternDomain = pattern.slice(2);
      if (emailDomain === patternDomain) {
        return true;
      }
    } else if (pattern === normalizedEmail) {
      // Exact email match
      return true;
    }
  }

  return false;
}

/**
 * Get required auth env vars, throwing a helpful error if missing.
 * Call this at runtime when auth is actually needed.
 */
export function requireAuthEnv(): {
  NEXTAUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
} {
  const missing: string[] = [];
  if (!env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET");
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");

  // Check that at least one authorization method is configured
  const hasAuthorization = (env.AUTHORIZED_EMAILS?.length ?? 0) > 0;

  if (!hasAuthorization) {
    missing.push("AUTHORIZED_EMAILS");
  }

  if (missing.length > 0) {
    throw new Error(
      `Auth not configured. Missing environment variables: ${missing.join(", ")}. Please complete the setup wizard or set these variables in your environment.`,
    );
  }

  return {
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET!,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET!,
  };
}

/**
 * Get Google OAuth client credentials.
 * Used by both NextAuth and Calendar API.
 */
export function getGoogleClientConfig(): { clientId: string; clientSecret: string } | null {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return null;
  }
  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}
