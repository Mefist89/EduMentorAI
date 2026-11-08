import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
const shared = { "react/jsx-runtime": require("react/jsx-runtime"), "lucide-react": require("lucide-react") };
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
const views = load("src/components/learning-navigation.tsx", { "@/lib/demo": demo, "./ui": load("src/components/ui.tsx") });
const continuity = (completed, student = false) => renderToStaticMarkup(React.createElement(views.ContinuityView, { locale: "ru", progress: { ...demo.initialProgress, completed }, student, go: () => {} }));

test("five primary items retain Puntea, Expertiza and Trasee while grouping all learning routes", () => {
  assert.equal(JSON.stringify(demo.primaryViews), JSON.stringify(["puntea", "expertiza", "continuitate", "trasee", "investigatie"]));
  assert.equal(JSON.stringify(demo.navigation.slice(0, 5).map(item => item.id)), JSON.stringify(demo.primaryViews));
  assert.equal(JSON.stringify(demo.investigationViews.slice(0, 4)), JSON.stringify(["dashboard", "practices", "course", "activities"]));
  const all = [...demo.primaryViews, ...demo.investigationViews];
  assert.equal(new Set(all).size, demo.navigation.length);
  assert.ok(demo.navigation.every(item => all.includes(item.id)));
});
test("continuity renders the next unfinished step and accurately reports completed progress", () => {
  for (const [completed, title, total] of [[[false, false, false], "Уточните цель", 0], [[true, false, false], "Адаптируйте задание", 1], [[true, true, false], "Примените и осмыслите", 2]]) {
    const html = continuity(completed);
    assert.match(html, new RegExp(`<h2>${title}</h2>`));
    assert.match(html, new RegExp(`aria-valuenow="${total}"`));
    assert.match(html, /Продолжить маршрут/);
  }
  const finished = continuity([true, true, true]);
  assert.match(finished, /Демомаршрут пройден/); assert.match(finished, /Вернуться к рефлексии/); assert.match(finished, /aria-valuenow="3"/);
});
test("pupil continuation offers only course and exercises without teacher progress or reflection", () => {
  const html = continuity([true, true, true], true);
  assert.match(html, /Открыть курс/); assert.match(html, /Задания/);
  assert.doesNotMatch(html, /role="progressbar"|Вернуться к рефлексии|Демомаршрут пройден/);
});
test("Investigation hub renders only provided sections, in the submenu order", () => {
  const allowed = ["dashboard", "practices", "course", "activities", "cohorts"];
  const html = renderToStaticMarkup(React.createElement(views.InvestigationView, { locale: "ru", views: allowed, student: true, go: () => {} }));
  assert.equal((html.match(/class="ln-card"/g) ?? []).length, 5);
  const titles = [...html.matchAll(/<h2>(.*?)<\/h2>/g)].map(match => match[1]);
  assert.equal(JSON.stringify(titles), JSON.stringify(["Обзор", "Практики", "Мой курс", "Задания", "Мой класс"]));
  assert.doesNotMatch(html, /AI Mentor|Мой опыт/);
});
