import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const { url, publishableKey } = getSupabaseConfig();
    const supabase = await createClient();
    await supabase.auth.getClaims();

    // This endpoint checks the actual key against Auth, even without a session.
    // A token-less getClaims() call alone would not prove network connectivity.
    const response = await fetch(new URL("/auth/v1/settings", url), {
      headers: { apikey: publishableKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", service: "supabase", auth: "unreachable" },
        { status: 503, headers },
      );
    }

    return NextResponse.json(
      { status: "ok", service: "supabase", auth: "reachable" },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { status: "error", service: "supabase", auth: "unreachable" },
      { status: 503, headers },
    );
  }
}
