import type { Catalog } from "./types";

export const TRASEE_BUCKET = "edumentor-trasee";
export const CATALOG_PATH = "catalog/v1.json";
export function validCourseId(id: unknown): id is string {
  return typeof id === "string" && /^[\w:-]{1,64}$/.test(id);
}
export function validateCatalog(value: unknown): Catalog {
  const c = value as Catalog;
  if (
    !c ||
    !Array.isArray(c.courses) ||
    !Array.isArray(c.providers) ||
    !Array.isArray(c.competencies) ||
    !Array.isArray(c.skills) ||
    !c.courses.length ||
    c.courses.length > 2000 ||
    !c.providers.length ||
    c.providers.length > 100
  )
    throw new Error("Invalid catalog.");
  const ids = new Set<string>();
  for (const course of c.courses) {
    if (
      !validCourseId(course.id) ||
      ids.has(course.id) ||
      typeof course.title !== "string" ||
      !c.providers.some((p) => p.id === course.providerId)
    )
      throw new Error("Invalid course identity.");
    ids.add(course.id);
    for (const link of Object.values(course.links))
      if (link && !/^https?:$/.test(new URL(link).protocol))
        throw new Error("Invalid source URL.");
    if (
      ![
        course.variants,
        course.sessions,
        course.competencies,
        course.skills,
      ].every(Array.isArray)
    )
      throw new Error("Invalid course data.");
  }
  return c;
}
