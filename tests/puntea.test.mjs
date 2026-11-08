import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const snapshot = JSON.parse(
  readFileSync(
    new URL("../src/features/puntea/catalog.json", import.meta.url),
    "utf8",
  ),
);
function load(file, dependencies = {}) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  );
  const module = { exports: {} };
  vm.runInNewContext(
    outputText,
    {
      module,
      exports: module.exports,
      URL,
      Intl,
      require: (name) => {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        throw new Error(`Unexpected dependency: ${name}`);
      },
    },
    { filename: file },
  );
  return module.exports;
}
const api = load("src/features/puntea/catalog.ts", {
  "./catalog.json": snapshot,
});
const entry = (id) => api.catalog.find((e) => e.id === id);
const search = (patch = {}, today = "2026-11-08") =>
  api.filterCatalog(api.catalog, { ...api.initialFilters, ...patch }, today);

test("49 imported cards have unique IDs, usable categories and normalized reference pairs", () => {
  assert.equal(api.catalog.length, 49);
  assert.equal(new Set(api.catalog.map((e) => e.id)).size, 49);
  for (const category of api.categories)
    assert.ok(search({ category: category.id }).length > 0, category.id);
  assert.equal(search({ category: "formari" }).length, 5);
  assert.equal(search({ category: "finantari" }).length, 1);
  assert.equal(
    api.catalog.reduce((n, e) => n + e.references.length, 0),
    14,
  );
  assert.equal(
    entry("busola-curriculara").references[0][0],
    "Curriculum oficial MEC",
  );
  assert.match(
    entry("busola-curriculara").references[0][1],
    /^https:\/\/www\.mec\.gov\.md\//,
  );
});
test("catalog rejects duplicate identities, unsafe links, malformed references and dates", () => {
  for (const mutate of [
    (d) => (d.entries[1].id = d.entries[0].id),
    (d) => (d.entries[0].source = "javascript:alert(1)"),
    (d) => (d.entries[0].source = "https://user:password@example.com/"),
    (d) => (d.entries[0].references = ["label", "https://example.com/"]),
    (d) => (d.entries[0].references = [["label", "data:text/html,unsafe"]]),
    (d) => (d.entries[0].deadline = "2026-02-30"),
    (d) => (d.entries[0].category = "__proto__"),
    (d) => (d.entries[0].audience = ["unknown"]),
  ]) {
    const data = structuredClone(snapshot);
    mutate(data);
    assert.throws(() => api.validateCatalog(data));
  }
});
test("search ignores Romanian accents and case and combines terms, category and audience", () => {
  assert.equal(api.fold("ȘCOALĂ ȚARĂ"), "scoala tara");
  assert.equal(
    JSON.stringify(search({ query: "școală" }).map((e) => e.id)),
    JSON.stringify(search({ query: "SCOALA" }).map((e) => e.id)),
  );
  assert.equal(search({ query: "PHET fizică" })[0].id, "phet-simulari");
  assert.equal(search({ query: "PHET nonexistentterm" }).length, 0);
  assert.equal(
    search({ category: "finantari", audience: "Profesori" }).length,
    0,
  );
  assert.equal(search({ category: "finantari", audience: "Școli" }).length, 1);
  assert.ok(
    search({ query: "конкурсы" }).every((e) => e.category === "concursuri"),
  );
});
test("deadlines distinguish expired, today, past events and contradictory source dates", () => {
  assert.equal(api.timing(entry("digiprof-ab"), "2026-11-08"), "expired");
  assert.equal(
    api.timing(entry("concurs-european-eseuri"), "2026-11-15"),
    "deadline",
  );
  assert.equal(api.timing(entry("dor-de-traditii"), "2026-12-01"), "expired");
  assert.equal(api.timing(entry("mold-sef-2027"), "2027-01-18"), "past-event");
  assert.equal(
    api.timing(entry("scoala-de-toamna-etwinning"), "2026-11-08"),
    "conflict",
  );
  assert.equal(search({ hidePast: true }).length, 47);
  assert.equal(
    search({ hidePast: true, category: "formari", audience: "Profesori" })
      .length,
    4,
  );
});
test("date comparisons follow the Bucharest calendar in winter and summer", () => {
  assert.equal(
    api.todayInBucharest(new Date("2026-11-07T22:30:00Z")),
    "2026-11-08",
  );
  assert.equal(
    api.todayInBucharest(new Date("2026-07-01T21:30:00Z")),
    "2026-07-02",
  );
});
test("Puntea Edu is the first workspace menu item without replacing the dashboard", () => {
  const demo = load("src/lib/demo.ts");
  assert.equal(demo.navigation[0].id, "puntea");
  assert.equal(demo.navigation[0].label.ro, "Puntea Edu · Catalog");
  assert.ok(demo.navigation.some((item) => item.id === "dashboard"));
});
