import { NextResponse } from "next/server";
import { getAccount } from "@/lib/auth";
import { PracticeError, parseCommand } from "@/features/practices/shared";
import { execute, practiceBoard } from "@/features/practices/server/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET() {
  const account = await getAccount();
  if (!account) return json({ error: "unauthorized" }, 401);
  try { return json(await practiceBoard(account)); }
  catch { return json({ error: "unavailable" }, 503); }
}
export async function POST(request: Request) {
  const account = await getAccount();
  if (!account) return json({ error: "unauthorized" }, 401);
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(`${forwardedProto === "https" || forwardedProto === "http" ? forwardedProto + ":" : url.protocol}//${request.headers.get("host") || url.host}`).origin;
  } catch { return json({ error: "forbidden" }, 403); }
  if (origin && origin !== expectedOrigin) return json({ error: "forbidden" }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json" || !request.body) return json({ error: "invalid" }, 400);
  try {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 100_000) { await reader.cancel(); throw new PracticeError("invalid", 413); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    let command;
    try { command = parseCommand(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
    catch { throw new PracticeError("invalid", 400); }
    const practice = await execute(account, command);
    return json({ practice });
  } catch (error) {
    return error instanceof PracticeError ? json({ error: error.code }, error.status) : json({ error: "unavailable" }, 503);
  }
}
