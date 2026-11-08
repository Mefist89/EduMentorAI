import type { Account } from "@/lib/accounts";

export const COHORTS_BUCKET = "edumentor-cohorts";
export const MAX_MEMBERS = 100;
export type CohortContent = { name: string; subject: string; educationLevel: string; description: string };
export const emptyCohort: CohortContent = { name: "", subject: "", educationLevel: "", description: "" };
export const limits = { name: 120, subject: 100, educationLevel: 100, description: 2000 } as const;
export type StudentOption = { id: string; name: string; login: string; available: boolean };
export type Cohort = CohortContent & { id: string; teacherId: string; teacherName: string; studentIds: string[]; version: number; createdAt: string; updatedAt: string };
export type CohortView = Omit<Cohort, "studentIds"> & { canManage: boolean; studentCount: number; members: StudentOption[] };
export type CohortBoard = { cohorts: CohortView[]; students: StudentOption[] };
export type CohortCommand = { action: "create"; content: CohortContent } | { action: "edit"; id: string; version: number; content: CohortContent } | { action: "add"; id: string; version: number; studentIds: string[] } | { action: "remove"; id: string; version: number; studentId: string };
export class CohortError extends Error {
  constructor(public code: "invalid" | "forbidden" | "not_found" | "conflict" | "invalid_student" | "full" | "unavailable", public status: number) { super(code); }
}
export const validId = (id: unknown): id is string => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export const canCreate = (account: Account) => account.role === "profesor" || account.role === "administrator";
export const canManage = (cohort: Cohort, account: Account) => account.role === "administrator" || (account.role === "profesor" && account.id === cohort.teacherId);
function invalid(): never { throw new CohortError("invalid", 400); }
export function parseContent(value: unknown): CohortContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const raw = value as Record<string, unknown>, result = { ...emptyCohort };
  for (const key of Object.keys(limits) as (keyof CohortContent)[]) {
    const text = raw[key];
    if (typeof text !== "string" || text.length > limits[key] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) return invalid();
    result[key] = text.trim();
  }
  if (!result.name) return invalid();
  return result;
}
export function parseCommand(value: unknown): CohortCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const raw = value as Record<string, unknown>;
  if (raw.action === "create") return { action: "create", content: parseContent(raw.content) };
  if (!validId(raw.id) || !Number.isSafeInteger(raw.version) || Number(raw.version) < 1 || Number(raw.version) >= 999999) return invalid();
  const base = { id: raw.id, version: Number(raw.version) };
  if (raw.action === "edit") return { ...base, action: "edit", content: parseContent(raw.content) };
  if (raw.action === "remove" && validId(raw.studentId)) return { ...base, action: "remove", studentId: raw.studentId };
  if (raw.action === "add" && Array.isArray(raw.studentIds) && raw.studentIds.length > 0 && raw.studentIds.length <= MAX_MEMBERS && raw.studentIds.every(validId)) return { ...base, action: "add", studentIds: [...new Set(raw.studentIds as string[])] };
  return invalid();
}
export function createCohort(account: Account, content: CohortContent, id: string, at: string): Cohort {
  if (!canCreate(account)) throw new CohortError("forbidden", 403);
  if (!validId(id)) return invalid();
  return { ...parseContent(content), id, teacherId: account.id, teacherName: account.name, studentIds: [], version: 1, createdAt: at, updatedAt: at };
}
export function changeCohort(cohort: Cohort, account: Account, command: Exclude<CohortCommand, { action: "create" }>, students: StudentOption[], at: string): Cohort {
  if (!canManage(cohort, account)) throw new CohortError("forbidden", 403);
  if (cohort.version !== command.version) throw new CohortError("conflict", 409);
  let studentIds = cohort.studentIds;
  let content: CohortContent = cohort;
  if (command.action === "edit") content = parseContent(command.content);
  if (command.action === "add") {
    const eligible = new Set(students.filter(s => s.available).map(s => s.id));
    if (command.studentIds.some(id => !eligible.has(id))) throw new CohortError("invalid_student", 400);
    studentIds = [...new Set([...studentIds, ...command.studentIds])];
    if (studentIds.length > MAX_MEMBERS) throw new CohortError("full", 400);
  }
  if (command.action === "remove") {
    if (!studentIds.includes(command.studentId)) throw new CohortError("conflict", 409);
    studentIds = studentIds.filter(id => id !== command.studentId);
  }
  return { ...cohort, ...content, studentIds, version: cohort.version + 1, updatedAt: at };
}
export function projectBoard(cohorts: Cohort[], account: Account, students: StudentOption[]): CohortBoard {
  const directory = new Map(students.map(s => [s.id, s]));
  return {
    cohorts: cohorts.filter(c => canManage(c, account) || (account.role === "elev" && c.studentIds.includes(account.id))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(c => {
      const { studentIds, ...metadata } = c;
      const manage = canManage(c, account);
      return { ...metadata, canManage: manage, studentCount: studentIds.length, members: manage ? studentIds.map(id => directory.get(id) ?? { id, name: "Cont indisponibil", login: "", available: false }) : [] };
    }),
    students: canCreate(account) ? students : [],
  };
}
