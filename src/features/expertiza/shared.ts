import type { AccountRole } from "@/lib/accounts";

export const EXPERTIZA_BUCKET = "edumentor-expertiza";
export const EXPERTIZA_SEED = "catalog/v1.json";
export type AuthorRole = AccountRole | "ai" | "demo";
export type Person = {
  id: string;
  name: string;
  role: AccountRole;
  school: string;
  subject: string;
};
export type Community = {
  id: string;
  name: string;
  description: string;
  school: string;
  color: string;
  joined: boolean;
  members: number;
  pinned: boolean;
  demo: boolean;
};
export type Reply = {
  id: string;
  questionId: string;
  authorId: string | null;
  authorName: string;
  role: AuthorRole;
  body: string;
  createdAt: string;
  demo?: boolean;
  provider?: "openai";
};
export type Question = {
  id: string;
  communityId: string | null;
  title: string;
  body: string;
  authorId: string | null;
  authorName: string;
  role: AuthorRole;
  createdAt: string;
  demo?: boolean;
  pinned: boolean;
  replies: Reply[];
  likes: number;
  liked: boolean;
};
export type Review = {
  id: string;
  authorId: string | null;
  authorName: string;
  stars: number;
  body: string;
  demo: boolean;
};
export type Teacher = {
  id: string;
  name: string;
  subject: string;
  position: string;
  reviews: Review[];
};
export type Rule = { id: string; title: string; body: string; demo: boolean };
export type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};
export type ExpertizaState = {
  me: Person;
  contacts: Person[];
  communities: Community[];
  questions: Question[];
  teachers: Teacher[];
  rules: Rule[];
  schools: {
    n: string;
    a: string;
    el: number;
    pr: number;
    d: string;
    y: number;
    c: string;
  }[];
  events: { d: string; m: string; t: string; p: string; c: string }[];
  tips: string[];
  archived: { kind: "question" | "community"; id: string; title: string }[];
};
export type SourceSeed = {
  version: number;
  demo: boolean;
  source: string;
  teachers: {
    id: number;
    n: string;
    s: string;
    r: string;
    rev: [number, string, string][];
  }[];
  questions: {
    id: number;
    k: number;
    a: string;
    r: string;
    t: string;
    b: string;
    l: number;
    c: [string, string, string][];
  }[];
  communities: {
    id: number;
    n: string;
    e: string;
    d: string;
    m: number;
    j: boolean;
    c: string;
    i: string;
  }[];
  schools: ExpertizaState["schools"];
  rules: { t: string; b: string }[];
  events: ExpertizaState["events"];
  tips: string[];
};
export function validId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{1,64}$/.test(value);
}
export function validUserId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
function text(value: unknown, max: number, required = true): value is string {
  return (
    typeof value === "string" &&
    value.length <= max &&
    (!required || value.trim().length > 0)
  );
}
export type Command =
  | {
      action: "question";
      title: string;
      body: string;
      communityId: string | null;
    }
  | { action: "answer"; questionId: string; body: string }
  | { action: "like"; questionId: string; active: boolean }
  | { action: "join"; communityId: string; active: boolean }
  | { action: "review"; teacherId: string; stars: number; body: string }
  | { action: "profile"; name: string; school: string; subject: string }
  | { action: "community"; name: string; description: string; school: string }
  | { action: "rule"; title: string; body: string }
  | {
      action: "moderate";
      kind: "question" | "community";
      id: string;
      flag: "pinned" | "archived";
      active: boolean;
    }
  | { action: "message"; recipientId: string; body: string }
  | { action: "ai"; questionId: string };

export function parseCommand(value: unknown): Command | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const b = value as Record<string, unknown>;
  switch (b.action) {
    case "question":
      if (
        text(b.title, 140) &&
        text(b.body, 2000, false) &&
        (b.communityId === null || validId(b.communityId))
      )
        return {
          action: b.action,
          title: b.title.trim(),
          body: b.body.trim(),
          communityId: b.communityId,
        };
      break;
    case "answer":
      if (validId(b.questionId) && text(b.body, 2000))
        return {
          action: b.action,
          questionId: b.questionId,
          body: b.body.trim(),
        };
      break;
    case "like":
      if (validId(b.questionId) && typeof b.active === "boolean")
        return { action: b.action, questionId: b.questionId, active: b.active };
      break;
    case "join":
      if (validId(b.communityId) && typeof b.active === "boolean")
        return {
          action: b.action,
          communityId: b.communityId,
          active: b.active,
        };
      break;
    case "review":
      if (
        validId(b.teacherId) &&
        Number.isInteger(b.stars) &&
        Number(b.stars) >= 1 &&
        Number(b.stars) <= 5 &&
        text(b.body, 1000)
      )
        return {
          action: b.action,
          teacherId: b.teacherId,
          stars: Number(b.stars),
          body: b.body.trim(),
        };
      break;
    case "profile":
      if (
        text(b.name, 80) &&
        text(b.school, 120, false) &&
        text(b.subject, 80, false)
      )
        return {
          action: b.action,
          name: b.name.trim(),
          school: b.school.trim(),
          subject: b.subject.trim(),
        };
      break;
    case "community":
      if (text(b.name, 100) && text(b.description, 500) && text(b.school, 120))
        return {
          action: b.action,
          name: b.name.trim(),
          description: b.description.trim(),
          school: b.school.trim(),
        };
      break;
    case "rule":
      if (text(b.title, 140) && text(b.body, 4000))
        return { action: b.action, title: b.title.trim(), body: b.body.trim() };
      break;
    case "moderate":
      if (
        ["question", "community"].includes(b.kind as string) &&
        validId(b.id) &&
        ["pinned", "archived"].includes(b.flag as string) &&
        typeof b.active === "boolean"
      )
        return {
          action: b.action,
          kind: b.kind as "question" | "community",
          id: b.id,
          flag: b.flag as "pinned" | "archived",
          active: b.active,
        };
      break;
    case "message":
      if (validUserId(b.recipientId) && text(b.body, 2000))
        return {
          action: b.action,
          recipientId: b.recipientId,
          body: b.body.trim(),
        };
      break;
    case "ai":
      if (validId(b.questionId))
        return { action: b.action, questionId: b.questionId };
      break;
  }
  return null;
}
export function requiresAdmin(action: Command["action"]) {
  return action === "community" || action === "rule" || action === "moderate";
}
export function conversationPath(userId: string, recipientId: string) {
  if (
    !validUserId(userId) ||
    !validUserId(recipientId) ||
    userId === recipientId
  )
    throw new Error("Invalid participants.");
  return `messages/${[userId.toLowerCase(), recipientId.toLowerCase()].sort().join("_")}`;
}
export function validateSeed(value: unknown): SourceSeed {
  const seed = value as SourceSeed;
  if (
    seed?.version !== 1 ||
    !seed.demo ||
    ![
      seed.teachers,
      seed.questions,
      seed.communities,
      seed.schools,
      seed.rules,
      seed.events,
      seed.tips,
    ].every(Array.isArray)
  )
    throw new Error("Invalid Expertiza seed.");
  if (
    seed.teachers.length > 100 ||
    seed.questions.length > 200 ||
    seed.communities.length > 100
  )
    throw new Error("Expertiza seed exceeds limits.");
  return seed;
}
