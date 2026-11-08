"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Lightbulb,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { prompts, type Locale, type PromptKey, type View } from "@/lib/demo";
import {
  MAX_HISTORY_TURNS,
  parseMentorReply,
  type MentorAnswer,
  type MentorErrorCode,
} from "@/lib/mentor-contract";
import { Action, Badge, Heading } from "./ui";

type Turn = {
  id: string;
  promptKey: PromptKey;
  locale: Locale;
  status: "loading" | "done" | "error";
  reply?: MentorAnswer;
  provider?: "openai" | "example";
  error?: MentorErrorCode;
};

const errors: Record<MentorErrorCode, { ro: string; ru: string }> = {
  not_configured: {
    ro: "Mentorul nu este conectat momentan. Poți explora răspunsul exemplu.",
    ru: "Наставник пока не подключён. Вы можете посмотреть пример ответа.",
  },
  invalid_request: {
    ro: "Întrebarea nu a putut fi trimisă. Reia conversația și încearcă din nou.",
    ru: "Не удалось отправить вопрос. Начните диалог заново.",
  },
  rate_limited: {
    ro: "Sunt prea multe solicitări în acest moment. Încearcă din nou peste un minut.",
    ru: "Сейчас слишком много запросов. Попробуйте снова через минуту.",
  },
  quota_exceeded: {
    ro: "Serviciul AI nu poate genera un răspuns momentan. Poți vedea răspunsul exemplu.",
    ru: "AI пока не может создать ответ. Вы можете посмотреть готовый пример.",
  },
  provider_auth: {
    ro: "Conexiunea cu mentorul nu este disponibilă momentan. Poți vedea un răspuns exemplu.",
    ru: "Соединение с наставником пока недоступно. Вы можете посмотреть пример ответа.",
  },
  unavailable: {
    ro: "Mentorul nu a putut răspunde. Reîncearcă sau explorează răspunsul exemplu.",
    ru: "Наставник не смог ответить. Повторите попытку или посмотрите пример.",
  },
  timeout: {
    ro: "Răspunsul durează mai mult decât era de așteptat. Poți reîncerca.",
    ru: "Ответ занимает больше времени, чем ожидалось. Попробуйте снова.",
  },
  invalid_response: {
    ro: "Răspunsul nu a putut fi afișat corect. Reîncearcă sau vezi exemplul pregătit.",
    ru: "Не удалось корректно показать ответ. Повторите попытку или откройте готовый пример.",
  },
  refused: {
    ro: "Mentorul nu a generat un răspuns pentru această solicitare. Alege o altă întrebare.",
    ru: "Наставник не создал ответ на этот запрос. Выберите другой вопрос.",
  },
};

