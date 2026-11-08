import { NextResponse } from "next/server";
import { parseMentorRequest } from "@/lib/mentor-contract";
import { generateMentorReply, MentorServiceError } from "@/lib/openai-mentor";
import { getAccount } from "@/lib/auth";
import { canUseMentor } from "@/lib/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const quota = { windowStart: 0, used: 0, active: 0 };
const MAX_BODY_BYTES = 64_000;

async function readBody(request: Request): Promise<unknown> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let length = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new MentorServiceError("invalid_request", 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (error instanceof MentorServiceError) throw error;
    throw new MentorServiceError("invalid_request", 400);
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // Next.js may use localhost internally even when the browser used 127.0.0.1.
  // Validate against the requested host, keeping the reverse proxy's protocol.
  const target = new URL(request.url);
  const host = request.headers.get("host") || target.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const protocol =
    forwardedProtocol === "https" || forwardedProtocol === "http"
      ? `${forwardedProtocol}:`
      : target.protocol;
  const expectedOrigin = new URL(`${protocol}//${host}`).origin;
  if (origin && origin !== expectedOrigin)
    return NextResponse.json(
      { error: { code: "invalid_request" } },
      { status: 403, headers },
    );
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return NextResponse.json(
      { error: { code: "invalid_request" } },
      { status: 415, headers },
    );

  let active = false;
  try {
    const account = await getAccount();
    if (!account)
      return NextResponse.json(
        { error: { code: "unauthenticated" } },
        { status: 401, headers },
      );
    if (!canUseMentor(account.role))
      return NextResponse.json(
        { error: { code: "forbidden" } },
        { status: 403, headers },
      );
    const input = parseMentorRequest(await readBody(request));
    if (!input) throw new MentorServiceError("invalid_request", 400);
    const now = Date.now();
    if (now - quota.windowStart >= 60_000) {
      quota.windowStart = now;
      quota.used = 0;
    }
    // A process-wide budget bounds costs across authenticated demo accounts.
    if (quota.used >= 20 || quota.active >= 2)
      return NextResponse.json(
        { error: { code: "rate_limited" } },
        { status: 429, headers: { ...headers, "Retry-After": "60" } },
      );
    quota.used++;
    quota.active++;
    active = true;
    const answer = await generateMentorReply(input, request.signal);
    return NextResponse.json(answer, { headers });
  } catch (error) {
    const safe =
      error instanceof MentorServiceError
        ? error
        : new MentorServiceError("unavailable", 503);
    return NextResponse.json(
      { error: { code: safe.code } },
      { status: safe.status, headers },
    );
  } finally {
    if (active) quota.active--;
  }
}
