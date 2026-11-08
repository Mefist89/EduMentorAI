import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(file, dependencies = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  const module = { exports: {} };
  vm.runInNewContext(outputText, { module, exports: module.exports, URL, Buffer, Date, Number, require: name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected dependency ${name}`);
  } }, { filename: file });
  return module.exports;
}
const api = load("src/features/practices/shared.ts");
const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444"];
const teacher = { id: ids[0], name: "Profesor", role: "profesor" };
const other = { id: ids[1], name: "Other", role: "profesor" };
const admin = { id: ids[2], name: "Administrator", role: "administrator" };
const student = { id: ids[3], name: "Elev", role: "elev" };
const at = "2026-11-08T09:00:00Z";
const content = { ...api.emptyContent, title: "  Fracții în echipă  ", description: "Observăm fracțiile cu piese de hârtie.", problem: "Compararea fracțiilor.", method: "Elevii construiesc și explică în perechi.", subject: "Matematică", educationLevel: "Clasa a IV-a" };
const create = () => api.createPractice(teacher, content, ids[0], at);
const step = (p, action, account = teacher, extra = {}) => api.transition(p, account, { id: p.id, version: p.version, action, ...extra }, at);
const code = (fn, expected) => assert.throws(fn, error => error.code === expected);

test("draft validation limits content and discards forged authority fields", () => {
  const draft = api.parseCommand({ action: "create", content: { ...content, authorId: admin.id, status: "approved", language: "ru" } });
  assert.equal(draft.content.title, "Fracții în echipă");
  assert.equal(draft.content.language, "ru");
  assert.equal(draft.content.authorId, undefined);
  assert.equal(api.createPractice(teacher, draft.content, ids[0], at).status, "draft");
  for (const patch of [{ title: " " }, { language: "en" }, { method: "a".repeat(6001) }, { sourceUrl: "javascript:alert(1)" }, { sourceUrl: "https://user:password@example.com" }, { sourceUrl: "http://example.com" }]) code(() => api.parseContent({ ...content, ...patch }), "invalid");
  assert.equal(api.parseContent({ ...content, sourceUrl: "https://example.com/lesson" }).sourceUrl, "https://example.com/lesson");
});
test("teacher workflow preserves review history through rejection, edit and resubmission", () => {
  let p = create();
  assert.equal(p.authorId, teacher.id);
  assert.equal(p.status, "draft");
  p = step(p, "submit"); assert.equal(p.status, "pending");
  p = step(p, "reject", admin, { note: "Adaugă resursele necesare." });
  assert.equal(p.reviewNote, "Adaugă resursele necesare.");
  p = step(p, "save", teacher, { content: { ...content, context: "Hârtie colorată." } });
  assert.equal(p.status, "draft"); assert.equal(p.reviewNote, "");
  p = step(p, "submit");
  p = step(p, "approve", admin, { note: "Revizuit." });
  assert.equal(p.status, "approved"); assert.equal(p.version, 6);
  assert.equal(p.history.length, 6); assert.equal(p.history[2].note, "Adaugă resursele necesare.");
});
test("ownership, student role and non-admin moderation are enforced server-side", () => {
  code(() => api.createPractice(student, content, ids[0], at), "forbidden");
  for (const account of [other, student]) {
    code(() => step(create(), "save", account, { content }), "forbidden");
    code(() => step(create(), "submit", account), "forbidden");
  }
  const pending = step(create(), "submit");
  for (const account of [teacher, other, student]) for (const action of ["approve", "reject"]) code(() => step(pending, action, account, { note: "No" }), "forbidden");
});
test("invalid states, stale versions and incomplete submissions never publish", () => {
  code(() => step(create(), "approve", admin), "conflict");
  const pending = step(create(), "submit");
  code(() => step(pending, "save", teacher, { content }), "conflict");
  code(() => step(pending, "reject", admin, { note: " " }), "invalid");
  const approved = step(pending, "approve", admin);
  code(() => step(approved, "save", teacher, { content }), "conflict");
  code(() => step(approved, "reject", admin, { note: "No" }), "conflict");
  code(() => step(create(), "save", teacher, { content, version: 15 }), "conflict");
  const partial = api.createPractice(teacher, { ...api.emptyContent, title: "În lucru" }, ids[0], at);
  code(() => step(partial, "submit"), "invalid");
});
test("board projection hides unpublished work and moderation notes from other users", () => {
  const draft = create(), pending = { ...step(create(), "submit"), id: ids[1] };
  const rejected = { ...step(pending, "reject", admin, { note: "Private feedback" }), id: ids[2] };
  const published = { ...step(pending, "approve", admin, { note: "Private approval" }), id: ids[3] };
  for (const account of [other, student]) {
    const board = api.projectBoard([draft, pending, rejected, published], account);
    assert.equal(board.published.length, 1); assert.equal(board.mine.length, 0); assert.equal(board.moderation.length, 0);
    assert.equal(board.published[0].reviewNote, ""); assert.equal(board.published[0].history.length, 0);
  }
  assert.equal(api.projectBoard([draft, pending, rejected, published], teacher).mine.length, 4);
  assert.equal(api.projectBoard([draft, pending, rejected, published], admin).moderation.length, 4);
});
test("commands reject unsafe ids, oversized notes, bad versions and unknown operations", () => {
  for (const raw of [null, [], { action: "delete", id: ids[0], version: 1 }, { action: "submit", id: "../private", version: 1 }, { action: "submit", id: ids[0], version: 0 }, { action: "submit", id: ids[0], version: 1.5 }, { action: "reject", id: ids[0], version: 1, note: " " }, { action: "approve", id: ids[0], version: 1, note: "a".repeat(2001) }]) code(() => api.parseCommand(raw), "invalid");
});
test("immutable Storage revisions reject concurrent moderation without last-write-wins", async () => {
  const pending = step(create(), "submit"), objects = new Map([[`entries/${pending.id}/000002.json`, JSON.stringify(pending)]]);
  const storage = {
    list: async prefix => ({ data: [...objects.keys()].filter(key => key.startsWith(prefix + "/")).map(key => ({ name: key.split("/").at(-1) })).sort((a, b) => b.name.localeCompare(a.name)).slice(0, 1), error: null }),
    download: async path => ({ data: { text: async () => objects.get(path) }, error: null }),
    upload: async (path, raw, options) => {
      assert.equal(options.upsert, false);
      if (objects.has(path)) return { error: { statusCode: "409", message: "The resource already exists" } };
      objects.set(path, raw); return { error: null };
    },
  };
  const repo = load("src/features/practices/server/repository.ts", { "server-only": {}, "node:crypto": { randomUUID: () => ids[0] }, "@/utils/supabase/admin": { createAdminClient: () => ({ storage: { from: () => storage } }) }, "../shared": api });
  const results = await Promise.allSettled([repo.execute(admin, { action: "approve", id: pending.id, version: 2, note: "OK" }), repo.execute(admin, { action: "reject", id: pending.id, version: 2, note: "Needs work" })]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(results.find(r => r.status === "rejected").reason.code, "conflict");
  assert.equal(objects.size, 2);
});
test("HTTP boundary requires auth, same origin and bounded validated JSON", async () => {
  let account = null, writes = 0;
  const route = load("src/app/api/practices/route.ts", { "next/server": { NextResponse: { json: (body, init) => ({ body, ...init }) } }, "@/lib/auth": { getAccount: async () => account }, "@/features/practices/shared": api, "@/features/practices/server/repository": { execute: async () => { writes++; return create(); }, practiceBoard: async () => ({ published: [], mine: [], moderation: [] }) } });
  assert.equal((await route.GET()).status, 401);
  const post = (body, origin = "https://edumentor-seven.vercel.app") => route.POST(new Request("https://edumentor-seven.vercel.app/api/practices", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) }));
  assert.equal((await post({})).status, 401);
  account = teacher;
  assert.equal((await post({ action: "create", content }, "https://attacker.example")).status, 403);
  assert.equal((await post({ action: "create", content: { ...content, title: "a".repeat(100_000) } })).status, 413);
  assert.equal((await post({ action: "create", content: {} })).status, 400);
  assert.equal((await post({ action: "create", content })).status, 200);
  const proxied = await route.POST(new Request("http://localhost:3000/api/practices", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://edumentor-seven.vercel.app", Host: "edumentor-seven.vercel.app", "x-forwarded-proto": "https" }, body: JSON.stringify({ action: "create", content }) }));
  assert.equal(proxied.status, 200);
  assert.equal(writes, 2);
  assert.equal((await route.GET()).headers["Cache-Control"], "private, no-store");
});
