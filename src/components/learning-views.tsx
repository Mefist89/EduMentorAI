"use client";

import { useState } from "react";
import {
  ArrowDown,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  FileText,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  WandSparkles,
} from "lucide-react";
import {
  activities,
  courseSections,
  diagnostic,
  exercises,
  reflectionExamples,
  synthesisExamples,
  type DemoProgress,
  type Difficulty,
  type Locale,
  type View,
} from "@/lib/demo";
import { Action, Badge, Heading } from "./ui";

type Props = {
  locale: Locale;
  go: (view: View) => void;
  notify: (message: string) => void;
};
type ProgressProps = Props & {
  progress: DemoProgress;
  update: (patch: Partial<DemoProgress>) => void;
};

export function CourseView({
  locale,
  go,
  progress,
  update,
  notify,
}: ProgressProps) {
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);
  return (
    <>
      <Heading
        eyebrow={t("CURSUL TĂU DEMONSTRATIV", "ВАШ ДЕМОНСТРАЦИОННЫЙ КУРС")}
        title={t("O bază bună pentru idei noi.", "Основа для новых идей.")}
        description={t(
          "Materialul și contextul sunt deja pregătite. Explorează în ritmul tău.",
          "Материал и контекст уже подготовлены. Изучайте в своём темпе.",
        )}
      />
      <div className="course-banner">
        <div className="course-symbol">x²</div>
        <div>
          <Badge>
            {t("Matematică · Clasa a VII-a", "Математика · 7 класс")}
          </Badge>
          <h2>{t("Ecuații de gradul I", "Линейные уравнения")}</h2>
          <p>
            {t(
              "Un obiectiv simplu: elevii rezolvă, explică și verifică.",
              "Простая цель: ученики решают, объясняют и проверяют.",
            )}
          </p>
        </div>
        <span className="duration">
          <Clock3 size={16} />
          {t("20 min · traseu demo", "20 мин · демомаршрут")}
        </span>
      </div>
      <div className="two-columns course-columns">
        <section className="panel">
          <div className="panel-heading">
            <span className="icon-box">
              <BookOpen size={20} />
            </span>
            <h2>{t("Materialul cursului", "Материал курса")}</h2>
          </div>
          <p className="muted small">
            {t(
              "Material demonstrativ creat pentru acest prototip. Aceste secțiuni sunt sursele folosite în conversațiile exemplu.",
              "Демонстрационный материал этого прототипа. Эти разделы используются в примерах диалога.",
            )}
          </p>
          <div className="reading-sections">
            {courseSections.map((section, i) => (
              <section key={i}>
                <h3>{section.title[locale]}</h3>
                <p>{section.body[locale]}</p>
              </section>
            ))}
          </div>
          <Action secondary onClick={() => go("mentor")} icon={MessageCircle}>
            {t("Discută materialul", "Обсудить материал")}
          </Action>
        </section>
        <section className="panel diagnostic-panel">
          <Badge tone="coral">
            {t("Profil demonstrativ", "Демонстрационный профиль")}
          </Badge>
          <h2>{t("De unde pornesc?", "С чего начать?")}</h2>
          <p className="muted">
            {t(
              "Trei răspunsuri exemplu, fără formulare de completat.",
              "Три готовых ответа — ничего вводить не нужно.",
            )}
          </p>
          <div className="diagnostic-list">
            {diagnostic.map((item, i) => (
              <div key={i}>
                <span className="step-number">0{i + 1}</span>
                <div>
                  <h3>{item.question[locale]}</h3>
                  <p>{item.answer[locale]}</p>
                </div>
              </div>
            ))}
          </div>
          <Action
            icon={progress.diagnosticDone ? Check : WandSparkles}
            onClick={() => {
              update({
                diagnosticDone: true,
                completed: [true, progress.completed[1], progress.completed[2]],
              });
              notify(
                t(
                  "Profilul exemplu este activ. Planul tău este pregătit.",
                  "Пример профиля активирован. Ваш план готов.",
                ),
              );
            }}
          >
            {progress.diagnosticDone
              ? t("Profil exemplu activ", "Профиль активирован")
              : t("Folosește acest exemplu", "Использовать пример")}
          </Action>
          <p className="footnote">
            {t(
              "Diagnosticul descrie nevoi de învățare, nu evaluează personalul.",
              "Диагностика описывает учебные потребности, а не оценивает сотрудников.",
            )}
          </p>
        </section>
      </div>
    </>
  );
}

