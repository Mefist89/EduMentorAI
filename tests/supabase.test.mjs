import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { NextRequest } from "next/server.js";

const require = createRequire(import.meta.url);
const config = {
  url: "https://example.supabase.co",
  publishableKey: "sb_publishable_test",
};
const configDependency = { getSupabaseConfig: () => config };

// Compile the actual helpers and substitute only framework/SDK boundaries.
// No real accounts, tokens, network writes or external test runner are needed.
function loadSource(path, dependencies = {}, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: (name) =>
      Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    process: { env: {} },
    Headers,
    URL,
    AbortSignal,
    ...globals,
  });
  vm.runInContext(outputText, context, { filename: path });
  return module.exports;
}

test("configuration reports missing values and rejects non-publishable keys", () => {
  const missing = loadSource("src/utils/supabase/config.ts");
  assert.throws(
    () => missing.getSupabaseConfig(),
    /Configure NEXT_PUBLIC_SUPABASE_URL/,
  );
  const invalid = loadSource(
    "src/utils/supabase/config.ts",
    {},
    {
      process: {
        env: {
          NEXT_PUBLIC_SUPABASE_URL: config.url,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test",
        },
      },
    },
  );
  assert.throws(() => invalid.getSupabaseConfig(), /publishable key/);
  const valid = loadSource(
    "src/utils/supabase/config.ts",
    {},
    {
      process: {
        env: {
          NEXT_PUBLIC_SUPABASE_URL: config.url,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.publishableKey,
        },
      },
    },
  );
  assert.equal(valid.getSupabaseConfig().url, config.url);
});

test("browser helper supplies the configured URL and publishable key", () => {
  let actual;
  const browser = loadSource("src/utils/supabase/client.ts", {
    "./config": configDependency,
    "@supabase/ssr": {
      createBrowserClient: (...args) => {
        actual = args;
        return "browser-client";
      },
    },
  });
  assert.equal(browser.createClient(), "browser-client");
  assert.deepEqual(actual, [config.url, config.publishableKey]);
});

test("server helper isolates clients per request and forwards cookie options", async () => {
  const stores = [{ id: "first" }, { id: "second" }];
  const writes = [];
  const options = [];
  const server = loadSource("src/utils/supabase/server.ts", {
    "./config": configDependency,
    "next/headers": {
      cookies: async () => {
        const store = stores.shift();
        return { getAll: () => [store], set: (...args) => writes.push(args) };
      },
    },
    "@supabase/ssr": {
      createServerClient: (_url, _key, value) => {
        options.push(value);
        return { request: options.length };
      },
    },
  });
  const first = await server.createClient();
  const second = await server.createClient();
  assert.notEqual(first, second);
  assert.equal(options[0].cookies.getAll()[0].id, "first");
  assert.equal(options[1].cookies.getAll()[0].id, "second");
  const cookieOptions = { path: "/", sameSite: "lax", secure: true };
  options[0].cookies.setAll([
    { name: "session", value: "refreshed", options: cookieOptions },
  ]);
  assert.deepEqual(writes[0], ["session", "refreshed", cookieOptions]);
});

test("server components tolerate read-only cookie storage", async () => {
  let cookies;
  const server = loadSource("src/utils/supabase/server.ts", {
    "./config": configDependency,
    "next/headers": {
      cookies: async () => ({
        getAll: () => [],
        set: () => {
          throw new Error("Read only");
        },
      }),
    },
    "@supabase/ssr": {
      createServerClient: (_url, _key, options) => {
        cookies = options.cookies;
        return {};
      },
    },
  });
  await server.createClient();
  assert.doesNotThrow(() =>
    cookies.setAll([{ name: "session", value: "new", options: {} }]),
  );
});

test("proxy refreshes claims and propagates cookie batches and cache protection", async () => {
  let claimsCalls = 0;
  const session = loadSource("src/utils/supabase/middleware.ts", {
    "./config": configDependency,
    "@supabase/ssr": {
      createServerClient: (_url, _key, { cookies }) => ({
        auth: {
          getClaims: async () => {
            claimsCalls++;
            assert.equal(
              cookies.getAll().find((cookie) => cookie.name === "session")
                .value,
              "old",
            );
            cookies.setAll(
              [
                {
                  name: "session",
                  value: "fresh",
                  options: { path: "/", httpOnly: true, sameSite: "lax" },
                },
              ],
              {
                "Cache-Control": "private, no-store",
                Expires: "0",
                Pragma: "no-cache",
              },
            );
            cookies.setAll(
              [
                {
                  name: "session-extra",
                  value: "second-batch",
                  options: { path: "/" },
                },
              ],
              {},
            );
            return { data: { claims: { sub: "test-user" } }, error: null };
          },
        },
      }),
    },
  });
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: "session=old" },
  });
  const response = await session.updateSession(request);
  assert.equal(claimsCalls, 1);
  assert.equal(request.cookies.get("session").value, "fresh");
  assert.equal(response.cookies.get("session").value, "fresh");
  assert.equal(response.cookies.get("session").httpOnly, true);
  assert.equal(response.cookies.get("session-extra").value, "second-batch");
  assert.match(
    response.headers.get("x-middleware-request-cookie"),
    /session=fresh/,
  );
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("expires"), "0");
  assert.equal(response.headers.get("pragma"), "no-cache");
});

test("anonymous requests keep the demonstration accessible without redirects", async () => {
  let claimsCalls = 0;
  const session = loadSource("src/utils/supabase/middleware.ts", {
    "./config": configDependency,
    "@supabase/ssr": {
      createServerClient: () => ({
        auth: {
          getClaims: async () => {
            claimsCalls++;
            return { data: null, error: null };
          },
        },
      }),
    },
  });
  const response = await session.updateSession(
    new NextRequest("http://localhost/"),
  );
  assert.equal(claimsCalls, 1);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.cookies.getAll().length, 0);
});

function healthRoute(fetch) {
  return loadSource(
    "src/app/api/health/supabase/route.ts",
    {
      "@/utils/supabase/config": configDependency,
      "@/utils/supabase/server": {
        createClient: async () => ({
          auth: { getClaims: async () => ({ data: null, error: null }) },
        }),
      },
    },
    { fetch },
  );
}

test("health check contacts Supabase even when there is no signed-in user", async () => {
  const health = healthRoute(async (url, options) => {
    assert.equal(String(url), "https://example.supabase.co/auth/v1/settings");
    assert.equal(options.headers.apikey, config.publishableKey);
    assert.equal(options.cache, "no-store");
    return { ok: true };
  });
  const response = await health.GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "supabase",
    auth: "reachable",
  });
});

test("health check returns 503 for a rejected key or network failure without leaking details", async () => {
  for (const fetch of [
    async () => ({ ok: false }),
    async () => {
      throw new Error("Sensitive provider details");
    },
  ]) {
    const response = await healthRoute(fetch).GET();
    assert.equal(response.status, 503);
    const body = await response.text();
    assert.ok(!body.includes(config.publishableKey));
    assert.ok(!body.includes("Sensitive provider details"));
  }
});
