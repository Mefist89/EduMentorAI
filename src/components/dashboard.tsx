import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  FileText,
  Layers3,
  NotebookPen,
} from "lucide-react";
import { steps, type DemoProgress, type Locale, type View } from "@/lib/demo";
import { Action, MentorOrbitArt } from "./ui";

export function Dashboard({
  locale,
  progress,
  go,
}: {
  locale: Locale;
  progress: DemoProgress;
  go: (view: View) => void;
}) {
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);
  const completed = progress.completed.filter(Boolean).length;
  const next = steps[progress.completed.findIndex((done) => !done)] ?? steps[2];
  const resources = [
    {
      view: "course" as const,
      category: t("MATEMATICĂ", "МАТЕМАТИКА"),
      title: t(
        "Ecuații de gradul I, pas cu pas",
        "Линейные уравнения, шаг за шагом",
      ),
      description: t(
        "Un material clar despre egalități, transformări și verificarea soluțiilor. Construiește o bază bună pentru activitățile tale.",
        "Понятный материал о равенствах, преобразованиях и проверке решений. Основа для ваших занятий.",
      ),
      meta: t(
        "Clasa a VII-a · 3 secțiuni · Material demo",
        "7 класс · 3 раздела · Демоматериал",
      ),
      icon: BookOpen,
    },
    {
      view: "activities" as const,
      category: t("PRACTICĂ PEDAGOGICĂ", "ПЕДАГОГИЧЕСКАЯ ПРАКТИКА"),
      title: t(
        "Același obiectiv, cu AI sau fără AI",
        "Одна цель — с AI или без AI",
      ),
      description: t(
        "Explorează două moduri de a lucra cu ecuațiile. Alege activitatea potrivită și exercițiile pentru niveluri diferite.",
        "Два способа работы с уравнениями. Выберите подходящее занятие и задания разных уровней.",
      ),
      meta: t(
        "2 activități · 9 exerciții · Exemple pregătite",
        "2 занятия · 9 заданий · Готовые примеры",
      ),
      icon: BrainCircuit,
    },
    {
      view: "experience" as const,
      category: t("REFLECȚIE ȘI ÎNVĂȚARE", "РЕФЛЕКСИЯ И ОБУЧЕНИЕ"),
      title: t(
        "Experiența ta devine o resursă",
        "Ваш опыт становится ресурсом",
      ),
      description: t(
        "Păstrează ce ai observat, ce a funcționat și ce ai adapta. Transformă reflecția într-o fișă privată, reutilizabilă.",
        "Запишите наблюдения: что получилось и что изменить. Превратите рефлексию в личную карточку опыта.",
      ),
      meta: t(
        "Jurnal privat · Fișă demonstrativă",
        "Личный журнал · Демокарточка",
      ),
      icon: NotebookPen,
    },
  ];
  return (
    <div className="presentation-page">
      <h1 className="sr-only" id="page-title" tabIndex={-1}>
        {t("Prezentare EduMentor", "Обзор EduMentor")}
      </h1>
      <section className="community-hero" aria-labelledby="welcome-title">
        <div className="community-hero-copy">
          <p className="hero-eyebrow">
            {t(
              "BUN VENIT ÎN SPAȚIUL TĂU",
              "ДОБРО ПОЖАЛОВАТЬ В ВАШЕ ПРОСТРАНСТВО",
            )}
          </p>
          <h2 id="welcome-title">
            {t("Învățăm unii de la alții.", "Учимся друг у друга.")}
            <br />
            <span>{t("Creștem împreună.", "Растём вместе.")}</span>
          </h2>
          <p>
            {t(
              "Descoperă activități pedagogice, adaptează idei cu ajutorul AI și transformă învățarea în practică.",
              "Открывайте педагогические практики, адаптируйте идеи с помощью AI и превращайте обучение в действие.",
            )}
          </p>
          <Action icon={BookOpen} onClick={() => go("activities")}>
            {t("Explorează activitățile", "Изучить задания")}
          </Action>
        </div>
        <MentorOrbitArt russian={locale === "ru"} />
      </section>
      <section
        className="overview-metrics"
        aria-label={t("Resursele demonstrației", "Ресурсы демонстрации")}
      >
        <div className="overview-metric">
          <BookOpen size={23} strokeWidth={1.5} />
          <div>
            <strong>1</strong>
            <span>{t("Material de curs", "Учебный материал")}</span>
          </div>
        </div>
        <div className="overview-metric">
          <Layers3 size={23} strokeWidth={1.5} />
          <div>
            <strong>9</strong>
            <span>{t("Exerciții pe niveluri", "Задания по уровням")}</span>
          </div>
        </div>
        <div className="overview-metric">
          <FileText size={23} strokeWidth={1.5} />
          <div>
            <strong>3</strong>
            <span>{t("Etape în traseul tău", "Этапа в вашем маршруте")}</span>
          </div>
        </div>
      </section>
      <section className="resource-section">
        <div className="resource-heading">
          <div>
            <p className="eyebrow">{t("DESCOPERĂ", "ОТКРОЙТЕ ДЛЯ СЕБЯ")}</p>
            <h2>{t("Idei pentru practica ta", "Идеи для вашей практики")}</h2>
          </div>
          <button className="text-button" onClick={() => go("activities")}>
            {t("Vezi activitățile", "Все задания")}
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="resource-grid">
          {resources.map((resource) => (
            <button
              className="resource-card"
              key={resource.view}
              onClick={() => go(resource.view)}
            >
              <div className="resource-card-top">
                <span>{resource.category}</span>
                <resource.icon size={18} strokeWidth={1.5} />
              </div>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <span className="resource-meta">{resource.meta}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="learning-path">
        <div className="learning-path-heading">
          <div>
            <p className="eyebrow">
              {t("CONTINUĂ ÎN RITMUL TĂU", "ПРОДОЛЖАЙТЕ В СВОЁМ ТЕМПЕ")}
            </p>
            <h2>{t("De la învățare la experiență", "От обучения к опыту")}</h2>
          </div>
          <span className="path-progress">
            {completed}
            <span> / 3</span>
          </span>
          <button className="text-button" onClick={() => go(next.view)}>
            {t("Continuă traseul", "Продолжить маршрут")}
            <ArrowRight size={15} />
          </button>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label={t(
            "Progresul traseului demonstrativ",
            "Прогресс демомаршрута",
          )}
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={3}
        >
          <span style={{ width: `${(completed / 3) * 100}%` }} />
        </div>
        <div className="path-steps">
          {steps.map((step, index) => (
            <button
              key={step.view}
              className={`path-step ${progress.completed[index] ? "is-complete" : ""}`}
              onClick={() => go(step.view)}
            >
              <span className="step-number">
                {progress.completed[index] ? (
                  <Check size={15} />
                ) : (
                  `0${index + 1}`
                )}
              </span>
              <span>{step.title[locale]}</span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
