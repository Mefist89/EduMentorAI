import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(new URL("../.env.local", import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key.startsWith("sb_publishable_")) throw new Error("Private Supabase configuration missing.");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const name = "edumentor-cohorts";
const { data, error } = await client.storage.listBuckets();
if (error) throw new Error("Cannot inspect cohort storage.");
const existing = data.find(b => b.id === name);
if (existing?.public) throw new Error("Cohorts must use private storage.");
if (!existing) {
  const { error } = await client.storage.createBucket(name, { public: false, fileSizeLimit: 256 * 1024, allowedMimeTypes: ["application/json"] });
  if (error) throw new Error("Cannot create private cohort storage.");
}
const { error: readError } = await client.storage.from(name).list("groups", { limit: 1 });
if (readError) throw new Error("Cannot verify cohort storage.");
console.log("Verified private Supabase cohort storage. No groups or user accounts created.");
