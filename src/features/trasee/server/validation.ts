import { COMPETENCY_BY_ID, DISCIPLINES } from "../shared/dictionary";
import type { SearchRequest } from "../shared/types";
import { validCourseId } from "../shared/catalog";

export function parseSearch(value: unknown): SearchRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const b = value as Record<string, unknown>;
  const strings = (v: unknown, max: number) =>
    Array.isArray(v) &&
    v.length <= max &&
    v.every((x) => typeof x === "string");
  if (
    typeof b.text !== "string" ||
    b.text.length > 800 ||
    typeof b.stage !== "string" ||
    ![
      "",
      "prescolar",
      "primar",
      "gl",
      "ipt",
      "management",
      "superior",
    ].includes(b.stage) ||
    typeof b.discipline !== "string" ||
    (b.discipline !== "" && !Object.hasOwn(DISCIPLINES, b.discipline)) ||
    !["oricand", "curand", "pana-in-iunie"].includes(b.when as string) ||
    !["oricare", "online", "fata-in-fata"].includes(b.format as string) ||
    ![0, 5, 10].includes(b.minCredits as number) ||
    !strings(b.done, 1000) ||
    !(b.done as string[]).every(validCourseId) ||
    (b.competencies !== undefined &&
      (!strings(b.competencies, 20) ||
        !(b.competencies as string[]).every((id) =>
          Object.hasOwn(COMPETENCY_BY_ID, id),
        )))
  )
    return null;
  if (
    !b.text.trim() &&
    !b.discipline &&
    !(b.competencies as string[] | undefined)?.length
  )
    return null;
  return {
    text: b.text,
    stage: b.stage,
    discipline: b.discipline,
    when: b.when,
    format: b.format,
    minCredits: b.minCredits,
    done: b.done,
    ...(b.competencies === undefined ? {} : { competencies: b.competencies }),
  } as SearchRequest;
}
