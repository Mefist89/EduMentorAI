import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(path, dependencies = {}) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require: (name) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return module.exports;
}
const accounts = load("src/lib/accounts.ts");
function authClient(user, error = null) {
  return { auth: { getUser: async () => ({ data: { user }, error }) } };
}
function auth(client) {
  return load("src/lib/auth.ts", {
    "server-only": {},
    react: { cache: (fn) => fn },
    "@/utils/supabase/server": { createClient: async () => client },
    "./accounts": accounts,
  });
}

test("login aliases are normalized and malformed identities are rejected", () => {
  assert.equal(
    accounts.loginEmail(" ADMIN "),
    "administrator@edumentor.example",
  );
  assert.equal(accounts.loginEmail("profesor"), "profesor@edumentor.example");
  assert.equal(accounts.loginEmail("elev"), "elev@edumentor.example");
  for (const value of [null, {}, "__proto__", "", "a@", "x".repeat(255)])
    assert.equal(accounts.loginEmail(value), null);
});

test("editable user metadata cannot grant a role", async () => {
  const user = {
    id: "test",
    app_metadata: {},
    user_metadata: { edumentor_role: "administrator", role: "administrator" },
  };
  assert.equal(await auth(authClient(user)).getAccount(), null);
  for (const role of ["administrator", "profesor", "elev"]) {
    const account = await auth(
      authClient({ ...user, app_metadata: { edumentor_role: role } }),
    ).getAccount();
    assert.equal(account.role, role);
    assert.equal(account.id, "test");
  }
});

test("missing, revoked, unknown-role and unavailable sessions fail closed", async () => {
  assert.equal(await auth(authClient(null)).getAccount(), null);
  assert.equal(
    await auth(
      authClient(
        { id: "x", app_metadata: { edumentor_role: "administrator" } },
        { message: "revoked" },
      ),
    ).getAccount(),
    null,
  );
  assert.equal(
    await auth(
      authClient({ id: "x", app_metadata: { edumentor_role: "owner" } }),
    ).getAccount(),
    null,
  );
  assert.equal(
    await auth({
      auth: {
        getUser: async () => {
          throw new Error("offline");
        },
      },
    }).getAccount(),
    null,
  );
});

function actions(client) {
  return load("src/app/login/actions.ts", {
    "next/navigation": {
      redirect: (path) => {
        throw new Error(`REDIRECT:${path}`);
      },
    },
    "@/utils/supabase/server": { createClient: async () => client },
    "@/lib/accounts": accounts,
  });
}
const form = (login = "profesor", password = "test-password") =>
  new Map([
    ["login", login],
    ["password", password],
  ]);
test("login issues a session only after Supabase validates password and role", async () => {
  let signedOut = false;
  const client = {
    auth: {
      signInWithPassword: async () => ({
        data: { user: { app_metadata: {} } },
      }),
      signOut: async () => {
        signedOut = true;
        return {};
      },
    },
  };
  assert.match((await actions(client).signIn({}, form())).error, /rol/);
  assert.equal(signedOut, true);
  client.auth.signInWithPassword = async (credentials) => {
    assert.equal(credentials.email, "profesor@edumentor.example");
    return { data: { user: { app_metadata: { edumentor_role: "profesor" } } } };
  };
  await assert.rejects(actions(client).signIn({}, form()), /REDIRECT:\//);
});

test("auth failures remain generic and logout errors do not pretend success", async () => {
  const client = {
    auth: {
      signInWithPassword: async () => ({
        data: {},
        error: { status: 400, message: "private-provider-details" },
      }),
      signOut: async () => ({ error: { message: "offline" } }),
    },
  };
  const result = await actions(client).signIn({}, form());
  assert.match(result.error, /incorectă/);
  assert.ok(!result.error.includes("private-provider-details"));
  assert.match(
    (await actions(client).signOut({}, form())).error,
    /nu a reușit/,
  );
  client.auth.signOut = async (options) => {
    assert.equal(options.scope, "local");
    return {};
  };
  await assert.rejects(actions(client).signOut({}, form()), /REDIRECT:\/login/);
});
