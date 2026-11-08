import { prompts, type Locale, type PromptKey } from "./demo";

export const MAX_HISTORY_TURNS = 4;
export const MAX_ANSWER_LENGTH = 4000;
export const MAX_QUESTION_LENGTH = 2000;

export type MentorQuestion =
  | { promptKey: PromptKey; question?: never }
  | { question: string; promptKey?: never };

export type MentorHistoryTurn = MentorQuestion & {
  locale: Locale;
  answer: string;
};
export type MentorRequest = MentorQuestion & {
  locale: Locale;
  history: MentorHistoryTurn[];
};
export type MentorAnswer = { answer: string; sourceSections: number[] };
export type MentorReply = MentorAnswer & { provider: "openai"; model: string };
export type MentorErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_configured"
  | "invalid_request"
  | "rate_limited"
  | "quota_exceeded"
  | "provider_auth"
  | "unavailable"
  | "timeout"
  | "invalid_response"
  | "refused";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPromptKey(value: unknown): value is PromptKey {
  return typeof value === "string" && Object.hasOwn(prompts, value);
}

function parseQuestion(value: Record<string, unknown>): MentorQuestion | null {
  if (value.question !== undefined) {
    if (
      value.promptKey !== undefined ||
      typeof value.question !== "string" ||
      !value.question.trim() ||
      value.question.length > MAX_QUESTION_LENGTH
    ) return null;
    return { question: value.question.trim() };
  }
  return isPromptKey(value.promptKey) ? { promptKey: value.promptKey } : null;
}

export function mentorQuestionText(value: MentorQuestion, locale: Locale): string {
  return value.question ?? prompts[value.promptKey!].label[locale];
}

export function parseMentorRequest(value: unknown): MentorRequest | null {
  if (
    !isRecord(value) ||
    (value.locale !== "ro" && value.locale !== "ru")
  )
    return null;
  const question = parseQuestion(value);
  if (!question) return null;
  const history = value.history ?? [];
  if (!Array.isArray(history) || history.length > MAX_HISTORY_TURNS)
    return null;
  const parsedHistory: MentorHistoryTurn[] = [];
  for (const turn of history) {
    if (
      !isRecord(turn) ||
      (turn.locale !== "ro" && turn.locale !== "ru") ||
      typeof turn.answer !== "string" ||
      !turn.answer.trim() ||
      turn.answer.length > MAX_ANSWER_LENGTH
    )
      return null;
    const priorQuestion = parseQuestion(turn);
    if (!priorQuestion) return null;
    parsedHistory.push({
      ...priorQuestion,
      locale: turn.locale,
      answer: turn.answer,
    });
  }
  return {
    ...question,
    locale: value.locale,
    history: parsedHistory,
  };
}

export function parseMentorAnswer(value: unknown): MentorAnswer | null {
  if (
    !isRecord(value) ||
    typeof value.answer !== "string" ||
    !value.answer.trim() ||
    value.answer.length > MAX_ANSWER_LENGTH ||
    !Array.isArray(value.sourceSections) ||
    value.sourceSections.length > 3 ||
    !value.sourceSections.every(
      (section) => Number.isInteger(section) && section >= 1 && section <= 3,
    )
  )
    return null;
  return {
    answer: value.answer.trim(),
    sourceSections: [...new Set<number>(value.sourceSections)],
  };
}

export function parseMentorReply(value: unknown): MentorReply | null {
  const answer = parseMentorAnswer(value);
  if (
    !answer ||
    !isRecord(value) ||
    value.provider !== "openai" ||
    typeof value.model !== "string"
  )
    return null;
  return { ...answer, provider: "openai", model: value.model };
}
