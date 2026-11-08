import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Account } from "@/lib/accounts";
import { COHORTS_BUCKET, CohortError, validId, canManage, canCreate, createCohort, changeCohort, projectBoard, type Cohort, type CohortCommand, type StudentOption } from "../shared";

const bucket = () => createAdminClient().storage.from(COHORTS_BUCKET);
export async function studentDirectory(): Promise<StudentOption[]> {
  const client = createAdminClient(), result: StudentOption[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 500 });
    if (error) throw new CohortError("unavailable", 503);
    for (const user of data.users) {
      if (user.app_metadata?.edumentor_role !== "elev" || user.is_anonymous || (user.banned_until && new Date(user.banned_until).getTime() > Date.now())) continue;
      const rawName = user.user_metadata?.full_name || user.user_metadata?.name;
      const name = typeof rawName === "string" && rawName.trim() ? rawName.trim().slice(0, 100) : `Elev · ${user.id.slice(0, 8)}`;
      // Only the reserved demo login is exposed; never send emails, tokens or auth metadata.
      const login = user.email?.endsWith("@edumentor.example") ? user.email.split("@")[0] : "";
      result.push({ id: user.id, name, login, available: true });
    }
    if (data.users.length < 500) break;
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}
async function latest(id: string): Promise<Cohort | null> {
  if (!validId(id)) throw new CohortError("invalid", 400);
  const { data: files, error } = await bucket().list(`groups/${id}`, { limit: 1, sortBy: { column: "name", order: "desc" } });
  if (error) throw new CohortError("unavailable", 503);
  if (!files?.length) return null;
  const { data, error: downloadError } = await bucket().download(`groups/${id}/${files[0].name}`);
  if (downloadError || !data) throw new CohortError("unavailable", 503);
  const row = JSON.parse(await data.text()) as Cohort;
  if (row.id !== id || !Number.isSafeInteger(row.version)) throw new CohortError("unavailable", 503);
  return row;
}
async function allCohorts() {
  const ids: string[] = [], rows: Cohort[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await bucket().list("groups", { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new CohortError("unavailable", 503);
    for (const file of data ?? []) if (validId(file.name)) ids.push(file.name);
    if (!data || data.length < 100) break;
  }
  for (let i = 0; i < ids.length; i += 8) for (const row of await Promise.all(ids.slice(i, i + 8).map(latest))) if (row) rows.push(row);
  return rows;
}
export async function cohortBoard(account: Account) {
  const [groups, students] = await Promise.all([allCohorts(), canCreate(account) ? studentDirectory() : Promise.resolve([])]);
  return projectBoard(groups, account, students);
}
export async function execute(account: Account, command: CohortCommand) {
  const now = new Date().toISOString();
  let next: Cohort;
  if (command.action === "create") next = createCohort(account, command.content, randomUUID(), now);
  else {
    const previous = await latest(command.id);
    if (!previous) throw new CohortError("not_found", 404);
    if (!canManage(previous, account)) throw new CohortError("forbidden", 403);
    next = changeCohort(previous, account, command, command.action === "add" ? await studentDirectory() : [], now);
  }
  const path = `groups/${next.id}/${String(next.version).padStart(6, "0")}.json`;
  const { error } = await bucket().upload(path, JSON.stringify(next), { contentType: "application/json", upsert: false, cacheControl: "0" });
  if (error) {
    const conflict = String(error.statusCode) === "409" || error.message.toLowerCase().includes("already exists");
    throw new CohortError(conflict ? "conflict" : "unavailable", conflict ? 409 : 503);
  }
  return next.id;
}
