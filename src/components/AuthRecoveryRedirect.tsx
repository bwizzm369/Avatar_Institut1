"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clientAuthRecoveryTarget } from "@/lib/auth/password-reset";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { markPasswordRecoveryAction } from "@/lib/auth/actions";

/**
 * Hash fragments (#error=..., #access_token=...) never reach the server.
 * Catch recovery errors and implicit tokens on any route, including /.
 */
export function AuthRecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const target = clientAuthRecoveryTarget({
      pathname,
      search: window.location.search,
      hash: window.location.hash,
    });
    if (!target) return;

    if (target.kind === "redirect") {
      router.replace(target.href);
      return;
    }

    if (!isSupabaseConfigured()) {
      router.replace("/login?error=config");
      return;
    }

    const accessToken = target.accessToken;
    const refreshToken = target.refreshToken;
    let cancelled = false;
    async function applyRecoverySession() {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (cancelled) return;
      if (error) {
        router.replace("/forgot-password?error=expired");
        return;
      }
      await markPasswordRecoveryAction();
      if (cancelled) return;
      router.replace("/update-password");
      router.refresh();
    }

    void applyRecoverySession();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
