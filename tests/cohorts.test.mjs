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
const api = load("src/features/cohorts/shared.ts");
const id = n => `${String(n).padStart(8, "0")}-1111-4111-8111-111111111111`;
const teacher = { id: id(1), role: "profesor", name: "Profesor" }, other = { id: id(2), role: "profesor", name: "Other" }, admin = { id: id(3), role: "administrator", name: "Administrator" }, student = { id: id(4), role: "elev", name: "Elev" };
const at = "2026-11-08T12:00:00Z", content = { name: "  Matematică IV  ", subject: "Matematică", educationLevel: "IV", description: "Învățăm prin colaborare." };
const directory = [{ id: student.id, name: "Elev demo", login: "elev", available: true }, { id: id(5), name: "Elev doi", login: "", available: true }];
const group = () => api.createCohort(teacher, content, id(10), at);
const change = (row, action, extra = {}, account = teacher, students = directory) => api.changeCohort(row, account, { action, id: row.id, version: row.version, ...extra }, students, at);
const code = (fn, expected) => assert.throws(fn, error => error.code === expected);
const repo = (client) => load("src/features/cohorts/server/repository.ts", { "server-only": {}, "node:crypto": { randomUUID: () => id(10) }, "@/utils/supabase/admin": { createAdminClient: () => client }, "../shared": api });

