"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Lightbulb,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { prompts, type Locale, type PromptKey, type View } from "@/lib/demo";
import {
  MAX_HISTORY_TURNS,
  MAX_QUESTION_LENGTH,
  MAX_LESSON_LENGTH,
  type MentorMode,
  mentorQuestionText,
  parseMentorReply,
  type MentorAnswer,
  type MentorErrorCode,
  type MentorQuestion,
} from "@/lib/mentor-contract";
import { LORI_CRITERIA } from "@/lib/lori-rubric";
import { LoriAnalysis } from "./lori-report";
import { Action, Badge, Heading } from "./ui";

type Turn = MentorQuestion & {
  id: string;
  mode: MentorMode;
  locale: Locale;
  status: "loading" | "done" | "error";
  reply?: MentorAnswer;
  provider?: "openai" | "example";
  error?: MentorErrorCode;
};

const errors: Record<MentorErrorCode, { ro: string; ru: string }> = {
  unauthenticated: {
    ro: "Sesiunea a expirat. Conectează-te din nou pentru a continua.",
    ru: "Сессия истекла. Войдите снова, чтобы продолжить.",
  },
  forbidden: {
    ro: "Acest cont nu are acces la mentorul pentru profesori.",
    ru: "У этого аккаунта нет доступа к наставнику для учителей.",
  },
  not_configured: {
    ro: "Asistentul nu este conectat momentan. Reîncearcă mai târziu.",
    ru: "Помощник пока не подключён. Попробуйте позже.",
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
    ro: "Serviciul AI nu poate genera un răspuns momentan. Reîncearcă mai târziu.",
    ru: "AI пока не может создать ответ. Попробуйте позже.",
  },
  provider_auth: {
    ro: "Conexiunea cu asistentul nu este disponibilă momentan.",
    ru: "Соединение с помощником пока недоступно.",
  },
  unavailable: {
    ro: "Asistentul nu a putut răspunde. Reîncearcă.",
    ru: "Помощник не смог ответить. Повторите попытку.",
  },
  timeout: {
    ro: "Răspunsul durează mai mult decât era de așteptat. Poți reîncerca.",
    ru: "Ответ занимает больше времени, чем ожидалось. Попробуйте снова.",
  },
  invalid_response: {
    ro: "Răspunsul nu a putut fi afișat corect. Reîncearcă.",
    ru: "Не удалось корректно показать ответ. Повторите попытку.",
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
  const [mode, setMode] = useState<MentorMode>("mentor");
  const [drafts, setDrafts] = useState({ mentor: "", lori: "" });
  const draft = drafts[mode];
  const setDraft = (value: string) => setDrafts(previous => ({ ...previous, [mode]: value }));
  const lori = mode === "lori";
  const questionLimit = lori ? MAX_LESSON_LENGTH : MAX_QUESTION_LENGTH;
  const visibleConversation = conversation.filter(turn => turn.mode === mode);
  const controllerRef = useRef<AbortController | null>(null);
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  async function ask(question: MentorQuestion, retryId?: string) {
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
          turn.mode === mode && turn.status === "done" && turn.provider === "openai" && turn.reply,
      )
      .slice(-MAX_HISTORY_TURNS)
      .map((turn) => ({
        ...(turn.question !== undefined
          ? { question: turn.question }
          : { promptKey: turn.promptKey! }),
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
            { ...question, id, mode, locale: turnLocale, status: "loading" },
          ],
    );

    try {
      const response = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...question, mode, locale: turnLocale, history }),
        signal: controller.signal,
      });
      const data: unknown = await response.json();
      if (controller.signal.aborted) return;
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      const reply = response.ok ? parseMentorReply(data, mode) : null;
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
        if (turn.id !== id || !turn.promptKey) return turn;
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
    setConversation(previous => previous.filter(turn => turn.mode !== mode));
    setDraft("");
  }

  return (
    <>
      <Heading
        eyebrow={t("AI MENTOR", "AI-НАСТАВНИК")}
        title={lori ? t("Lecția ta, privită prin LORI.", "Ваш урок через критерии LORI.") : t(
          "Un spațiu pentru întrebările tale.",
          "Место для ваших вопросов.",
        )}
        description={lori ? t("Introdu planul lecției pentru o analiză structurată după manualul LORI 1.5.", "Вставьте план урока для анализа по руководству LORI 1.5.") : t(
          "Scrie întrebarea ta sau alege un exemplu. Mentorul te ajută să aplici ideile la clasă.",
          "Напишите свой вопрос или выберите пример. Наставник поможет применить идеи на занятиях.",
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
              <h2>{lori ? "AI Lori" : "EduMentor"}</h2>
              <span className="muted small">
                {lori ? t("Analiza lecției · LORI 1.5", "Анализ урока · LORI 1.5") : t(
                  "Ecuații de gradul I · Material demonstrativ",
                  "Линейные уравнения · Демоматериал",
                )}
              </span>
            </div>
            <label className="mentor-mode-switch"><span>{t("Asistent", "Помощник")}</span><select aria-label={t("Alege asistentul AI", "Выберите AI-помощника")} value={mode} disabled={busy} onChange={event => setMode(event.target.value as MentorMode)}><option value="mentor">EduMentor</option><option value="lori">AI Lori</option></select></label>
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
                {lori ? "AI Lori · LORI 1.5" : t("Mentor · bun venit", "Наставник · приветствие")}
              </span>
              <p>
                {lori ? t("Descrie lecția sau lipește planul: clasa, tema, obiectivele, etapele, materialele și evaluarea. Voi analiza cele 9 criterii LORI și voi indica ce informații lipsesc. Manualul LORI este baza criteriilor, nu lecția evaluată.", "Опишите урок или вставьте план: класс, тему, цели, этапы, материалы и оценивание. Я разберу 9 критериев LORI и отмечу, каких данных не хватает. Руководство LORI задаёт критерии, а не заменяет описание вашего урока.") : t(
                  "Bun venit! Hai să transformăm materialul despre ecuații într-o activitate potrivită clasei tale. Scrie întrebarea ta mai jos sau pornește de la un exemplu.",
                  "Добро пожаловать! Давайте превратим материал об уравнениях в задание для вашего класса. Напишите свой вопрос ниже или начните с примера.",
                )}
              </p>
            </div>
            {visibleConversation.map((turn) => (
              <div className="chat-turn" key={turn.id}>
                <div className="chat-message user">
                  <span className="message-label">
                    {turn.question !== undefined ? t("Profesor · întrebarea ta", "Учитель · ваш вопрос") : t(
                      "Profesor · întrebare exemplu",
                      "Учитель · пример вопроса",
                    )}
                  </span>
                  <p>{mentorQuestionText(turn, turn.locale)}</p>
                </div>
                <div className="chat-message assistant">
                  <span className="message-label">
                    <Sparkles size={13} />
                    {turn.provider === "example"
                      ? t(
                          "Mentor · exemplu static",
                          "Наставник · готовый пример",
                        )
                      : lori ? "AI Lori · OpenAI" : t("Mentor · OpenAI", "Наставник · OpenAI")}
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
                          onClick={() => ask(turn.question !== undefined ? { question: turn.question } : { promptKey: turn.promptKey! }, turn.id)}
                        >
                          <RotateCcw size={14} />
                          {t("Reîncearcă", "Повторить")}
                        </button>
                        {turn.promptKey && <button
                          className="text-button"
                          onClick={() => useExample(turn.id)}
                        >
                          <BookOpen size={14} />
                          {t(
                            "Vezi răspunsul exemplu",
                            "Показать пример ответа",
                          )}
                        </button>}
                      </div>
                    </div>
                  )}
                  {turn.status === "done" && turn.reply && (
                    <>
                      <p className="ai-answer">{turn.reply.answer}</p>
                      {turn.reply.loriReport && <LoriAnalysis report={turn.reply.loriReport} locale={turn.locale} />}
                      {lori ? null : turn.reply.sourceSections.length ? (
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
            <form
              className="mentor-composer"
              onSubmit={(event) => {
                event.preventDefault();
                const question = draft.trim();
                if (!question || question.length > questionLimit || controllerRef.current) return;
                setDraft("");
                void ask({ question });
              }}
            >
              <label htmlFor="mentor-question">{lori ? t("Planul sau descrierea lecției", "План или описание урока") : t("Întrebarea ta", "Ваш вопрос")}</label>
              <div className="mentor-composer-row">
                {lori ? <textarea id="mentor-question" value={draft} onChange={event => setDraft(event.target.value)} maxLength={questionLimit} rows={7} placeholder={t("Clasa, tema, obiectivele, etapele, materialele, evaluarea și accesibilitatea…", "Класс, тема, цели, этапы, материалы, оценивание и доступность…")} aria-describedby="mentor-question-hint" /> : <input
                  id="mentor-question"
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={questionLimit}
                  placeholder={t("Scrie ce vrei să întrebi mentorul…", "Напишите вопрос наставнику…")}
                  aria-describedby="mentor-question-hint"
                />}
                <button type="submit" disabled={busy || !draft.trim()}>
                  {busy ? <LoaderCircle size={17} className="spinner" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
                  {lori ? t("Analizează lecția", "Анализировать урок") : t("Trimite", "Отправить")}
                </button>
              </div>
              <p id="mentor-question-hint" className="mentor-composer-hint">
                <span>{lori ? t("Lipiți planul, apoi apăsați «Analizează lecția»", "Вставьте план и нажмите «Анализировать урок»") : t("Enter pentru a trimite", "Enter — отправить")}</span>
                <span>{draft.length}/{questionLimit}</span>
              </p>
            </form>
            {!lori && <>
            <span className="eyebrow">
              {t("ÎNCEARCĂ O ÎNTREBARE", "ПОПРОБУЙТЕ ВОПРОС")}
            </span>
            <div className="prompt-grid">
              {(Object.keys(prompts) as PromptKey[]).map((key) => (
                <button
                  className="prompt-button"
                  key={key}
                  disabled={busy}
                  onClick={() => ask({ promptKey: key })}
                >
                  {prompts[key].label[locale]}
                  <MessageCircle size={15} />
                </button>
              ))}
            </div>
            </>}
            <p className="footnote">
              <ShieldCheck size={13} />
              {lori ? t("Descrierea lecției și criteriile LORI sunt trimise către OpenAI pentru analiză. Verifică recomandările înainte de aplicare.", "Описание урока и критерии LORI отправляются в OpenAI для анализа. Проверьте рекомендации перед применением.") : t(
                "Întrebarea și contextul demonstrativ sunt trimise către OpenAI. Verifică răspunsul înainte de folosire.",
                "Вопрос и демонстрационный контекст отправляются в OpenAI. Проверьте ответ перед использованием.",
              )}
            </p>
            {visibleConversation.length > 0 && (
              <button className="text-button" onClick={reset}>
                <RotateCcw size={13} />
                {t("Reia conversația", "Начать заново")}
              </button>
            )}
          </div>
        </section>
        <aside className="stack">
          {lori ? <section className="panel lori-guide"><h2>{t("Analiză după LORI 1.5", "Анализ по LORI 1.5")}</h2><p className="muted">{t("Instrument pentru resurse educaționale, adaptat aici la planul lecției. Evaluăm ce descrii, fără a presupune ce s-a întâmplat la clasă.", "Инструмент оценки учебных ресурсов, здесь адаптированный для плана урока. Анализируем описание, не предполагая, что происходило в классе.")}</p><ol>{LORI_CRITERIA.map(c => <li key={c.id}>{c[locale]}</li>)}</ol><p className="muted">{t("Scală: 1–5. Fără dovezi: date insuficiente; criteriu nerelevant: nu se aplică.", "Шкала: 1–5. Нет доказательств — недостаточно данных; нерелевантный критерий — не применимо.")}</p><small>LORI User Manual v1.5 · Nesbit, Belfer, Leacock</small></section> : <>

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
          </>}
        </aside>
      </div>
    </>
  );
}
