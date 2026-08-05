"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type AuthUserSummary = {
  id: string;
  email: string | null;
};

type AuthContextValue = {
  configured: boolean;
  ready: boolean;
  user: AuthUserSummary | null;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toSummary(user: {
  id: string;
  email?: string | null;
} | null): AuthUserSummary | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

/**
 * Cookie sessions and client sign-in must share one React auth state.
 * Prefer the session from onAuthStateChange; getUser() hydrates from cookies.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const pathname = usePathname();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<AuthUserSummary | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setReady(true);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user: current },
    } = await supabase.auth.getUser();
    setUser(toSummary(current));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!configured) {
      setUser(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    const supabase = createBrowserSupabaseClient();

    async function syncFromCookies() {
      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(toSummary(current));
      setReady(true);
    }

    void syncFromCookies();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Apply the event session immediately — do not discard it and re-fetch,
      // or a SIGNED_IN from client login can be overwritten by a stale getUser().
      if (cancelled) return;
      setUser(toSummary(session?.user ?? null));
      setReady(true);
    });

    const onFocus = () => {
      void syncFromCookies();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [configured]);

  // Re-hydrate from cookies on route changes (soft navigations).
  useEffect(() => {
    if (!configured) return;
    void refresh();
  }, [pathname, configured, refresh]);

  return (
    <AuthContext.Provider value={{ configured, ready, user, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
