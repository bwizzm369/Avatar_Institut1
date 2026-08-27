import type { AdminAccessResult } from "@/lib/admin/access";

export type CertificatePdfAccessDenial = {
  ok: false;
  status: 401 | 403 | 503;
  error: string;
};

export function denyCertificatePdfAccess(
  access: AdminAccessResult,
): CertificatePdfAccessDenial | null {
  if (access.status === "ok") return null;
  if (access.status === "unconfigured") {
    return { ok: false, status: 503, error: "Supabase is not configured." };
  }
  if (access.status === "unauthenticated") {
    return { ok: false, status: 401, error: "Authentication required." };
  }
  return { ok: false, status: 403, error: "Administrators only." };
}
