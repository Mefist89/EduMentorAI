import type { Account } from "@/lib/accounts";

export const PRACTICES_BUCKET = "edumentor-practices";
export type PracticeStatus = "draft" | "pending" | "approved" | "rejected";
export const fieldLimits = { title: 160, subject: 100, educationLevel: 100, description: 6000, problem: 4000, method: 6000, context: 4000, sourceUrl: 1000 } as const;
export type PracticeContent = Record<keyof typeof fieldLimits, string> & { language: "ro" | "ru" };
export type ReviewEvent = { action: "create" | "save" | "submit" | "approve" | "reject"; actorId: string; at: string; note: string };
export type Practice = PracticeContent & { id: string; authorId: string; authorName: string; version: number; status: PracticeStatus; createdAt: string; updatedAt: string; reviewNote: string; history: ReviewEvent[] };
export type PracticeBoard = { published: Practice[]; mine: Practice[]; moderation: Practice[] };
export type PracticeCommand = { action: "create"; content: PracticeContent } | { action: "save"; id: string; version: number; content: PracticeContent } | { action: "submit" | "approve" | "reject"; id: string; version: number; note?: string };
export class PracticeError extends Error {
  constructor(public code: "invalid" | "forbidden" | "not_found" | "conflict" | "unavailable", public status: number) { super(code); }
}
export const validId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const canAuthor = (account: Account) => account.role === "profesor" || account.role === "administrator";
export const emptyContent: PracticeContent = { title: "", subject: "", educationLevel: "", language: "ro", description: "", problem: "", method: "", context: "", sourceUrl: "" };
function invalid(): never { throw new PracticeError("invalid", 400); }
export function parseContent(value: unknown): PracticeContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const raw = value as Record<string, unknown>, result = { ...emptyContent };
  for (const [key, max] of Object.entries(fieldLimits)) {
    const text = raw[key];
    if (typeof text !== "string" || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) return invalid();
    result[key as keyof typeof fieldLimits] = text.trim();
  }
  if (!result.title || !["ro", "ru"].includes(String(raw.language))) return invalid();
  result.language = raw.language as "ro" | "ru";
  if (result.sourceUrl) {
    try { const u = new URL(result.sourceUrl); if (u.protocol !== "https:" || u.username || u.password) return invalid(); } catch { return invalid(); }
  }
  return result;
}
export function parseCommand(value: unknown): PracticeCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const r = value as Record<string, unknown>;
  if (r.action === "create") return { action: "create", content: parseContent(r.content) };
  if (!validId(r.id) || !Number.isSafeInteger(r.version) || Number(r.version) < 1 || Number(r.version) >= 999999) return invalid();
  const base = { id: r.id, version: Number(r.version) };
  if (r.action === "save") return { ...base, action: "save", content: parseContent(r.content) };
  if (r.action === "submit") return { ...base, action: "submit" };
  if (r.action === "approve" || r.action === "reject") {
    if (typeof r.note !== "string" || r.note.length > 2000 || (r.action === "reject" && !r.note.trim())) return invalid();
    return { ...base, action: r.action, note: r.note.trim() };
  }
  return invalid();
}
export function createPractice(account: Account, content: PracticeContent, id: string, at: string): Practice {
  if (!canAuthor(account)) throw new PracticeError("forbidden", 403);
  if (!validId(id)) return invalid();
  return { ...parseContent(content), id, authorId: account.id, authorName: account.name, version: 1, status: "draft", createdAt: at, updatedAt: at, reviewNote: "", history: [{ action: "create", actorId: account.id, at, note: "" }] };
}
export function transition(practice: Practice, account: Account, command: Exclude<PracticeCommand, { action: "create" }>, at: string): Practice {
  const review = command.action === "approve" || command.action === "reject";
  if (review ? account.role !== "administrator" : !canAuthor(account) || practice.authorId !== account.id) throw new PracticeError("forbidden", 403);
  if (practice.version !== command.version || practice.history.length >= 250 || (review ? practice.status !== "pending" : !["draft", "rejected"].includes(practice.status))) throw new PracticeError("conflict", 409);
  const content = command.action === "save" ? parseContent(command.content) : practice;
  if (command.action === "submit" && [content.description, content.problem, content.method, content.subject, content.educationLevel].some(v => !v.trim())) return invalid();
  const status: PracticeStatus = command.action === "save" ? "draft" : command.action === "submit" ? "pending" : command.action === "approve" ? "approved" : "rejected";
  const note = review ? command.note?.trim() ?? "" : "";
  if (command.action === "reject" && !note) return invalid();
  return { ...practice, ...content, version: practice.version + 1, status, updatedAt: at, reviewNote: note, history: [...practice.history, { action: command.action, actorId: account.id, at, note }] };
}
export function projectBoard(rows: Practice[], account: Account): PracticeBoard {
  const ordered = [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return {
    // Publication never discloses moderation notes or the revision audit trail.
    published: ordered.filter(p => p.status === "approved").map(p => ({ ...p, reviewNote: "", history: [] })),
    mine: canAuthor(account) ? ordered.filter(p => p.authorId === account.id) : [],
    moderation: account.role === "administrator" ? ordered : [],
  };
}
