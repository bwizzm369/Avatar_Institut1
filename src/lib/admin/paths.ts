export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_VERIFY_PATH = "/admin/verify";
export const ADMIN_HOME_PATH = "/admin";

export function adminVerifyRedirect(nextPath?: string | null): string {
  if (!nextPath || nextPath === ADMIN_HOME_PATH) {
    return ADMIN_VERIFY_PATH;
  }
  return `${ADMIN_VERIFY_PATH}?next=${encodeURIComponent(nextPath)}`;
}
