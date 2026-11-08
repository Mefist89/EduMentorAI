import snapshot from "./catalog.json";

export const categories = [
  { id: "formari", ro: "Cursuri și formări", ru: "Курсы и обучение" },
  { id: "concursuri", ro: "Concursuri", ru: "Конкурсы" },
  {
    id: "finantari",
    ro: "Granturi și finanțări",
    ru: "Гранты и финансирование",
  },
  { id: "evenimente", ro: "Evenimente", ru: "События" },
  { id: "resurse", ro: "Resurse", ru: "Ресурсы" },
  { id: "comunitati", ro: "Comunități", ru: "Сообщества" },
  { id: "mentorat", ro: "Mentorat", ru: "Наставничество" },
  { id: "proiecte", ro: "Proiecte", ru: "Проекты" },
  { id: "activitati", ro: "Activități", ru: "Задания" },
] as const;
export const audiences = [
  { id: "Elevi", ro: "Elevi", ru: "Ученики" },
  { id: "Profesori", ro: "Profesori", ru: "Учителя" },
  { id: "Școli", ro: "Școli", ru: "Школы" },
] as const;
export type Category = (typeof categories)[number]["id"];
export type Audience = (typeof audiences)[number]["id"];
export type CatalogEntry = {
  id: string;
  title: string;
  provider: string;
  summary: string;
  source: string;
  category: Category;
  audience: Audience[];
  kind: string;
  status: string;
  checkedAt: string;
  references: [string, string][];
  keywords?: string;
  deadline?: string;
  deadlineLabel?: string;
  event?: string[];
  when?: string;
  cost?: string;
  eligible?: string;
  next?: string;
};
export type Filters = {
  query: string;
  category: Category | "toate";
  audience: Audience | "toate";
  hidePast: boolean;
};
export const initialFilters: Filters = {
  query: "",
  category: "toate",
  audience: "toate",
  hidePast: false,
};
function isDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
function safeUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function validateCatalog(value: unknown): CatalogEntry[] {
  const data = value as { version?: number; entries?: unknown[] };
  if (
    data?.version !== 1 ||
    !Array.isArray(data.entries) ||
    data.entries.length > 500
  )
    throw new Error("Invalid Puntea catalog.");
  const ids = new Set<string>();
  for (const raw of data.entries) {
    const e = raw as CatalogEntry;
    if (
      !e ||
      typeof e.id !== "string" ||
      !/^[a-z0-9-]{1,80}$/.test(e.id) ||
      ids.has(e.id)
    )
      throw new Error("Invalid catalog identity.");
    ids.add(e.id);
    if (
      ![e.title, e.provider, e.summary, e.kind, e.status].every(
        (s) => typeof s === "string" && s.trim().length > 0,
      ) ||
      !safeUrl(e.source) ||
      !isDay(e.checkedAt)
    )
      throw new Error("Invalid catalog content or URL.");
    if (
      !categories.some((c) => c.id === e.category) ||
      !Array.isArray(e.audience) ||
      !e.audience.every((a) => audiences.some((item) => item.id === a))
    )
      throw new Error("Invalid category or audience.");
    if (
      !Array.isArray(e.references) ||
      !e.references.every(
        (r) =>
          Array.isArray(r) &&
          r.length === 2 &&
          typeof r[0] === "string" &&
          r[0].trim() &&
          safeUrl(r[1]),
      )
    )
      throw new Error("Invalid reference URL or pair.");
    if (
      (e.deadline !== undefined && !isDay(e.deadline)) ||
      (e.event !== undefined &&
        (!Array.isArray(e.event) || !e.event.every(isDay)))
    )
      throw new Error("Invalid catalog date.");
  }
  return data.entries as CatalogEntry[];
}
export const catalog = validateCatalog(snapshot);
export function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro-MD");
}
export function todayInBucharest(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function isPast(entry: CatalogEntry, today: string) {
  if (!isDay(today)) return false;
  // A supplied registration deadline takes priority over a later event date.
  const last = entry.deadline || entry.event?.slice().sort().at(-1);
  return Boolean(last && last < today);
}
export type Timing =
  | "expired"
  | "past-event"
  | "deadline"
  | "event"
  | "conflict"
  | "check"
  | "resource";
export function timing(entry: CatalogEntry, today: string): Timing {
  if (entry.status === "conflict") return "conflict";
  if (isPast(entry, today)) return entry.deadline ? "expired" : "past-event";
  if (entry.deadline) return "deadline";
  if (entry.event?.length) return "event";
  return entry.status === "check" ? "check" : "resource";
}
export function filterCatalog(
  entries: CatalogEntry[],
  filters: Filters,
  today: string,
) {
  const terms = fold(filters.query.trim().slice(0, 160))
    .split(/\s+/)
    .filter(Boolean);
  return entries.filter((e) => {
    if (filters.category !== "toate" && filters.category !== e.category)
      return false;
    if (
      filters.audience !== "toate" &&
      e.audience.length > 0 &&
      !e.audience.includes(filters.audience)
    )
      return false;
    if (filters.hidePast && isPast(e, today)) return false;
    const category = categories.find((c) => c.id === e.category)!;
    const text = fold(
      [
        e.title,
        e.provider,
        e.summary,
        e.eligible,
        e.next,
        e.keywords,
        e.kind,
        category.ro,
        category.ru,
        ...e.audience.flatMap((a) => {
          const item = audiences.find((x) => x.id === a)!;
          return [item.ro, item.ru];
        }),
      ]
        .filter(Boolean)
        .join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
}
