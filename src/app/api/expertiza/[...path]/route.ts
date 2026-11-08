import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getAccount } from "@/lib/auth";
import {
  parseCommand,
  requiresAdmin,
  validUserId,
} from "@/features/expertiza/shared";
import {
  board,
  contacts,
  messageHistory,
  sendMessage,
  put,
  removeOwn,
  ownKey,
} from "@/features/expertiza/server/repository";
import { askMaria } from "@/features/expertiza/server/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;
type Context = { params: Promise<{ path: string[] }> };
const json = (value: unknown, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
const limits = new Map<string, { at: number; count: number }>();
function allow(key: string, max: number, window = 60_000) {
  const now = Date.now();
  for (const [id, item] of limits)
    if (now - item.at > 600_000) limits.delete(id);
  const item = limits.get(key);
  if (!item || now - item.at > window) {
    if (limits.size >= 2000) return false;
    limits.set(key, { at: now, count: 1 });
    return true;
  }
  return ++item.count <= max;
}
let activeAI = 0;
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const url = new URL(request.url),
    proto = request.headers.get("x-forwarded-proto");
  try {
    return (
      origin ===
      new URL(
        `${proto === "https" || proto === "http" ? proto + ":" : url.protocol}//${request.headers.get("host") || url.host}`,
      ).origin
    );
  } catch {
    return false;
  }
}
async function body(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
      "application/json" ||
    !request.body
  )
    throw new Error("Invalid body.");
  const reader = request.body.getReader(),
    decoder = new TextDecoder();
  let size = 0,
    text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new Error("Too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
async function handle(request: Request, context: Context) {
  const account = await getAccount();
  if (!account)
    return json({ error: "Conectează-te pentru a accesa Expertiză." }, 401);
  if (!sameOrigin(request)) return json({ error: "Cerere nepermisă." }, 403);
  if (!allow(account.id, 100))
    return json(
      { error: "Prea multe solicitări. Reîncearcă peste un minut." },
      429,
    );
  const route = (await context.params).path.join("/");
  try {
    if (request.method === "GET" && route === "state")
      return json(await board(account));
    if (request.method === "GET" && route === "messages") {
      const recipientId = new URL(request.url).searchParams.get("with");
      if (!validUserId(recipientId) || recipientId === account.id)
        return json({ error: "Destinatar invalid." }, 400);
      if (!(await contacts()).some((p) => p.id === recipientId))
        return json({ error: "Destinatar indisponibil." }, 404);
      return json({ messages: await messageHistory(account.id, recipientId) });
    }
    if (request.method !== "POST" || route !== "actions")
      return json({ error: "Rută inexistentă." }, 404);
    let command;
    try {
      command = parseCommand(await body(request));
    } catch {
      return json({ error: "Cerere invalidă sau prea mare." }, 400);
    }
    if (!command) return json({ error: "Verifică datele introduse." }, 400);
    if (requiresAdmin(command.action) && account.role !== "administrator")
      return json({ error: "Acces rezervat administratorului." }, 403);
    const state = await board(account),
      createdAt = new Date().toISOString(),
      id = randomUUID();
    const author = {
      authorId: account.id,
      authorName: state.me.name,
      role: account.role,
      createdAt,
    };
    const community =
      "communityId" in command
        ? state.communities.find((c) => c.id === command.communityId)
        : undefined;
    const question =
      "questionId" in command
        ? state.questions.find((q) => q.id === command.questionId)
        : undefined;
    if ("questionId" in command && !question)
      return json({ error: "Întrebarea nu este disponibilă." }, 404);
    if ("communityId" in command && command.communityId && !community)
      return json({ error: "Comunitatea nu este disponibilă." }, 404);
    const questionCommunity = question?.communityId
      ? state.communities.find((c) => c.id === question.communityId)
      : null;
    if (
      (command.action === "question" && community && !community.joined) ||
      (["answer", "ai"].includes(command.action) &&
        questionCommunity &&
        !questionCommunity.joined)
    )
      return json({ error: "Alătură-te comunității pentru a participa." }, 403);
    switch (command.action) {
      case "question":
        await put(`questions/${id}.json`, {
          id,
          title: command.title,
          body: command.body,
          communityId: command.communityId,
          ...author,
          demo: false,
          pinned: false,
          replies: [],
          likes: 0,
          liked: false,
        });
        break;
      case "answer":
        await put(`answers/${id}.json`, {
          id,
          questionId: command.questionId,
          body: command.body,
          ...author,
          demo: false,
        });
        break;
      case "like":
      case "join": {
        const prefix = command.action === "like" ? "likes" : "members",
          entity =
            command.action === "like"
              ? command.questionId
              : command.communityId;
        const key = ownKey(prefix, entity, account.id);
        if (command.active)
          await put(
            key,
            { userId: account.id, entityId: entity, createdAt },
            true,
          );
        else await removeOwn(key);
        break;
      }
      case "review":
        if (!state.teachers.some((t) => t.id === command.teacherId))
          return json({ error: "Profesor indisponibil." }, 404);
        await put(
          ownKey("reviews", command.teacherId, account.id),
          {
            id: `${command.teacherId}--${account.id}`,
            teacherId: command.teacherId,
            stars: command.stars,
            body: command.body,
            ...author,
            demo: false,
          },
          true,
        );
        break;
      case "profile":
        await put(
          `profiles/${account.id}.json`,
          {
            id: account.id,
            name: command.name,
            school: command.school,
            subject: command.subject,
          },
          true,
        );
        break;
      case "community":
        await put(`communities/${id}.json`, {
          id,
          name: command.name,
          description: command.description,
          school: command.school,
          color: "#28675e",
          demo: false,
          joined: false,
          members: 0,
          pinned: false,
          ...author,
        });
        break;
      case "rule":
        await put(`rules/${id}.json`, {
          id,
          title: command.title,
          body: command.body,
          demo: false,
          ...author,
        });
        break;
      case "moderate": {
        const exists =
          command.kind === "question"
            ? state.questions.some((q) => q.id === command.id)
            : state.communities.some((c) => c.id === command.id);
        if (
          !exists &&
          !state.archived.some(
            (a) => a.id === command.id && a.kind === command.kind,
          )
        )
          return json({ error: "Element indisponibil." }, 404);
        await put(
          `moderation/${command.kind}__${command.id}__${command.flag}.json`,
          { ...command, ...author },
          true,
        );
        break;
      }
      case "message":
        if (!state.contacts.some((c) => c.id === command.recipientId))
          return json({ error: "Destinatar indisponibil." }, 404);
        await sendMessage(account.id, command.recipientId, command.body);
        break;
      case "ai": {
        if (!question) return json({ error: "Întrebare indisponibilă." }, 404);
        if (activeAI >= 2 || !allow(`ai:${account.id}`, 5, 600_000))
          return json(
            { error: "Maria este ocupată. Reîncearcă mai târziu." },
            429,
          );
        activeAI++;
        try {
          const answer = await askMaria(question);
          await put(`answers/${id}.json`, {
            id,
            questionId: question.id,
            body: answer,
            authorId: null,
            authorName: "Maria AI",
            role: "ai",
            createdAt,
            provider: "openai",
            demo: false,
          });
        } catch {
          return json(
            { error: "Maria AI nu a putut răspunde. Reîncearcă mai târziu." },
            503,
          );
        } finally {
          activeAI--;
        }
        break;
      }
    }
    return json({ ok: true, id });
  } catch {
    return json(
      { error: "Datele Expertiză nu sunt disponibile momentan. Reîncearcă." },
      503,
    );
  }
}
export { handle as GET, handle as POST };
