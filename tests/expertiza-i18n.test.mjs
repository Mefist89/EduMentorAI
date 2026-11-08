import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(read("src/features/expertiza/client/translations.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { module, exports: module.exports });
const { translate, russian, countText } = module.exports;

test("Russian counts handle singular, few, many and teen numbers", () => {
  for (const [count, noun] of [[1,"ответ"],[2,"ответа"],[5,"ответов"],[11,"ответов"],[21,"ответ"],[22,"ответа"],[0,"ответов"]]) {
    assert.equal(countText("ru", count, "răspunsuri", ["ответ","ответа","ответов"]), `${count} ${noun}`);
  }
  assert.equal(countText("ro", 2, "răspunsuri", ["ответ","ответа","ответов"]), "2 răspunsuri");
});

test("Expertiza translations preserve Romanian and unknown user-authored text", () => {
  for (const [ro, ru] of Object.entries(russian)) {
    assert.equal(translate("ro", ro), ro);
    assert.equal(translate("ru", ro), ru);
    assert.match(ru, /[А-Яа-яЁё]/u);
  }
  assert.equal(translate("ru", "Întrebarea mea personală"), "Întrebarea mea personală");
});

test("all UI translation keys and server errors have Russian translations", () => {
  const source = read("src/features/expertiza/client/ExpertizaApp.tsx");
  for (const match of source.matchAll(/tr\("([^"]+)"\)/g)) assert.ok(russian[match[1]], match[1]);
  const route = read("src/app/api/expertiza/[...path]/route.ts");
  for (const match of route.matchAll(/error: "([^"]+)"/g)) assert.ok(russian[match[1]], match[1]);
});

test("demo educational content is translated without changing stored seed data", () => {
  const seed = JSON.parse(read("src/features/expertiza/data/seed.json"));
  const content = [
    ...seed.teachers.flatMap(t => [t.s, t.r, ...t.rev.map(r => r[2])]),
    ...seed.questions.flatMap(q => [q.t, q.b, ...q.c.map(r => r[2])]),
    ...seed.communities.flatMap(c => [c.n, c.d, c.i]),
    ...seed.schools.flatMap(s => [s.n, s.a]),
    ...seed.rules.flatMap(r => [r.t, r.b]),
    ...seed.events.flatMap(e => [e.m, e.t, e.p]), ...seed.tips,
  ];
  for (const text of content) assert.ok(russian[text], text);
});
