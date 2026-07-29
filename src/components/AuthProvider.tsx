"use client";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
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
    setUser(
      current
        ? { id: current.id, email: current.email ?? null }
        : null,
    );
    setReady(true);
  }, []);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }

    let cancelled = false;
    const supabase = createBrowserSupabaseClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(
        data.user
          ? { id: data.user.id, email: data.user.email ?? null }
          : null,
      );
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? { id: session.user.id, email: session.user.email ?? null }
          : null,
      );
      setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured]);

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
