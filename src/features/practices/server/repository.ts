import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Account } from "@/lib/accounts";
import { PRACTICES_BUCKET, PracticeError, validId, createPractice, transition, projectBoard, type Practice, type PracticeCommand } from "../shared";

const bucket = () => createAdminClient().storage.from(PRACTICES_BUCKET);
const revisionPath = (id: string, version: number) => `entries/${id}/${String(version).padStart(6, "0")}.json`;
async function latest(id: string): Promise<Practice | null> {
  if (!validId(id)) throw new PracticeError("invalid", 400);
  const { data: files, error } = await bucket().list(`entries/${id}`, { limit: 1, sortBy: { column: "name", order: "desc" } });
  if (error) throw new PracticeError("unavailable", 503);
  if (!files?.length) return null;
  const { data, error: downloadError } = await bucket().download(`entries/${id}/${files[0].name}`);
  if (downloadError || !data) throw new PracticeError("unavailable", 503);
  const record = JSON.parse(await data.text()) as Practice;
  if (record.id !== id || !Number.isSafeInteger(record.version)) throw new PracticeError("unavailable", 503);
  return record;
}
export async function allPractices(): Promise<Practice[]> {
  const ids: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await bucket().list("entries", { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new PracticeError("unavailable", 503);
    for (const entry of data ?? []) if (validId(entry.name)) ids.push(entry.name);
    if (!data || data.length < 100) break;
  }
  const rows: Practice[] = [];
  for (let i = 0; i < ids.length; i += 8) {
    for (const row of await Promise.all(ids.slice(i, i + 8).map(latest))) if (row) rows.push(row);
  }
  return rows;
}
export async function practiceBoard(account: Account) { return projectBoard(await allPractices(), account); }
export async function execute(account: Account, command: PracticeCommand) {
  const now = new Date().toISOString();
  let next: Practice;
  if (command.action === "create") next = createPractice(account, command.content, randomUUID(), now);
  else {
    const previous = await latest(command.id);
    if (!previous) throw new PracticeError("not_found", 404);
    next = transition(previous, account, command, now);
  }
  // Immutable revision names make competing writes fail atomically. Never upsert:
  // two reviewers editing version N cannot both create version N+1.
  const { error } = await bucket().upload(revisionPath(next.id, next.version), JSON.stringify(next), { contentType: "application/json", upsert: false, cacheControl: "0" });
  if (error) throw new PracticeError(String(error.statusCode) === "409" || error.message.toLowerCase().includes("already exists") ? "conflict" : "unavailable", String(error.statusCode) === "409" || error.message.toLowerCase().includes("already exists") ? 409 : 503);
  return next;
}
