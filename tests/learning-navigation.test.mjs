import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
const shared = { react: React, "react/jsx-runtime": require("react/jsx-runtime"), "lucide-react": require("lucide-react") };
function load(file, dependencies = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
  const module = { exports: {} };
  vm.runInNewContext(outputText, { module, exports: module.exports, require: name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    if (Object.hasOwn(shared, name)) return shared[name];
    throw new Error(`Unexpected dependency ${name}`);
  } });
  return module.exports;
}
const demo = load("src/lib/demo.ts");
const plan = load("src/lib/continuity-plan.ts");
const annual = load("src/components/annual-continuity.tsx", { "@/lib/continuity-plan": plan });
const views = load("src/components/learning-navigation.tsx", { "@/lib/demo": demo, "./ui": load("src/components/ui.tsx"), "./annual-continuity": annual });
const continuity = (completed, student = false) => renderToStaticMarkup(React.createElement(views.ContinuityView, { locale: "ru", progress: { ...demo.initialProgress, completed }, student, go: () => {} }));

test("five primary items retain Puntea, Expertiza and Trasee while grouping all learning routes", () => {
  assert.equal(JSON.stringify(demo.primaryViews), JSON.stringify(["puntea", "expertiza", "continuitate", "trasee", "investigatie"]));
  assert.equal(JSON.stringify(demo.navigation.slice(0, 5).map(item => item.id)), JSON.stringify(demo.primaryViews));
  assert.equal(JSON.stringify(demo.investigationViews.slice(0, 4)), JSON.stringify(["dashboard", "practices", "course", "activities"]));
  const all = [...demo.primaryViews, ...demo.investigationViews];
  assert.equal(new Set(all).size, demo.navigation.length);
  assert.ok(demo.navigation.every(item => all.includes(item.id)));
});
test("annual continuity stays within twelve months with 7-14-30 and quarterly review", () => {
  assert.equal(plan.continuityYear.length,12);
  assert.equal(JSON.stringify(plan.continuityYear.map(m=>m.month)),JSON.stringify(Array.from({length:12},(_,i)=>i+1)));
  assert.equal(JSON.stringify(plan.continuityYear.filter(m=>m.review).map(m=>m.month)),JSON.stringify([3,6,9,12]));
  assert.equal(JSON.stringify(plan.continuityMilestones.map(m=>m.day)),JSON.stringify([7,14,30]));
  for(const locale of ["ro","ru"]) {
    const html=renderToStaticMarkup(React.createElement(views.ContinuityView,{locale,progress:demo.initialProgress,student:false,go:()=>{}}));
    assert.equal((html.match(/aria-pressed=/g)||[]).length,12);
    assert.ok(html.includes(locale==="ro"?"Testarea cu profesori: în așteptare":"Тестирование с учителями: ожидается"));
    assert.ok(html.includes(locale==="ro"?"Țintă propusă, nu rezultat":"Предлагаемая цель, не результат"));
    assert.ok(html.includes("60%"));
    assert.ok(html.includes(locale==="ro"?"transferuri manual":"вручную"));
    assert.doesNotMatch(html,/aria-valuenow=|Luna 13|Месяц 13/);
  }
});

test("old demo completion cannot turn the proposed annual pilot into completed results", () => {
  const html=continuity([true,true,true]);
  assert.match(html,/ПРЕДЛАГАЕМЫЙ ПЛАН/);
  assert.doesNotMatch(html,/Демомаршрут пройден|Этап пройден/);
});

test("pupil continuation offers only course and exercises without teacher progress or reflection", () => {
  const html = continuity([true, true, true], true);
  assert.match(html, /Открыть курс/); assert.match(html, /Задания/);
  assert.doesNotMatch(html, /role="progressbar"|Вернуться к рефлексии|Демомаршрут пройден|M3|60%/);
});
test("Investigation hub renders only provided sections, in the submenu order", () => {
  const allowed = ["dashboard", "practices", "course", "activities", "cohorts"];
  const html = renderToStaticMarkup(React.createElement(views.InvestigationView, { locale: "ru", views: allowed, student: true, go: () => {} }));
  assert.equal((html.match(/class="ln-card"/g) ?? []).length, 5);
  const titles = [...html.matchAll(/<h2>(.*?)<\/h2>/g)].map(match => match[1]);
  assert.equal(JSON.stringify(titles), JSON.stringify(["Обзор", "Практики", "Мой курс", "Задания", "Мой класс"]));
  assert.doesNotMatch(html, /AI Mentor|Мой опыт/);
});
