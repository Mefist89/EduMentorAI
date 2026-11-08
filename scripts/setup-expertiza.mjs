import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  EXPERTIZA_BUCKET,
  EXPERTIZA_SEED,
  validateSeed,
} from "../src/features/expertiza/shared.ts";

process.loadEnvFile(new URL("../.env.local", import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key.startsWith("sb_publishable_"))
  throw new Error("Configure the private Supabase key locally.");
const raw = readFileSync(
    new URL("../src/features/expertiza/data/seed.json", import.meta.url),
    "utf8",
  ),
  seed = validateSeed(JSON.parse(raw));
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: buckets, error: listing } = await client.storage.listBuckets();
if (listing) throw new Error("Cannot inspect Storage.");
const existing = buckets.find((b) => b.id === EXPERTIZA_BUCKET);
if (existing?.public) throw new Error("Expertiza bucket must remain private.");
if (!existing) {
  const { error } = await client.storage.createBucket(EXPERTIZA_BUCKET, {
    public: false,
    fileSizeLimit: 512 * 1024,
    allowedMimeTypes: ["application/json"],
  });
  if (error) throw new Error("Cannot create private Expertiza bucket.");
}
const storage = client.storage.from(EXPERTIZA_BUCKET);
const { error } = await storage.upload(EXPERTIZA_SEED, raw, {
  contentType: "application/json",
  upsert: true,
  cacheControl: "0",
});
if (error) throw new Error("Cannot upload Expertiza catalog.");
const { data, error: read } = await storage.download(EXPERTIZA_SEED);
if (read || !data) throw new Error("Cannot verify Expertiza catalog.");
const digest = (value) => createHash("sha256").update(value).digest("hex");
if (digest(await data.text()) !== digest(raw))
  throw new Error("Expertiza verification mismatch.");
console.log(
  `Verified private Expertiza catalog: ${seed.teachers.length} teacher examples, ${seed.communities.length} communities, ${seed.questions.length} questions. SHA-256 ${digest(raw)}`,
);