export function MentorChat({
  locale,
  go,
}: {
  locale: Locale;
  go: (view: View) => void;
}) {
  const [conversation, setConversation] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  async function ask(promptKey: PromptKey, retryId?: string) {
    if (controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    const id = retryId ?? crypto.randomUUID();
    const turnLocale = retryId
      ? conversation.find((turn) => turn.id === retryId)!.locale
      : locale;
    const context = retryId
      ? conversation.slice(
          0,
          conversation.findIndex((turn) => turn.id === retryId),
        )
      : conversation;
    const history = context
      .filter(
        (turn) =>
          turn.status === "done" && turn.provider === "openai" && turn.reply,
      )
      .slice(-MAX_HISTORY_TURNS)
      .map((turn) => ({
        promptKey: turn.promptKey,
        locale: turn.locale,
        answer: turn.reply!.answer,
      }));
    setConversation((previous) =>
      retryId
        ? previous.map((turn) =>
            turn.id === retryId
              ? { ...turn, status: "loading", error: undefined }
              : turn,
          )
        : [
            ...previous,
            { id, promptKey, locale: turnLocale, status: "loading" },
          ],
    );

    try {
      const response = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptKey, locale: turnLocale, history }),
        signal: controller.signal,
      });
      const data: unknown = await response.json();
      if (controller.signal.aborted) return;
      const reply = response.ok ? parseMentorReply(data) : null;
      if (!reply) {
        const code =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "object" &&
          data.error !== null &&
          "code" in data.error
            ? data.error.code
            : null;
        const error: MentorErrorCode =
          typeof code === "string" && Object.hasOwn(errors, code)
            ? (code as MentorErrorCode)
            : "invalid_response";
        setConversation((previous) =>
          previous.map((turn) =>
            turn.id === id ? { ...turn, status: "error", error } : turn,
          ),
        );
        return;
      }
      setConversation((previous) =>
        previous.map((turn) =>
          turn.id === id
            ? { ...turn, status: "done", reply, provider: "openai" }
            : turn,
        ),
      );
    } catch {
      if (!controller.signal.aborted)
        setConversation((previous) =>
          previous.map((turn) =>
            turn.id === id
              ? { ...turn, status: "error", error: "unavailable" }
              : turn,
          ),
        );
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setBusy(false);
      }
    }
  }

  function useExample(id: string) {
    setConversation((previous) =>
      previous.map((turn) => {
        if (turn.id !== id) return turn;
        const example = prompts[turn.promptKey];
        return {
          ...turn,
          status: "done",
          error: undefined,
          provider: "example",
          reply: {
            answer: example.answer[turn.locale],
            sourceSections: example.source ? [example.source] : [],
          },
        };
      }),
    );
  }

  function reset() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setBusy(false);
    setConversation([]);
  }

  return (
    <>
      <Heading
        eyebrow={t("AI MENTOR", "AI-НАСТАВНИК")}
        title={t(
          "Un spațiu pentru întrebările tale.",
          "Место для ваших вопросов.",
        )}
        description={t(
          "Alege o întrebare exemplu. Mentorul răspunde pe baza materialului de curs.",
          "Выберите готовый вопрос. Наставник ответит на основе материала курса.",
        )}
        action={
          <Badge>
            <Sparkles size={13} />
            OpenAI
          </Badge>
        }
      />
      <div className="mentor-layout">
        <section
          className="panel chat-panel"
          aria-label={t("Conversație cu mentorul", "Диалог с наставником")}
          aria-busy={busy}
        >
          <div className="chat-header">
            <span className="mentor-avatar">
              <Sparkles size={21} />
            </span>
            <div>
              <h2>EduMentor</h2>
              <span className="muted small">
                {t(
                  "Ecuații de gradul I · Material demonstrativ",
                  "Линейные уравнения · Демоматериал",
                )}
              </span>
            </div>
            <span className="mode-dot" aria-hidden="true" />
          </div>
          <div
            className="chat-messages"
            aria-live="polite"
            aria-relevant="additions text"
          >
            <div className="chat-message assistant">
              <span className="message-label">
                <Sparkles size={13} />
                {t("Mentor · bun venit", "Наставник · приветствие")}
              </span>
              <p>
                {t(
                  "Bun venit! Hai să transformăm materialul despre ecuații într-o activitate potrivită clasei tale. Alege mai jos o întrebare pentru a începe.",
                  "Добро пожаловать! Давайте превратим материал об уравнениях в задание для вашего класса. Выберите вопрос ниже, чтобы начать.",
                )}
              </p>
            </div>
            {conversation.map((turn) => (
              <div className="chat-turn" key={turn.id}>
                <div className="chat-message user">
                  <span className="message-label">
                    {t(
                      "Profesor · întrebare exemplu",
                      "Учитель · пример вопроса",
                    )}
                  </span>
                  <p>{prompts[turn.promptKey].label[turn.locale]}</p>
                </div>
                <div className="chat-message assistant">
                  <span className="message-label">
                    <Sparkles size={13} />
                    {turn.provider === "example"
                      ? t(
                          "Mentor · exemplu static",
                          "Наставник · готовый пример",
                        )
                      : t("Mentor · OpenAI", "Наставник · OpenAI")}
                  </span>
                  {turn.status === "loading" && (
                    <p className="chat-loading">
                      <LoaderCircle
                        size={17}
                        className="spinner"
                        aria-hidden="true"
                      />
                      {t(
                        "Mentorul pregătește răspunsul…",
                        "Наставник готовит ответ…",
                      )}
                    </p>
                  )}
                  {turn.status === "error" && (
                    <div className="chat-error" role="alert">
                      <p>{errors[turn.error ?? "unavailable"][locale]}</p>
                      <div className="chat-error-actions">
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() => ask(turn.promptKey, turn.id)}
                        >
                          <RotateCcw size={14} />
                          {t("Reîncearcă", "Повторить")}
                        </button>
                        <button
                          className="text-button"
                          onClick={() => useExample(turn.id)}
                        >
                          <BookOpen size={14} />
                          {t(
                            "Vezi răspunsul exemplu",
                            "Показать пример ответа",
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {turn.status === "done" && turn.reply && (
                    <>
                      <p className="ai-answer">{turn.reply.answer}</p>
                      {turn.reply.sourceSections.length ? (
                        <div className="source-links">
                          {turn.reply.sourceSections.map((section) => (
                            <button
                              key={section}
                              className="source-link"
                              onClick={() => go("course")}
                            >
                              <BookOpen size={13} />
                              {t(
                                `Materialul cursului · Secțiunea ${section}`,
                                `Материал курса · Раздел ${section}`,
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="source-note">
                          {t(
                            "Recomandare de verificat înainte de aplicare",
                            "Рекомендацию необходимо проверить перед применением",
                          )}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="prompt-area">
            <span className="eyebrow">
              {t("ÎNCEARCĂ O ÎNTREBARE", "ПОПРОБУЙТЕ ВОПРОС")}
            </span>
            <div className="prompt-grid">
              {(Object.keys(prompts) as PromptKey[]).map((key) => (
                <button
                  className="prompt-button"
                  key={key}
                  disabled={busy}
                  onClick={() => ask(key)}
                >
                  {prompts[key].label[locale]}
                  <MessageCircle size={15} />
                </button>
              ))}
            </div>
            <p className="footnote">
              <ShieldCheck size={13} />
              {t(
                "Întrebarea și contextul demonstrativ sunt trimise către OpenAI. Verifică răspunsul înainte de folosire.",
                "Вопрос и демонстрационный контекст отправляются в OpenAI. Проверьте ответ перед использованием.",
              )}
            </p>
            {conversation.length > 0 && (
              <button className="text-button" onClick={reset}>
                <RotateCcw size={13} />
                {t("Reia conversația", "Начать заново")}
              </button>
            )}
          </div>
        </section>
        <aside className="stack">
          <section className="panel">
            <span className="icon-box">
              <Lightbulb size={21} />
            </span>
            <h2>{t("Tu aduci contextul.", "Вы задаёте контекст.")}</h2>
            <p className="muted">
              {t(
                "Mentorul ajută la structurarea ideilor. Profesorul verifică și alege ce folosește la clasă.",
                "Наставник помогает структурировать идеи. Учитель проверяет и выбирает материал для класса.",
              )}
            </p>
            <div className="quiet-divider" />
            <h3>{t("În exemplul nostru", "В нашем примере")}</h3>
            <ul className="clean-list">
              <li>{t("Clasa a VII-a", "7 класс")}</li>
              <li>
                {t("Resurse simple, accesibile", "Простые доступные ресурсы")}
              </li>
              <li>
                {t("Verificare prin substituție", "Проверка подстановкой")}
              </li>
            </ul>
            <Action
              secondary
              onClick={() => go("activities")}
              icon={WandSparkles}
            >
              {t("Explorează activitățile", "Изучить задания")}
            </Action>
          </section>
        </aside>
      </div>
    </>
  );
}
