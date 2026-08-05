export type AuthUserLike = { id: string } | null;

/**
 * Single source of truth for Header / cart CTA auth appearance.
 * A valid browser session must look signed-in on every route.
 */
export function isClientSignedIn(options: {
  configured: boolean;
  ready: boolean;
  user: AuthUserLike;
}): boolean {
  return options.configured && options.ready && options.user !== null;
}

export type CartCheckoutCta = "loading" | "login_required" | "checkout";

export function resolveCartCheckoutCta(options: {
  pending: boolean;
  ready: boolean;
  user: AuthUserLike;
}): CartCheckoutCta {
  if (options.pending) return "loading";
  if (options.ready && !options.user) return "login_required";
  return "checkout";
}
