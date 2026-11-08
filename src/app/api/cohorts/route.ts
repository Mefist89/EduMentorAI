import { NextResponse } from "next/server";
import { getAccount } from "@/lib/auth";
import { CohortError, parseCommand, canCreate } from "@/features/cohorts/shared";
import { execute, cohortBoard } from "@/features/cohorts/server/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET() {
  const account = await getAccount();
  if (!account) return json({ error: "unauthorized" }, 401);
  try { return json(await cohortBoard(account)); }
  catch { return json({ error: "unavailable" }, 503); }
}
export async function POST(request: Request) {
  const account = await getAccount();
  if (!account) return json({ error: "unauthorized" }, 401);
  if (!canCreate(account)) return json({ error: "forbidden" }, 403);
  const url = new URL(request.url), proto = request.headers.get("x-forwarded-proto");
  try {
    const expected = new URL(`${proto === "https" || proto === "http" ? proto + ":" : url.protocol}//${request.headers.get("host") || url.host}`).origin;
    if (request.headers.get("origin") && request.headers.get("origin") !== expected) return json({ error: "forbidden" }, 403);
  } catch { return json({ error: "forbidden" }, 403); }
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json" || !request.body) return json({ error: "invalid" }, 400);
  try {
    const reader = request.body.getReader(), chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 32_768) { await reader.cancel(); throw new CohortError("invalid", 413); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    let command;
    try { command = parseCommand(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
    catch { throw new CohortError("invalid", 400); }
    const id = await execute(account, command);
    return json({ id });
  } catch (e) { return e instanceof CohortError ? json({ error: e.code }, e.status) : json({ error: "unavailable" }, 503); }
}
