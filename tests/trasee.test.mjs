import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, dependencies = {}) {
  const url = new URL(`../${file}`, import.meta.url);
  const source = readFileSync(url, "utf8").replaceAll(
    "import.meta.url",
    JSON.stringify(url.href),
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const module = { exports: {} };
  vm.runInNewContext(
    outputText,
    {
      module,
      exports: module.exports,
      require: (name) =>
        Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
      URL,
      Headers,
      TextDecoder,
      AbortSignal,
      Intl,
    },
    { filename: file },
  );
  return module.exports;
}
const prefix = "src/features/trasee/";
const dictionary = load(prefix + "shared/dictionary.ts");
const ranking = load(prefix + "shared/rank.ts", { "./dictionary": dictionary });
const catalogTools = load(prefix + "shared/catalog.ts");
const validation = load(prefix + "server/validation.ts", {
  "../shared/dictionary": dictionary,
  "../shared/catalog": catalogTools,
});
const catalog = JSON.parse(
  readFileSync(
    new URL("../src/features/trasee/data/catalog.json", import.meta.url),
    "utf8",
  ),
);

// Run the source module's original tests against the imported, actual ranking implementation.
load(prefix + "test/rank.test.ts", {
  "../shared/rank": ranking,
  "../shared/dictionary": dictionary,
  // Imported source tests and modules have separate VM realms. Compare values,
  // rather than their realm-specific Array prototypes.
  "node:assert/strict": {
    ...assert,
    deepEqual: (a, b) =>
      assert.deepEqual(
        JSON.parse(JSON.stringify(a)),
        JSON.parse(JSON.stringify(b)),
      ),
  },
});

const valid = {
  text: "robotică",
  stage: "gl",
  discipline: "",
  when: "oricand",
  format: "oricare",
  minCredits: 0,
  done: [],
};
test("search accepts known filters and rejects invalid, oversized and prototype names", () => {
  assert.ok(validation.parseSearch(valid));
  for (const patch of [
    { text: "x".repeat(801) },
    { discipline: "__proto__" },
    { stage: "unknown" },
    { when: "yesterday" },
    { minCredits: 100 },
    { done: ["../another-user"] },
    { competencies: ["invented"] },
  ])
    assert.equal(validation.parseSearch({ ...valid, ...patch }), null);
  assert.equal(validation.parseSearch({ ...valid, text: "" }), null);
});
test("catalog identities and external link protocols are validated", () => {
  assert.equal(catalogTools.validateCatalog(catalog).courses.length, 124);
  const unsafe = JSON.parse(JSON.stringify(catalog));
  unsafe.courses[0].links.fisa = "javascript:alert(1)";
  assert.throws(() => catalogTools.validateCatalog(unsafe), /URL/);
  unsafe.courses[0].links.fisa = null;
  unsafe.courses[1].id = unsafe.courses[0].id;
  assert.throws(() => catalogTools.validateCatalog(unsafe), /identity/);
});
test("private course paths are derived from the server account, never from client user IDs", async () => {
  const paths = [];
  const storage = {
    list: async (path) => {
      paths.push(path);
      return { data: [] };
    },
    upload: async (path) => {
      paths.push(path);
      return {};
    },
    remove: async (values) => {
      paths.push(...values);
      return {};
    },
  };
  const repo = load(prefix + "server/repository.ts", {
    "server-only": {},
    "@/utils/supabase/admin": {
      createAdminClient: () => ({
        storage: {
          from: (name) => {
            assert.equal(name, "edumentor-trasee");
            return storage;
          },
        },
      }),
    },
    "../shared/catalog": catalogTools,
    "../shared/dictionary": dictionary,
  });
  const user = "11111111-1111-4111-8111-111111111111";
  await repo.completedCourses(user, catalog);
  await repo.setCompleted(user, catalog.courses[0].id, true);
  await repo.setCompleted(user, catalog.courses[0].id, false);
  assert.ok(paths.every((path) => path.startsWith(`users/${user}/completed`)));
  await assert.rejects(
    repo.setCompleted("../../victim", catalog.courses[0].id, true),
    /account/,
  );
  await assert.rejects(repo.setCompleted(user, "../victim", true), /course/);
});

const accounts = load("src/lib/accounts.ts");
function api(account, repo = {}) {
  return load("src/app/api/trasee/[...path]/route.ts", {
    "@/lib/auth": { getAccount: async () => account },
    "@/lib/accounts": accounts,
    "@/features/trasee/shared/rank": ranking,
    "@/features/trasee/shared/catalog": catalogTools,
    "@/features/trasee/server/validation": validation,
    "@/features/trasee/server/repository": {
      loadCatalog: async () => catalog,
      completedCourses: async () => [],
      logSearch: async () => {},
      searchStats: async () => ({
        total: 0,
        withoutResults: 0,
        topCompetencies: [],
      }),
      ...repo,
    },
  });
}
const teacher = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "profesor",
};
const request = (path, method = "GET", body) =>
  new Request(`http://localhost:3000/api/trasee/${path}`, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const context = (path) => ({
  params: Promise.resolve({ path: path.split("/") }),
});
test("guests, pupils and non-admin coverage requests stop before Storage access", async () => {
  let reads = 0;
  const repo = {
    loadCatalog: async () => {
      reads++;
      return catalog;
    },
  };
  assert.equal(
    (await api(null, repo).GET(request("state"), context("state"))).status,
    401,
  );
  assert.equal(
    (
      await api({ ...teacher, role: "elev" }, repo).GET(
        request("state"),
        context("state"),
      )
    ).status,
    403,
  );
  assert.equal(
    (await api(teacher, repo).GET(request("coverage"), context("coverage")))
      .status,
    403,
  );
  assert.equal(reads, 0);
});
test("cross-origin writes are rejected and forged user IDs cannot change object ownership", async () => {
  let owner;
  const handler = api(teacher, {
    setCompleted: async (user) => {
      owner = user;
    },
  });
  const foreign = new Request("http://localhost:3000/api/trasee/completed", {
    method: "PATCH",
    headers: {
      origin: "https://elsewhere.example",
      "content-type": "application/json",
    },
    body: JSON.stringify({ courseId: catalog.courses[0].id, completed: true }),
  });
  assert.equal(
    (await handler.PATCH(foreign, context("completed"))).status,
    403,
  );
  assert.equal(
    (
      await handler.PATCH(
        request("completed", "PATCH", {
          courseId: catalog.courses[0].id,
          completed: true,
          userId: "victim",
        }),
        context("completed"),
      )
    ).status,
    200,
  );
  assert.equal(owner, teacher.id);
});
test("search logs only themes and anonymous counts, never the teacher's raw text", async () => {
  let log;
  const handler = api(teacher, {
    logSearch: async (...args) => {
      log = args;
    },
  });
  const res = await handler.POST(
    request("search", "POST", valid),
    context("search"),
  );
  assert.equal(res.status, 200);
  assert.equal((await res.json()).interpretation.source, "dictionar");
  assert.ok(log);
  assert.ok(!JSON.stringify(log).includes(valid.text));
  assert.ok(!JSON.stringify(log).includes(teacher.id));
});
test("Storage failures are controlled and do not expose provider messages or secrets", async () => {
  const handler = api(teacher, {
    loadCatalog: async () => {
      throw new Error("private-provider-details");
    },
  });
  const res = await handler.GET(request("state"), context("state"));
  assert.equal(res.status, 503);
  assert.ok(!(await res.text()).includes("private-provider-details"));
});


test("network is derived from catalog providers and excludes inferred-near competency links", () => {
  const net = ranking.network(catalog);
  assert.equal(net.stations.length, catalog.providers.length);
  assert.equal(net.stations.reduce((sum, s) => sum + s.courses, 0), catalog.courses.length);
  for (const line of net.lines) {
    const expected = catalog.courses.filter(c => c.competencies.some(k => k.matchedBy !== "near" && dictionary.COMPETENCY_BY_ID[k.id]?.group === line.id));
    assert.equal(line.courses, expected.length);
    assert.deepEqual([...line.stops].sort(), [...new Set(expected.map(c => c.providerId))].sort());
  }
});

test("run timelines omit registration and approximate dates and skip ended editions", () => {
  const course = { ...catalog.courses[0], sessions: [
    {kind:"reg",start:"2026-11-01",end:"2026-12-01"},
    {kind:"approx",start:"2026-11-01",end:"2026-12-31"},
    {kind:"run",start:"2026-10-01",end:"2026-10-05"},
    {kind:"run",start:"2026-11-10",end:"2026-11-20"},
  ] };
  assert.equal(JSON.stringify(ranking.nextRun(course, new Date(2026,10,8))), JSON.stringify({start:"2026-11-10",end:"2026-11-20"}));
  assert.equal(ranking.nextRun(course, new Date(2027,0,1)), null);
});

test("overlaps require matching disciplines at distinct centers and intersecting published dates", () => {
  const c = catalog.courses[0];
  const fixture = {...catalog, courses: [
    {...c,id:"x1",title:"Matematică",providerId:catalog.providers[0].id,sessions:[{kind:"run",start:"2026-11-01",end:"2026-11-15"}]},
    {...c,id:"x2",title:"Matematică",providerId:catalog.providers[1].id,sessions:[{kind:"run",start:"2026-11-10",end:"2026-11-20"}]},
    {...c,id:"x3",title:"Fizică",providerId:catalog.providers[2].id,sessions:[{kind:"run",start:"2026-11-10",end:"2026-11-20"}]},
  ]};
  const result = ranking.overlaps(fixture, new Date(2026,10,8));
  assert.equal(result.groups.length,1);
  assert.equal(result.groups[0].overlapDays,6);
  fixture.courses[1].sessions[0].start="2026-11-16";
  assert.equal(ranking.overlaps(fixture,new Date(2026,10,8)).groups.length,0);
});

test("network endpoint uses private catalog behind the same teacher authorization boundary", async () => {
  const response = await api(teacher).GET(request("network"), context("network"));
  assert.equal(response.status,200);
  assert.equal((await response.json()).stations.length,catalog.providers.length);
  assert.equal((await api(null).GET(request("network"),context("network"))).status,401);
  assert.equal((await api({...teacher,role:"elev"}).GET(request("network"),context("network"))).status,403);
});
