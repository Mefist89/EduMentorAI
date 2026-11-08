import "server-only";
import { createClient } from "@supabase/supabase-js";

// This client never receives browser tokens. Callers must authorize the account
// and derive every private object path from the verified server-side user ID.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key.startsWith("sb_publishable_"))
    throw new Error("Private Supabase configuration is missing.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
