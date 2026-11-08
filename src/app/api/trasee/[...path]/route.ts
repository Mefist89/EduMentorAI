import { NextResponse } from "next/server";
import { getAccount } from "@/lib/auth";
import { canUseMentor } from "@/lib/accounts";
import {
  courseDetail,
  network,
  coverage,
  interpretByDictionary,
  search,
} from "@/features/trasee/shared/rank";
import { validCourseId } from "@/features/trasee/shared/catalog";
import { parseSearch } from "@/features/trasee/server/validation";
import {
  completedCourses,
  loadCatalog,
  logSearch,
  searchStats,
  setCompleted,
} from "@/features/trasee/server/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
const limits = new Map<string, { at: number; count: number }>();
function allow(userId: string) {
  const now = Date.now();
  if (limits.size >= 1000)
    for (const [id, entry] of limits)
      if (now - entry.at > 60_000) limits.delete(id);
  const entry = limits.get(userId);
  if (!entry || now - entry.at > 60_000) {
    if (limits.size >= 1000) return false;
    limits.set(userId, { at: now, count: 1 });
    return true;
  }
  return ++entry.count <= 40;
}
async function body(request: Request): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
      "application/json" ||
    !request.body
  )
    throw new Error("invalid");
  const reader = request.body.getReader();
  let size = 0,
    text = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new Error("invalid");
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const target = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto");
  const protocol =
    proto === "http" || proto === "https" ? `${proto}:` : target.protocol;
  try {
    return (
      origin ===
      new URL(`${protocol}//${request.headers.get("host") || target.host}`)
        .origin
    );
  } catch {
    return false;
  }
}
// Calendar comparisons follow the user's Europe/Bucharest calendar, including on Vercel UTC hosts.
function today() {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

async function handle(request: Request, context: Context) {
  const account = await getAccount();
  if (!account)
    return json({ error: "Conectează-te pentru a accesa Trasee." }, 401);
  if (!canUseMentor(account.role))
    return json(
      {
        error:
          "Traseele de formare sunt disponibile profesorilor și administratorului.",
      },
      403,
    );
  if (!sameOrigin(request)) return json({ error: "Cerere nepermisă." }, 403);
  const { path } = await context.params;
  if (path[0] === "coverage" && account.role !== "administrator")
    return json({ error: "Acces rezervat administratorului." }, 403);
  if (!allow(account.id))
    return json(
      { error: "Prea multe solicitări. Reîncearcă peste un minut." },
      429,
    );
  const route = path.join("/");
  let input: unknown;
  if (request.method === "POST" || request.method === "PATCH") {
    try {
      input = await body(request);
    } catch {
      return json({ error: "Cerere invalidă sau prea mare." }, 400);
    }
  }
  const query = new URL(request.url).searchParams;
  const parsed =
    route === "search" && request.method === "POST" ? parseSearch(input) : null;
  if (route === "search" && request.method === "POST" && !parsed)
    return json({ error: "Verifică textul și filtrele căutării." }, 400);
  try {
    const catalog = await loadCatalog();
    if (route === "network" && request.method === "GET") return json(network(catalog));
    if (route === "state" && request.method === "GET")
      return json({
        done: await completedCourses(account.id, catalog),
        courses: catalog.courses.length,
        providers: catalog.providers.length,
      });
    if (route === "search" && parsed) {
      const result = search(
        catalog,
        parsed,
        interpretByDictionary(parsed.text, parsed.discipline),
        today(),
      );
      let journalSaved = true;
      try {
        await logSearch(
          result.interpretation.competencies,
          result.total,
          parsed.stage,
        );
      } catch {
        journalSaved = false;
      }
      return json({ ...result, journalSaved });
    }
    if (route === "completed" && request.method === "PATCH") {
      const data = input as Record<string, unknown> | null;
      if (
        !data ||
        !validCourseId(data.courseId) ||
        typeof data.completed !== "boolean" ||
        !catalog.courses.some((c) => c.id === data.courseId)
      )
        return json({ error: "Curs invalid." }, 400);
      await setCompleted(account.id, data.courseId, data.completed);
      return json({ ok: true });
    }
    if (route === "courses" && request.method === "GET") {
      const ids = (query.get("ids") || "").split(",");
      if (
        ids.length < 1 ||
        ids.length > 3 ||
        new Set(ids).size !== ids.length ||
        !ids.every(validCourseId)
      )
        return json(
          { error: "Selectează maximum trei cursuri distincte." },
          400,
        );
      const details = ids.map((id) => courseDetail(catalog, id, today()));
      if (details.some((d) => !d))
        return json({ error: "Un curs nu există." }, 404);
      return json(details);
    }
    if (
      path.length === 2 &&
      path[0] === "courses" &&
      request.method === "GET"
    ) {
      if (!validCourseId(path[1])) return json({ error: "Curs invalid." }, 400);
      const detail = courseDetail(catalog, path[1], today());
      return detail ? json(detail) : json({ error: "Cursul nu există." }, 404);
    }
    if (route === "coverage" && request.method === "GET")
      return json(
        coverage(
          catalog,
          today(),
          query.get("simulate") === "1",
          await searchStats(),
        ),
      );
    return json({ error: "Ruta nu există." }, 404);
  } catch {
    return json(
      {
        error:
          "Conexiunea cu datele Trasee nu este disponibilă momentan. Reîncearcă.",
      },
      503,
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
