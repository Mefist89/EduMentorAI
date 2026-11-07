import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        // Server Components must receive the refreshed token, too.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        const previousCookies = response.cookies.getAll();
        const previousCacheHeaders = new Headers();
        for (const name of ["cache-control", "expires", "pragma"]) {
          const value = response.headers.get(name);
          if (value) previousCacheHeaders.set(name, value);
        }
        response = NextResponse.next({ request });

        // Preserve earlier writes if the SDK emits more than one cookie batch.
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        previousCacheHeaders.forEach((value, name) =>
          response.headers.set(name, value),
        );
        Object.entries(cacheHeaders).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });

  // Creating the client alone does not load or refresh an existing session.
  // The demo is public: no session is required and no login redirect is added.
  await supabase.auth.getClaims();

  return response;
}