test("creation derives teacher ownership, starts empty and validates bounded content", () => {
  const command = api.parseCommand({ action: "create", teacherId: other.id, content: { ...content, teacherId: other.id, studentIds: [student.id] } });
  const row = api.createCohort(teacher, command.content, id(10), at);
  assert.equal(row.name, "Matematică IV"); assert.equal(row.teacherId, teacher.id); assert.equal(row.studentIds.length, 0);
  for (const patch of [{ name: " " }, { name: "a".repeat(121) }, { description: "a".repeat(2001) }, { subject: null }, { description: "x\u0000" }]) code(() => api.parseContent({ ...content, ...patch }), "invalid");
  code(() => api.createCohort(student, content, id(10), at), "forbidden");
});
test("only owner teacher or admin can manage; student and other teacher cannot alter roster", () => {
  for (const account of [other, student]) for (const [action, extra] of [["add", { studentIds: [student.id] }], ["remove", { studentId: student.id }], ["edit", { content }]]) code(() => change(group(), action, extra, account), "forbidden");
  const updated = change(group(), "edit", { content: { ...content, name: "Actualizat", teacherId: other.id } }, admin);
  assert.equal(updated.name, "Actualizat"); assert.equal(updated.teacherId, teacher.id);
  code(() => change(group(), "add", { version: 99, studentIds: [student.id] }), "conflict");
});
test("batch membership is deduplicated, validates current students and removes only one enrollment", () => {
  const initial = group(), added = change(initial, "add", { studentIds: [student.id, student.id, id(5)] });
  assert.equal(added.studentIds.length, 2); assert.equal(initial.studentIds.length, 0);
  assert.equal(change(added, "add", { studentIds: [student.id] }).studentIds.length, 2);
  const removed = change(added, "remove", { studentId: student.id });
  assert.equal(removed.studentIds.length, 1); assert.equal(removed.studentIds[0], id(5));
  code(() => change(removed, "remove", { studentId: student.id }), "conflict");
  for (const selected of [teacher.id, admin.id, id(80)]) code(() => change(initial, "add", { studentIds: [selected] }), "invalid_student");
  code(() => change(initial, "add", { studentIds: [student.id] }, teacher, [{ ...directory[0], available: false }]), "invalid_student");
});
test("capacity is bounded at 100 unique enrollments without partial updates", () => {
  const students = Array.from({ length: 101 }, (_, i) => ({ id: id(100 + i), name: "Elev", login: "", available: true }));
  const full = change(group(), "add", { studentIds: students.slice(0, 100).map(s => s.id) }, teacher, students);
  assert.equal(full.studentIds.length, 100);
  code(() => change(full, "add", { studentIds: [students[100].id] }, teacher, students), "full");
  assert.equal(full.studentIds.length, 100);
});
test("teacher sees own cohorts, admin sees all, pupils see only memberships without roster or directory", () => {
  const enrolled = change(group(), "add", { studentIds: [student.id, id(5)] }), foreign = { ...group(), id: id(11), teacherId: other.id };
  assert.equal(api.projectBoard([enrolled, foreign], teacher, directory).cohorts.length, 1);
  assert.equal(api.projectBoard([enrolled, foreign], admin, directory).cohorts.length, 2);
  const pupil = api.projectBoard([enrolled, foreign], student, directory);
  assert.equal(pupil.cohorts.length, 1); assert.equal(pupil.students.length, 0);
  assert.equal(pupil.cohorts[0].canManage, false); assert.equal(pupil.cohorts[0].members.length, 0);
  assert.equal(pupil.cohorts[0].studentIds, undefined); assert.equal(pupil.cohorts[0].studentCount, 2);
  assert.equal(api.projectBoard([foreign], student, directory).cohorts.length, 0);
  const missing = api.projectBoard([enrolled], teacher, []).cohorts[0].members[0];
  assert.equal(missing.available, false); assert.equal(missing.login, "");
});
test("commands reject path traversal, unknown operations, invalid versions and oversized batches", () => {
  for (const command of [null, [], { action: "delete", id: id(10), version: 1 }, { action: "edit", id: "../private", version: 1, content }, { action: "add", id: id(10), version: 0, studentIds: [student.id] }, { action: "add", id: id(10), version: 1, studentIds: [] }, { action: "add", id: id(10), version: 1, studentIds: Array(101).fill(student.id) }, { action: "add", id: id(10), version: 1, studentIds: ["not-an-id"] }]) code(() => api.parseCommand(command), "invalid");
  assert.equal(api.parseCommand({ action: "add", id: id(10), version: 1, studentIds: [student.id, student.id] }).studentIds.length, 1);
});
test("student directory uses authoritative roles, paginates and strips emails and auth metadata", async () => {
  const pages = [];
  const service = repo({ auth: { admin: { listUsers: async ({ page, perPage }) => {
    pages.push(page); assert.equal(perPage, 500);
    return { error: null, data: { users: page === 1 ? Array.from({ length: 500 }, (_, i) => ({ id: id(100 + i), app_metadata: { edumentor_role: "profesor" }, user_metadata: { edumentor_role: "elev" } })) : [
      { id: student.id, email: "elev@edumentor.example", app_metadata: { edumentor_role: "elev" }, user_metadata: { full_name: "Ana" }, secret: "never-return" },
      { id: id(5), email: "private@example.net", app_metadata: { edumentor_role: "elev" }, user_metadata: {} },
      { id: id(6), app_metadata: { edumentor_role: "elev" }, banned_until: "2099-01-01T00:00:00Z" },
    ] } };
  } } } });
  const rows = await service.studentDirectory();
  assert.equal(pages.join(","), "1,2"); assert.equal(rows.length, 2);
  assert.equal(rows.find(s => s.id === student.id).login, "elev");
  assert.equal(rows.find(s => s.id === id(5)).login, "");
  assert.equal(JSON.stringify(rows).includes("private@example.net"), false); assert.equal(JSON.stringify(rows).includes("never-return"), false);
});
test("concurrent group edits cannot overwrite an enrollment revision", async () => {
  const initial = group(), objects = new Map([[`groups/${initial.id}/000001.json`, JSON.stringify(initial)]]);
  const storage = { list: async prefix => ({ data: [...objects.keys()].filter(k => k.startsWith(prefix + "/")).map(k => ({ name: k.split("/").at(-1) })).sort((a, b) => b.name.localeCompare(a.name)).slice(0, 1), error: null }), download: async path => ({ data: { text: async () => objects.get(path) }, error: null }), upload: async (path, value, options) => { assert.equal(options.upsert, false); if (objects.has(path)) return { error: { statusCode: 409, message: "Already exists" } }; objects.set(path, value); return { error: null }; } };
  const service = repo({ storage: { from: () => storage } });
  const results = await Promise.allSettled([service.execute(teacher, { action: "edit", id: initial.id, version: 1, content: { ...content, name: "A" } }), service.execute(teacher, { action: "edit", id: initial.id, version: 1, content: { ...content, name: "B" } })]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1); assert.equal(results.find(r => r.status === "rejected").reason.code, "conflict"); assert.equal(objects.size, 2);
});
test("HTTP boundary rejects guests, pupil writes, cross-origin and oversized bodies; accepts proxy origin", async () => {
  let account = null, writes = 0;
  const route = load("src/app/api/cohorts/route.ts", { "next/server": { NextResponse: { json: (body, init) => ({ body, ...init }) } }, "@/lib/auth": { getAccount: async () => account }, "@/features/cohorts/shared": api, "@/features/cohorts/server/repository": { execute: async () => { writes++; return id(10); }, cohortBoard: async () => ({ cohorts: [], students: [] }) } });
  const post = (body, origin = "https://edumentor-seven.vercel.app") => route.POST(new Request("https://edumentor-seven.vercel.app/api/cohorts", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) }));
  assert.equal((await route.GET()).status, 401); assert.equal((await post({})).status, 401);
  account = student; assert.equal((await post({ action: "create", content })).status, 403);
  account = teacher; assert.equal((await post({ action: "create", content }, "https://attacker.example")).status, 403);
  assert.equal((await post({ action: "create", content: { ...content, name: "a".repeat(33_000) } })).status, 413);
  assert.equal((await post({ action: "add", id: id(10), version: 1, studentIds: ["oops"] })).status, 400);
  const proxied = await route.POST(new Request("http://localhost:3000/api/cohorts", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://edumentor-seven.vercel.app", Host: "edumentor-seven.vercel.app", "x-forwarded-proto": "https" }, body: JSON.stringify({ action: "create", content }) }));
  assert.equal(proxied.status, 200); assert.equal(writes, 1); assert.equal((await route.GET()).headers["Cache-Control"], "private, no-store");
});
