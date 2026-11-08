import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(new URL("../.env.local", import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key.startsWith("sb_publishable_")) throw new Error("Private Supabase configuration missing.");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const name = "edumentor-practices";
const { data, error } = await client.storage.listBuckets();
if (error) throw new Error("Cannot inspect practice storage.");
const existing = data.find(b => b.id === name);
if (existing?.public) throw new Error("Practices must use a private bucket.");
if (!existing) {
  const { error } = await client.storage.createBucket(name, { public: false, fileSizeLimit: 4 * 1024 * 1024, allowedMimeTypes: ["application/json"] });
  if (error) throw new Error("Cannot create private practice storage.");
}
const { error: listing } = await client.storage.from(name).list("entries", { limit: 1 });
if (listing) throw new Error("Cannot verify private practice storage.");
console.log("Verified private practice storage. No examples published or existing practices changed.");