export function ActivitiesView({
  locale,
  go,
  progress,
  update,
  notify,
}: ProgressProps) {
  const [variant, setVariant] = useState<"without" | "with">(
    progress.activityVariant ?? "without",
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("basic");
  const [visibleSolutions, setVisibleSolutions] = useState<string[]>([]);
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);
  const current = activities[variant];
  function chooseActivity() {
    const changed = progress.activityVariant !== variant;
    update({
      activityVariant: variant,
      completed: [
        progress.completed[0],
        true,
        changed ? false : progress.completed[2],
      ],
      ...(changed ? { saved: false, approved: false } : {}),
    });
    notify(
      t(
        "Activitatea exemplu a fost adăugată în plan.",
        "Пример занятия добавлен в план.",
      ),
    );
  }
  function toggleSolution(id: string) {
    setVisibleSolutions((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }
  return (
    <>
      <Heading
        eyebrow={t("IDEI PENTRU CLASĂ", "ИДЕИ ДЛЯ КЛАССА")}
        title={t("Același obiectiv. Mai multe căi.", "Одна цель. Разные пути.")}
        description={t(
          "Două activități exemplu și exerciții pe niveluri, gata de explorat.",
          "Два примера занятий и задания по уровням, готовые к изучению.",
        )}
      />
      <section className="panel activity-panel">
        <div className="panel-heading spread">
          <div>
            <Badge>{t("Obiectiv comun", "Общая цель")}</Badge>
            <h2>
              {t(
                "Rezolvăm și explicăm o ecuație",
                "Решаем и объясняем уравнение",
              )}
            </h2>
          </div>
          <span className="duration">
            <Clock3 size={16} />
            {t("15–20 min", "15–20 мин")}
          </span>
        </div>
        <div
          className="segmented"
          role="group"
          aria-label={t("Tipul activității", "Вариант занятия")}
        >
          <button
            aria-pressed={variant === "without"}
            onClick={() => setVariant("without")}
          >
            <BookOpen size={16} />
            {t("Fără AI", "Без AI")}
          </button>
          <button
            aria-pressed={variant === "with"}
            onClick={() => setVariant("with")}
          >
            <Sparkles size={16} />
            {t("Cu AI", "С AI")}
          </button>
        </div>
        <div className="activity-content">
          <div className={`activity-visual ${variant}`} aria-hidden="true">
            <span className="activity-visual-label">
              {variant === "without"
                ? t("ÎMPREUNĂ", "ВМЕСТЕ")
                : t("GÂNDIRE CRITICĂ", "КРИТИЧЕСКОЕ МЫШЛЕНИЕ")}
            </span>
            <div className="math-board">
              2x + 3 = 11
              <span>{variant === "without" ? "x = ?" : "x = 7 ?"}</span>
            </div>
            <div className="visual-stickers">
              <span>+</span>
              <span>÷</span>
              <span>=</span>
            </div>
          </div>
          <div>
            <h2>{current.title[locale]}</h2>
            <p className="muted">{current.subtitle[locale]}</p>
            <ol className="activity-steps">
              {current.steps.map((step, index) => (
                <li key={index}>{step[locale]}</li>
              ))}
            </ol>
            <Action
              icon={progress.activityVariant === variant ? Check : CheckCheck}
              onClick={chooseActivity}
            >
              {progress.activityVariant === variant
                ? t("Activitate aleasă", "Задание выбрано")
                : t("Alege activitatea exemplu", "Выбрать пример задания")}
            </Action>
          </div>
        </div>
      </section>
      <section className="exercise-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t("EXERSARE CU SENS", "ОСМЫСЛЕННАЯ ПРАКТИКА")}
            </p>
            <h2>
              {t(
                "Un punct de pornire pentru fiecare nivel",
                "Отправная точка для каждого уровня",
              )}
            </h2>
          </div>
          <div
            className="segmented"
            role="group"
            aria-label={t("Dificultate", "Сложность")}
          >
            {(["basic", "medium", "advanced"] as Difficulty[]).map(
              (level, i) => (
                <button
                  key={level}
                  aria-pressed={difficulty === level}
                  onClick={() => setDifficulty(level)}
                >
                  {
                    [
                      t("De bază", "Базовый"),
                      t("Mediu", "Средний"),
                      t("Aprofundare", "Углублённый"),
                    ][i]
                  }
                </button>
              ),
            )}
          </div>
        </div>
        <div className="exercise-grid">
          {exercises[difficulty].map((exercise, index) => {
            const id = `${difficulty}-${index}`;
            const open = visibleSolutions.includes(id);
            return (
              <article className="panel exercise-card" key={id}>
                <span className="exercise-number">
                  {t("EXERCIȚIUL", "ЗАДАНИЕ")} 0{index + 1}
                </span>
                <h3>{exercise.equation}</h3>
                <button
                  className="text-button"
                  aria-expanded={open}
                  onClick={() => toggleSolution(id)}
                >
                  {open
                    ? t("Ascunde soluția", "Скрыть решение")
                    : t("Vezi soluția", "Показать решение")}
                  {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {open && (
                  <div className="solution">
                    <p>{exercise.solution}</p>
                    <span>{exercise.check}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <p className="footnote">
          <ShieldCheck size={14} />
          {t(
            "Set demonstrativ cu soluții explicite. Profesorul verifică adecvarea înainte de folosire.",
            "Демонстрационный набор с решениями. Учитель проверяет применимость перед использованием.",
          )}
        </p>
      </section>
      <div className="page-bottom-action">
        <Action secondary onClick={() => go("experience")}>
          {t("Continuă cu reflecția", "Перейти к рефлексии")}
        </Action>
      </div>
    </>
  );
}

export function ExperienceView({
  locale,
  go,
  progress,
  update,
  notify,
}: ProgressProps) {
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [saveError, setSaveError] = useState("");
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);
  const summary = summaryVisible || progress.saved;
  const activity =
    activities[progress.activityVariant ?? "without"].title[locale];
  async function copySheet() {
    const content = [
      t("DEMO · Experiența mea la clasă", "ДЕМО · Мой опыт в классе"),
      activity,
      ...reflectionExamples.map(
        (item) => `${item.label[locale]}\n${item.value[locale]}`,
      ),
      ...(summary
        ? [
            t("Sinteză demonstrativă", "Демонстрационный синтез"),
            ...synthesisExamples.map(
              (item) => `${item.label[locale]}\n${item.value[locale]}`,
            ),
          ]
        : []),
      t(
        "Limite: simulare fictivă; fără rezultate pedagogice reale sau validate.",
        "Ограничения: вымышленная симуляция; без реальных или подтверждённых педагогических результатов.",
      ),
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(content);
      notify(
        t(
          "Fișa demonstrativă a fost copiată.",
          "Демонстрационная карточка скопирована.",
        ),
      );
    } catch {
      setSaveError(
        t(
          "Browserul nu permite copierea. Poți selecta și copia textul fișei.",
          "Браузер не разрешает копирование. Вы можете выделить и скопировать текст карточки.",
        ),
      );
    }
  }
  return (
    <>
      <Heading
        eyebrow={t("JURNAL ȘI PORTOFOLIU PRIVAT", "ЛИЧНЫЙ ЖУРНАЛ И ПОРТФОЛИО")}
        title={t("Din experiență, înțelegere.", "От опыта к пониманию.")}
        description={t(
          "Descoperă cum o reflecție poate deveni o fișă clară și reutilizabilă.",
          "Посмотрите, как рефлексия становится понятной карточкой опыта.",
        )}
        action={
          <Badge tone={progress.approved ? "green" : "lavender"}>
            <LockKeyhole size={13} />
            {progress.approved
              ? t("Aprobată de autor · demo", "Одобрено автором · демо")
              : t("Ciornă privată · demo", "Личный черновик · демо")}
          </Badge>
        }
      />
      <div className="experience-notice">
        <span className="notice-icon">
          <FileText size={19} />
        </span>
        <p>
          <strong>
            {t(
              "O simulare, nu rezultate reale.",
              "Симуляция, а не реальные результаты.",
            )}
          </strong>{" "}
          {t(
            "Toate observațiile de mai jos sunt fictive și ilustrează structura fișei.",
            "Все наблюдения ниже вымышлены и показывают структуру карточки.",
          )}
        </p>
      </div>
      <div className="two-columns experience-columns">
        <section className="panel reflection-panel">
          <div className="panel-heading">
            <span className="icon-box">
              <FileText size={20} />
            </span>
            <h2>{t("Experiența mea la clasă", "Мой опыт в классе")}</h2>
          </div>
          <div className="sheet-meta">
            <Badge>{t("Ecuații de gradul I", "Линейные уравнения")}</Badge>
            <span className="muted small">
              {t(
                "Clasa a VII-a · Exemplu pregătit",
                "7 класс · Готовый пример",
              )}
            </span>
          </div>
          <div className="reflection-field">
            <h3>{t("Activitate exemplu", "Пример занятия")}</h3>
            <p>{activity}</p>
          </div>
          {reflectionExamples.map((item, index) => (
            <div className="reflection-field" key={index}>
              <h3>{item.label[locale]}</h3>
              <p>{item.value[locale]}</p>
            </div>
          ))}
          <div className="sheet-limits">
            <ShieldCheck size={18} />
            <p>
              {t(
                "Fără date individuale despre elevi. Observațiile nu demonstrează eficiența unei metode.",
                "Без индивидуальных данных учеников. Наблюдения не доказывают эффективность метода.",
              )}
            </p>
          </div>
        </section>
        <aside className="stack">
          <section className="panel synthesis-panel">
            <span className="icon-box">
              <Sparkles size={22} />
            </span>
            <h2>{t("O perspectivă în plus", "Дополнительный взгляд")}</h2>
            <p className="muted">
              {t(
                "O sinteză exemplu, separată de observațiile profesorului.",
                "Пример синтеза, отделённый от наблюдений учителя.",
              )}
            </p>
            {summary ? (
              <div className="synthesis-content">
                <Badge>
                  {t("Sinteză demonstrativă", "Демонстрационный синтез")}
                </Badge>
                {synthesisExamples.map((item) => (
                  <div key={item.label.ro}>
                    <h3>{item.label[locale]}</h3>
                    <p>{item.value[locale]}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Action
                secondary
                icon={Sparkles}
                onClick={() => setSummaryVisible(true)}
              >
                {t("Vezi sinteza exemplu", "Показать пример синтеза")}
              </Action>
            )}
          </section>
          <section className="panel save-panel">
            <h2>{t("Tu ai ultimul cuvânt.", "Последнее слово за вами.")}</h2>
            <p className="muted small">
              {t(
                "Salvarea păstrează fișa exemplu în acest browser. Aprobarea autorului nu este validare independentă.",
                "Карточка сохраняется в этом браузере. Одобрение автором не является независимой проверкой.",
              )}
            </p>
            <div className="stack compact">
              <Action
                icon={Save}
                onClick={() => {
                  update({ saved: true });
                  setSummaryVisible(true);
                  notify(
                    t(
                      "Fișa exemplu a fost păstrată în portofoliul local.",
                      "Пример карточки сохранён в локальном портфолио.",
                    ),
                  );
                }}
              >
                {progress.saved
                  ? t("Salvează din nou", "Сохранить снова")
                  : t("Salvează fișa exemplu", "Сохранить пример карточки")}
              </Action>
              <Action
                secondary
                icon={progress.approved ? RotateCcw : CheckCheck}
                disabled={!progress.saved}
                onClick={() => {
                  update({
                    approved: !progress.approved,
                    completed: [
                      progress.completed[0],
                      progress.completed[1],
                      !progress.approved,
                    ],
                  });
                  notify(
                    progress.approved
                      ? t(
                          "Fișa a revenit la starea de ciornă.",
                          "Карточка возвращена в черновик.",
                        )
                      : t(
                          "Fișa demonstrativă este aprobată de autor.",
                          "Демонстрационная карточка одобрена автором.",
                        ),
                  );
                }}
              >
                {progress.approved
                  ? t("Revino la ciornă", "Вернуть в черновик")
                  : t("Aprobă exemplul", "Одобрить пример")}
              </Action>
              <button className="text-button" onClick={copySheet}>
                <Copy size={15} />
                {t("Copiază textul", "Скопировать текст")}
              </button>
            </div>
            {!progress.saved && (
              <p className="footnote">
                {t(
                  "Salvează fișa înainte de aprobare.",
                  "Сохраните карточку перед одобрением.",
                )}
              </p>
            )}
            {saveError && (
              <p className="error-message" role="alert">
                {saveError}
              </p>
            )}
          </section>
        </aside>
      </div>
      {progress.saved && (
        <section className="panel portfolio-row">
          <span className="icon-box">
            <FileText size={19} />
          </span>
          <div>
            <h3>
              {activity} · {t("Fișă demonstrativă", "Демокарточка")}
            </h3>
            <p className="muted small">
              {t(
                "În portofoliul acestui browser · 1 fișă",
                "В портфолио этого браузера · 1 карточка",
              )}
            </p>
          </div>
          <Badge tone={progress.approved ? "green" : "neutral"}>
            {progress.approved
              ? t("Aprobată de autor", "Одобрено автором")
              : t("Ciornă", "Черновик")}
          </Badge>
        </section>
      )}
      <section className="feedback-section">
        <div>
          <h3>{t("Cum ți se pare acest exemplu?", "Как вам этот пример?")}</h3>
          <p className="muted small">
            {t(
              "O reacție demonstrativă, păstrată doar în acest browser.",
              "Демонстрационная реакция, хранится только в этом браузере.",
            )}
          </p>
        </div>
        <div className="feedback-actions">
          <button
            aria-pressed={progress.feedback === "useful"}
            onClick={() => {
              update({ feedback: "useful" });
              notify(
                t(
                  "Reacția a fost salvată local.",
                  "Реакция сохранена локально.",
                ),
              );
            }}
          >
            <ThumbsUp size={16} />
            {t("Este util", "Полезно")}
          </button>
          <button
            aria-pressed={progress.feedback === "clearer"}
            onClick={() => {
              update({ feedback: "clearer" });
              notify(
                t(
                  "Reacția a fost salvată local.",
                  "Реакция сохранена локально.",
                ),
              );
            }}
          >
            <Lightbulb size={16} />
            {t("Aș vrea mai multă claritate", "Хочется больше ясности")}
          </button>
        </div>
      </section>
      <div className="page-bottom-action">
        <Action secondary onClick={() => go("dashboard")} icon={ArrowDown}>
          {t("Înapoi la planul meu", "Вернуться к плану")}
        </Action>
      </div>
    </>
  );
}
