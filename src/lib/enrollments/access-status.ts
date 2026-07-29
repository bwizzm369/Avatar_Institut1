/**
 * Post-checkout access UI state helpers.
 * Enrollment grants happen only via verified Stripe webhook — never from this page.
 */

export type AccessUiState = "waiting" | "activated" | "delayed";

export const ACCESS_POLL_INTERVAL_MS = 5_000;
export const ACCESS_POLL_MAX_MS = 60_000;

export type AccessStatusPayload = {
  activated: boolean;
  courseSlug: string | null;
};

/**
 * Derives the visible success-page state from poll results and elapsed time.
 * Does not grant access — only interprets read-only enrollment checks.
 */
export function deriveAccessUiState(input: {
  activated: boolean;
  elapsedMs: number;
  maxWaitMs?: number;
}): AccessUiState {
  if (input.activated) {
    return "activated";
  }
  const maxWaitMs = input.maxWaitMs ?? ACCESS_POLL_MAX_MS;
  if (input.elapsedMs >= maxWaitMs) {
    return "delayed";
  }
  return "waiting";
}
