/**
 * Read the Auth session identifier from a validated access token.
 * Prefer JWT `session_id` so token refresh does not force a new code.
 */
export function extractAuthSessionId(
  accessToken: string | null | undefined,
): string | null {
  if (!accessToken) {
    return null;
  }
  const parts = accessToken.split(".");
  if (parts.length < 2 || !parts[1]) {
    return null;
  }
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { session_id?: unknown; sub?: unknown };
    if (typeof payload.session_id === "string" && payload.session_id.trim()) {
      return payload.session_id.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveAdminVerificationSessionId(options: {
  userId: string;
  accessToken?: string | null;
}): string {
  return extractAuthSessionId(options.accessToken) ?? `user:${options.userId}`;
}
