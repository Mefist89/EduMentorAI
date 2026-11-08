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
const russianSnapshot = JSON.parse(readFileSync(new URL("../src/features/puntea/catalog.ru.json", import.meta.url), "utf8"));
const api = load("src/features/puntea/catalog.ts", {
  "./catalog.json": snapshot,
  "./catalog.ru.json": russianSnapshot,
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
  assert.equal(demo.navigation[0].label.ru, "Puntea Edu · Каталог");
  assert.ok(demo.navigation.some((item) => item.id === "dashboard"));
});

test("all 49 Russian cards preserve source identities, URLs, dates, audiences and factual numbers", () => {
  const before = JSON.stringify(api.catalog);
  assert.equal(Object.keys(api.russianTranslations).length, 49);
  for (const original of api.catalog) {
    assert.equal(api.localizeEntry(original, "ro"), original);
    const ru = api.localizeEntry(original, "ru");
    for (const key of ["id", "source", "category", "audience", "status", "checkedAt", "deadline", "event"])
      assert.equal(JSON.stringify(ru[key]), JSON.stringify(original[key]), `${original.id}/${key}`);
    for (const key of ["title", "provider", "summary", "eligible", "when", "cost", "next", "deadlineLabel"]) {
      if (original[key] === undefined) assert.equal(ru[key], undefined);
      else {
        assert.ok(typeof ru[key] === "string" && ru[key].trim(), `${original.id}/${key}`);
        const numbers = text => JSON.stringify(text.match(/\d+(?:[.:]\d+)*/g) ?? []);
        assert.equal(numbers(ru[key]), numbers(original[key]), `${original.id}/${key}: factual numbers changed`);
      }
    }
    assert.equal(ru.references.length, original.references.length);
    ru.references.forEach(([label, href], index) => {
      assert.equal(href, original.references[index][1]);
      assert.ok(/[А-Яа-яЁё]/.test(label), `${original.id}: untranslated reference`);
    });
  }
  assert.equal(JSON.stringify(api.catalog), before);
  assert.match(api.localizeEntry(entry("busola-curriculara"), "ru").title, /Учебный компас/);
});

test("incomplete translations and attempts to replace source metadata are rejected", () => {
  for (const change of [
    data => delete data["phet-simulari"],
    data => data["unknown-id"] = data["phet-simulari"],
    data => data["phet-simulari"].summary = " ",
    data => delete data["dor-de-traditii"].cost,
    data => data["phet-simulari"].source = "https://example.com/changed",
    data => data["phet-simulari"].deadline = "2099-01-01",
    data => data["phet-simulari"].when = "Invented date",
    data => data["busola-curriculara"].references = [],
    data => data["busola-curriculara"].references = [""],
  ]) {
    const changed = structuredClone(russianSnapshot); change(changed);
    assert.throws(() => api.validateTranslations(changed, api.catalog));
  }
});

test("Russian and mixed-language searches find translated content and combine existing filters", () => {
  assert.equal(search({ query: "PhET ФИЗИКА" })[0].id, "phet-simulari");
  assert.equal(search({ query: "биология экосистемы" })[0].id, "biologie-viii-eduresurse");
  assert.equal(search({ query: "школьных грантов", audience: "Școli", category: "finantari" })[0].id, "granturi-scolare");
  assert.equal(search({ query: "школьных грантов", audience: "Profesori" }).length, 0);
  assert.equal(search({ query: "брюссельское" })[0].id, "parteneri-etwinning");
  assert.equal(JSON.stringify(search({ query: "КИШИНЕВ" }).map(e => e.id)), JSON.stringify(search({ query: "кишинёв" }).map(e => e.id)));
  assert.ok(search({ query: "КИШИНЕВ" }).length > 0);
  assert.equal(search({ query: "DigiProf", hidePast: true }).length, 0);
});
