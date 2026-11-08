// Paraphrased from the user-supplied LORI User Manual, version 1.5,
// John Nesbit, Karen Belfer and Tracey Leacock. PDF pages 2–12.
// LORI evaluates learning objects; its use for lesson plans is an adaptation.
export const LORI_CRITERIA = [
  { id: "content", page: 3, ru: "Качество содержания", ro: "Calitatea conținutului", guidance: "Check accuracy, balanced representation, evidence, significant ideas and appropriate detail. Errors, misleading omissions or bias lower quality." },
  { id: "alignment", page: 4, ru: "Согласованность с целями обучения", ro: "Alinierea cu obiectivele de învățare", guidance: "Check whether stated goals, learner needs, activities and assessment match. Missing goals or substantial mismatches need improvement." },
  { id: "feedback", page: 5, ru: "Обратная связь и адаптация", ro: "Feedback și adaptare", guidance: "Check feedback on learner responses and adaptation to learner needs or prior knowledge. Distinguish simple correctness feedback from meaningful adaptation." },
  { id: "motivation", page: 6, ru: "Мотивация", ro: "Motivație", guidance: "Check relevance to the intended learners, meaningful choices, suitable challenge, realistic success criteria and constructive feedback. Attractive distractions alone do not demonstrate motivation." },
  { id: "presentation", page: 7, ru: "Дизайн представления", ro: "Designul prezentării", guidance: "Check legible text, clear headings and diagrams, coherent explanations and media quality without unnecessary cognitive load. Do not infer visual or audio quality from a lesson title." },
  { id: "usability", page: 8, ru: "Удобство взаимодействия", ro: "Ușurința interacțiunii", guidance: "Check clear instructions, easy navigation, predictable interaction and help. A lesson description alone does not prove that buttons or links function." },
  { id: "accessibility", page: 9, ru: "Доступность", ro: "Accesibilitate", guidance: "Check support for different access needs, captions, transcripts, alternative text, readable flexible presentation, and information that does not depend only on color. The old manual mentions historic accessibility standards; do not claim modern WCAG compliance without an audit." },
  { id: "reuse", page: 10, ru: "Повторное использование", ro: "Reutilizare", guidance: "Check whether the resource can be transferred to other lessons, learner groups and contexts, with understandable prerequisites and without avoidable dependencies." },
  { id: "standards", page: 11, ru: "Соответствие стандартам", ro: "Conformitatea cu standardele", guidance: "For digital learning objects check evidence of relevant metadata, packaging and interoperability specifications (the manual gives IEEE LOM, IMS, SCORM and W3C examples). Never claim certification from prose. This may be not applicable for an ordinary offline lesson." },
] as const;

export type LoriCriterionId = typeof LORI_CRITERIA[number]["id"];
export type LoriAssessment = {
  criterion: LoriCriterionId;
  status: "assessed" | "insufficient_data" | "not_applicable";
  score: number | null;
  evidence: string;
  improvement: string;
};
export type LoriReport = { criteria: LoriAssessment[] };

export function parseLoriReport(value: unknown): LoriReport | null {
  if (!value || typeof value !== "object" || !("criteria" in value) || !Array.isArray(value.criteria) || value.criteria.length !== 9) return null;
  const result: LoriAssessment[] = [];
  for (const criterion of LORI_CRITERIA) {
    const matches = value.criteria.filter(item => item && typeof item === "object" && item.criterion === criterion.id);
    if (matches.length !== 1) return null;
    const item = matches[0] as Record<string, unknown>;
    if (
      !["assessed", "insufficient_data", "not_applicable"].includes(String(item.status)) ||
      (item.status === "assessed" ? !(Number.isInteger(item.score) && Number(item.score) >= 1 && Number(item.score) <= 5) : item.score !== null) ||
      typeof item.evidence !== "string" || !item.evidence.trim() || item.evidence.length > 700 ||
      typeof item.improvement !== "string" || !item.improvement.trim() || item.improvement.length > 500
    ) return null;
    result.push({ criterion: criterion.id, status: item.status as LoriAssessment["status"], score: item.score as number | null, evidence: item.evidence.trim(), improvement: item.improvement.trim() });
  }
  return { criteria: result };
}
