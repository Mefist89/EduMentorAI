import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import { accountRole, roleLabels, type Account } from "@/lib/accounts";
import {
  EXPERTIZA_BUCKET,
  EXPERTIZA_SEED,
  conversationPath,
  validUserId,
  validateSeed,
  type Person,
  type SourceSeed,
  type ExpertizaState,
  type Question,
  type Reply,
  type Community,
  type Review,
  type Rule,
  type Message,
} from "../shared";

const bucket = () => createAdminClient().storage.from(EXPERTIZA_BUCKET);
type Document = Record<string, unknown>;
let seedCache: { at: number; seed: SourceSeed } | undefined;
export async function seedData() {
  if (seedCache && Date.now() - seedCache.at < 300_000) return seedCache.seed;
  const { data, error } = await bucket().download(EXPERTIZA_SEED);
  if (error || !data) throw new Error("Expertiza seed unavailable.");
  const seed = validateSeed(JSON.parse(await data.text()));
  seedCache = { at: Date.now(), seed };
  return seed;
}
export async function put(path: string, value: unknown, upsert = false) {
  const { error } = await bucket().upload(path, JSON.stringify(value), {
    contentType: "application/json",
    upsert,
    cacheControl: "0",
  });
  if (error) throw new Error("Expertiza write failed.");
}
export async function removeOwn(path: string) {
  const { error } = await bucket().remove([path]);
  if (error) throw new Error("Expertiza update failed.");
}
async function files(prefix: string, limit = 200) {
  const { data, error } = await bucket().list(prefix, {
    limit,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error("Expertiza read failed.");
  return (data ?? []).filter((f) => f.id && f.name.endsWith(".json"));
}
async function records(prefix: string, limit = 200): Promise<Document[]> {
  const list = await files(prefix, limit),
    result: Document[] = [];
  for (let i = 0; i < list.length; i += 8)
    result.push(
      ...(await Promise.all(
        list.slice(i, i + 8).map(async (file) => {
          const { data, error } = await bucket().download(
            `${prefix}/${file.name}`,
          );
          if (error || !data)
            throw new Error("Expertiza document unavailable.");
          return JSON.parse(await data.text()) as Document;
        }),
      )),
    );
  return result;
}
export async function contacts(): Promise<Person[]> {
  const client = createAdminClient();
  const { data, error } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw new Error("Account directory unavailable.");
  const profiles = await records("profiles", 1000);
  return data.users.flatMap((user) => {
    const role = accountRole(user.app_metadata?.edumentor_role);
    if (!role) return [];
    const profile = profiles.find((p) => p.id === user.id);
    return [
      {
        id: user.id,
        role,
        name:
          typeof profile?.name === "string"
            ? profile.name
            : roleLabels[role].ro,
        school:
          typeof profile?.school === "string"
            ? profile.school
            : "Spațiu demonstrativ EduMentor",
        subject: typeof profile?.subject === "string" ? profile.subject : "",
      },
    ];
  });
}
export async function board(account: Account): Promise<ExpertizaState> {
  const [
    seed,
    people,
    questions,
    replies,
    reviews,
    communities,
    rules,
    moderation,
    likes,
    members,
  ] = await Promise.all([
    seedData(),
    contacts(),
    records("questions"),
    records("answers"),
    records("reviews"),
    records("communities"),
    records("rules"),
    records("moderation"),
    files("likes", 1000),
    files("members", 1000),
  ]);
  const me = people.find((p) => p.id === account.id);
  if (!me) throw new Error("Account unavailable.");
  const flag = (kind: string, id: string, key: string) =>
    moderation.some(
      (m) =>
        m.kind === kind && m.id === id && m.flag === key && m.active === true,
    );
  const allCommunities: Community[] = [
    ...seed.communities.map((c) => ({
      id: `seed-community-${c.id}`,
      name: c.n,
      description: c.d,
      school: c.i,
      color: c.c,
      joined: false,
      members: 0,
      pinned: false,
      demo: true,
    })),
    ...(communities as unknown as Community[]),
  ];
  for (const c of allCommunities) {
    const entries = members.filter((m) => m.name.startsWith(`${c.id}__`));
    c.joined = entries.some((m) => m.name === `${c.id}__${account.id}.json`);
    c.members = entries.length;
    c.pinned = flag("community", c.id, "pinned");
  }
  const allQuestions: Question[] = [
    ...seed.questions.map((q) => ({
      id: `seed-question-${q.id}`,
      communityId: `seed-community-${q.k}`,
      authorId: null,
      authorName: q.a,
      role: "demo" as const,
      title: q.t,
      body: q.b,
      createdAt: "2026-11-07T12:00:00Z",
      demo: true,
      pinned: false,
      replies: [],
      likes: 0,
      liked: false,
    })),
    ...(questions as unknown as Question[]),
  ];
  for (const q of allQuestions) {
    const source = seed.questions.find((s) => `seed-question-${s.id}` === q.id);
    const imported: Reply[] = (source?.c ?? []).map(
      ([name, _role, body], i) => ({
        id: `${q.id}-reply-${i}`,
        questionId: q.id,
        authorId: null,
        authorName: name,
        role: "demo",
        body,
        createdAt: q.createdAt,
        demo: true,
      }),
    );
    q.replies = [
      ...imported,
      ...(replies.filter((r) => r.questionId === q.id) as unknown as Reply[]),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const votes = likes.filter((f) => f.name.startsWith(`${q.id}__`));
    q.likes = votes.length;
    q.liked = votes.some((f) => f.name === `${q.id}__${account.id}.json`);
    q.pinned = flag("question", q.id, "pinned");
  }
  const archived: ExpertizaState["archived"] =
    account.role === "administrator"
      ? [
          ...allQuestions
            .filter((q) => flag("question", q.id, "archived"))
            .map((q) => ({
              kind: "question" as const,
              id: q.id,
              title: q.title,
            })),
          ...allCommunities
            .filter((c) => flag("community", c.id, "archived"))
            .map((c) => ({
              kind: "community" as const,
              id: c.id,
              title: c.name,
            })),
        ]
      : [];
  const visibleCommunities = allCommunities
    .filter((c) => !flag("community", c.id, "archived"))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return {
    me,
    contacts: people.filter((p) => p.id !== account.id),
    communities: visibleCommunities,
    questions: allQuestions
      .filter(
        (q) =>
          !flag("question", q.id, "archived") &&
          (!q.communityId ||
            visibleCommunities.some((c) => c.id === q.communityId)),
      )
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.createdAt.localeCompare(a.createdAt),
      ),
    teachers: seed.teachers.map((t) => ({
      id: `seed-teacher-${t.id}`,
      name: t.n,
      subject: t.s,
      position: t.r,
      reviews: [
        ...t.rev.map(([stars, authorName, body], i) => ({
          id: `seed-review-${t.id}-${i}`,
          authorId: null,
          authorName,
          stars,
          body,
          demo: true,
        })),
        ...reviews
          .filter((r) => r.teacherId === `seed-teacher-${t.id}`)
          .map((r) => ({
            id: String(r.id),
            authorId: String(r.authorId),
            authorName: String(r.authorName),
            stars: Number(r.stars),
            body: String(r.body),
            demo: false,
          })),
      ] as Review[],
    })),
    rules: [
      ...seed.rules.map((r, i) => ({
        id: `seed-rule-${i}`,
        title: r.t,
        body: r.b,
        demo: true,
      })),
      ...(rules as unknown as Rule[]),
    ],
    schools: seed.schools,
    events: seed.events,
    tips: seed.tips,
    archived,
  };
}
export async function messageHistory(
  userId: string,
  recipientId: string,
): Promise<Message[]> {
  const path = conversationPath(userId, recipientId);
  const rows = await records(path, 100);
  return (rows as unknown as Message[]).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}
export async function sendMessage(
  userId: string,
  recipientId: string,
  body: string,
) {
  const path = conversationPath(userId, recipientId),
    id = randomUUID();
  await put(`${path}/${id}.json`, {
    id,
    senderId: userId,
    body,
    createdAt: new Date().toISOString(),
  });
}
export function ownKey(prefix: string, entityId: string, userId: string) {
  if (
    !validUserId(userId) ||
    !/^[a-zA-Z0-9-]{1,64}$/.test(entityId) ||
    !["likes", "members", "reviews"].includes(prefix)
  )
    throw new Error("Invalid owner path.");
  return `${prefix}/${entityId}__${userId}.json`;
}
