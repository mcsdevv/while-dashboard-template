/**
 * Token Health Utilities
 * Provides functions to calculate token age and health status for Google OAuth.
 */

export interface TokenHealthStatus {
  status: "healthy" | "warning" | "critical";
  message: string;
  action?: string;
}

/**
 * Calculate days since connection for token health.
 * @param connectedAt - ISO date string of when the connection was established
 * @returns Number of days since connection, or null if connectedAt is null/invalid
 */
export function getDaysSinceConnection(connectedAt: string | null): number | null {
  if (!connectedAt) return null;
  const connected = new Date(connectedAt);
  if (Number.isNaN(connected.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - connected.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get token health status based on connection date.
 * Google OAuth tokens in "Testing" mode expire after 7 days.
 *
 * @param connectedAt - ISO date string of when the connection was established
 * @returns Token health status with message and optional action, or null if no date
 */
export function getTokenHealth(connectedAt: string | null): TokenHealthStatus | null {
  const days = getDaysSinceConnection(connectedAt);
  if (days === null) return null;

  if (days >= 7) {
    return {
      status: "critical",
      message: `Token may have expired (${days} days old)`,
      action: "Reconnect now to restore sync",
    };
  }
  if (days >= 5) {
    return {
      status: "warning",
      message: `Token expires in ~${7 - days} days`,
      action: "Consider reconnecting soon",
    };
  }
  return {
    status: "healthy",
    message: `Token healthy (${days} days old)`,
  };
}

/**
 * Check if token has survived past the 7-day testing mode limit.
 * If true, the OAuth app is likely published (or user is a test user).
 * UI should prompt user to confirm their app is published.
 *
 * @param connectedAt - ISO date string of when the connection was established
 * @returns true if token is 8+ days old, suggesting app may be published
 */
export function shouldPromptPublishedStatus(connectedAt: string | null): boolean {
  const days = getDaysSinceConnection(connectedAt);
  return days !== null && days >= 8;
}
