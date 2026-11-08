import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  CATALOG_PATH,
  TRASEE_BUCKET,
  validateCatalog,
} from "../src/features/trasee/shared/catalog.ts";

process.loadEnvFile(new URL("../.env.local", import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key.startsWith("sb_publishable_"))
  throw new Error("Configure the private Supabase key locally.");
const raw = readFileSync(
  new URL("../src/features/trasee/data/catalog.json", import.meta.url),
  "utf8",
);
const catalog = validateCatalog(JSON.parse(raw));
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: buckets, error: listingError } =
  await client.storage.listBuckets();
if (listingError) throw new Error("Cannot inspect Storage buckets.");
const existing = buckets.find((b) => b.id === TRASEE_BUCKET);
if (existing?.public)
  throw new Error(
    "The Trasee bucket must be private. No access settings were changed.",
  );
if (!existing) {
  const { error } = await client.storage.createBucket(TRASEE_BUCKET, {
    public: false,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["application/json"],
  });
  if (error) throw new Error("Cannot create private Trasee bucket.");
}
const { error } = await client.storage
  .from(TRASEE_BUCKET)
  .upload(CATALOG_PATH, raw, {
    contentType: "application/json",
    upsert: true,
    cacheControl: "0",
  });
if (error) throw new Error("Cannot upload the catalog.");
const { data, error: readError } = await client.storage
  .from(TRASEE_BUCKET)
  .download(CATALOG_PATH);
if (readError || !data) throw new Error("Cannot verify the uploaded catalog.");
const downloaded = await data.text();
const digest = (value) => createHash("sha256").update(value).digest("hex");
if (digest(downloaded) !== digest(raw))
  throw new Error("Catalog verification mismatch.");
console.log(
  `Verified private Supabase catalog: ${catalog.courses.length} courses, ${catalog.providers.length} providers; SHA-256 ${digest(raw)}.`,
);
