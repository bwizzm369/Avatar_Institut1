import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type SessionCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Refreshes the Auth session cookies when Supabase is configured.
 * Returns the response and whether a user session exists.
 * Optional requestHeaders are forwarded on NextResponse.next (e.g. x-pathname).
 */
export async function updateSession(
  request: NextRequest,
  requestHeaders?: Headers,
): Promise<{
  response: NextResponse;
  userId: string | null;
  configured: boolean;
  cookiesToApply: SessionCookie[];
}> {
  const buildNext = (headers: Headers) =>
    NextResponse.next({
      request: {
        headers,
      },
    });

  let headersForRequest = requestHeaders
    ? new Headers(requestHeaders)
    : new Headers(request.headers);
  let response = buildNext(headersForRequest);
  let cookiesToApply: SessionCookie[] = [];

  const config = getSupabasePublicConfig();
  if (!config) {
    return { response, userId: null, configured: false, cookiesToApply };
  }

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToApply = cookiesToSet;
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        headersForRequest = requestHeaders
          ? new Headers(requestHeaders)
          : new Headers(request.headers);
        response = buildNext(headersForRequest);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    response,
    userId: user?.id ?? null,
    configured: true,
    cookiesToApply,
  };
}

export function applySessionCookies(
  target: NextResponse,
  cookiesToApply: SessionCookie[],
): void {
  cookiesToApply.forEach(({ name, value, options }) => {
    target.cookies.set(name, value, options);
  });
}
