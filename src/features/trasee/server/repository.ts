import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  CATALOG_PATH,
  TRASEE_BUCKET,
  validCourseId,
  validateCatalog,
} from "../shared/catalog";
import { COMPETENCY_BY_ID } from "../shared/dictionary";
import type { Catalog, CoverageResponse } from "../shared/types";

let catalogCache: { at: number; catalog: Catalog } | undefined;
const bucket = () => createAdminClient().storage.from(TRASEE_BUCKET);

export async function loadCatalog(): Promise<Catalog> {
  if (catalogCache && Date.now() - catalogCache.at < 300_000)
    return catalogCache.catalog;
  const { data, error } = await bucket().download(CATALOG_PATH);
  if (error || !data) throw new Error("Catalog download failed.");
  const catalog = validateCatalog(JSON.parse(await data.text()));
  catalogCache = { at: Date.now(), catalog };
  return catalog;
}

function userPrefix(userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid account ID.");
  return `users/${userId}/completed`;
}

export async function completedCourses(userId: string, catalog: Catalog) {
  const { data, error } = await bucket().list(userPrefix(userId), {
    limit: 1000,
  });
  if (error) throw new Error("Cannot load saved courses.");
  const ids = new Set((data ?? []).map((f) => f.name.replace(/\.json$/, "")));
  return catalog.courses
    .filter((c) => ids.has(c.id))
    .map((c) => ({ id: c.id, title: c.title }));
}

export async function setCompleted(
  userId: string,
  courseId: string,
  completed: boolean,
) {
  if (!validCourseId(courseId)) throw new Error("Invalid course.");
  const path = `${userPrefix(userId)}/${courseId}.json`;
  const result = completed
    ? await bucket().upload(
        path,
        JSON.stringify({ courseId, completedOn: new Date().toISOString() }),
        { contentType: "application/json", upsert: true, cacheControl: "0" },
      )
    : await bucket().remove([path]);
  if (result.error) throw new Error("Cannot save course selection.");
}

export async function logSearch(
  competencies: string[],
  results: number,
  stage: string,
) {
  const known = competencies.filter((id) =>
    Object.hasOwn(COMPETENCY_BY_ID, id),
  );
  // Immutable events avoid lost writes; no user ID, query text or IP is saved.
  // The compact filename supports aggregate counts without downloading each event.
  const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}__${results}__${known.join("~")}__${randomUUID()}.json`;
  const { error } = await bucket().upload(
    `searches/${filename}`,
    JSON.stringify({
      competencies: known,
      results,
      stage,
      source: "dictionar",
    }),
    { contentType: "application/json", upsert: false, cacheControl: "0" },
  );
  if (error) throw new Error("Search event was not saved.");
}

export async function searchStats(): Promise<CoverageResponse["searches"]> {
  const { data, error } = await bucket().list("searches", {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error("Cannot load search statistics.");
  const cutoff = Date.now() - 90 * 86_400_000;
  const counts = new Map<string, number>();
  let total = 0,
    withoutResults = 0;
  for (const item of data ?? []) {
    if (!item.created_at || Date.parse(item.created_at) < cutoff) continue;
    const [, results, ids] = item.name.split("__");
    if (!/^[0-9]+$/.test(results ?? "") || ids === undefined) continue;
    total++;
    if (Number(results) === 0) withoutResults++;
    for (const id of ids.split("~"))
      if (Object.hasOwn(COMPETENCY_BY_ID, id))
        counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return {
    total,
    withoutResults,
    topCompetencies: [...counts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, count]) => ({ id, count, label: COMPETENCY_BY_ID[id].label })),
  };
}
