import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

process.loadEnvFile(new URL("../.env.local", import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret || secret.startsWith("sb_publishable_")) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and a private SUPABASE_SECRET_KEY in .env.local.",
  );
  process.exit(1);
}
const client = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const outputPath = fileURLToPath(
  new URL("../.env.demo-users.json", import.meta.url),
);
const marker = "edumentor-demo-v1";
const roles = ["administrator", "profesor", "elev"];
const manifest = existsSync(outputPath)
  ? JSON.parse(readFileSync(outputPath, "utf8"))
  : {
      projectUrl: url,
      accounts: roles.map((role) => ({
        login: role,
        email: `${role}@edumentor.example`,
        role,
        password: `Em!${randomBytes(20).toString("base64url")}`,
        status: "pending",
      })),
    };
if (manifest.projectUrl !== url || manifest.accounts.length !== 3)
  throw new Error(
    "Credential manifest belongs to another project or has invalid contents.",
  );

function save() {
  writeFileSync(`${outputPath}.tmp`, JSON.stringify(manifest, null, 2) + "\n", {
    mode: 0o600,
  });
  renameSync(`${outputPath}.tmp`, outputPath);
}

// Only the three fixed identities are inspected. Existing unrelated accounts are never changed.
const found = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await client.auth.admin.listUsers({
    page,
    perPage: 100,
  });
  if (error) throw new Error(`Cannot list Auth users (${error.status}).`);
  for (const user of data.users)
    if (roles.some((role) => user.email === `${role}@edumentor.example`))
      found.set(user.email, user);
  if (data.users.length < 100) break;
}
for (const account of manifest.accounts) {
  if (
    !roles.includes(account.role) ||
    account.email !== `${account.role}@edumentor.example`
  )
    throw new Error("Unexpected identity in credential manifest.");
  const existing = found.get(account.email);
  if (
    existing &&
    (existing.app_metadata?.edumentor_seed !== marker ||
      existing.app_metadata?.edumentor_role !== account.role)
  )
    throw new Error(
      `Refusing to overwrite an existing account: ${account.login}`,
    );
}
save();
for (const account of manifest.accounts) {
  const existing = found.get(account.email);
  if (existing) {
    // Recover after a network interruption only if the saved password really works.
    const { data, error } = await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    if (error || data.user?.id !== existing.id)
      throw new Error(
        `Existing ${account.login} credentials do not match. No password was changed.`,
      );
    await client.auth.signOut({ scope: "local" });
    account.id = existing.id;
  } else {
    const { data, error } = await client.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      app_metadata: { edumentor_role: account.role, edumentor_seed: marker },
    });
    if (error || !data.user)
      throw new Error(
        `Cannot create ${account.login} (${error?.status ?? "no user"}).`,
      );
    account.id = data.user.id;
  }
  account.status = "created";
  save();
  const verifier = createClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await verifier.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  if (
    error ||
    data.user?.id !== account.id ||
    data.user.app_metadata?.edumentor_role !== account.role
  )
    throw new Error(`Login verification failed for ${account.login}.`);
  await verifier.auth.signOut({ scope: "local" });
  console.log(`Verified password login: ${account.login} (${account.role})`);
}
console.log(
  `Credentials saved locally to ${outputPath}; excluded from Git. No passwords printed.`,
);
