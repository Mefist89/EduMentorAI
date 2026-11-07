import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const table = process.argv[2];

if (!url || !key?.startsWith("sb_publishable_")) {
  console.error(
    "Configure the Supabase URL and publishable key in .env.local.",
  );
  process.exit(1);
}

try {
  const response = await fetch(new URL("/auth/v1/settings", url), {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(`Supabase Auth returned HTTP ${response.status}.`);
  console.log("Supabase Auth: HTTP 200. Publishable key accepted.");

  // Optional read-only Data API check. No rows are downloaded or changed.
  if (table) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(table))
      throw new Error("Use a simple public table name.");
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from(table).select("*").limit(0);
    if (error)
      throw new Error(
        `Data API check: ${error.code}. Verify the table, grants and RLS policies.`,
      );
    console.log("Data API query: successful (LIMIT 0; no row data read).");
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Supabase connection failed.",
  );
  process.exitCode = 1;
}
