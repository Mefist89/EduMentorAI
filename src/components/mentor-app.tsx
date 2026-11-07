"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sprout,
  WandSparkles,
  X,
} from "lucide-react";
import {
  initialProgress,
  navigation,
  parseProgress,
  steps,
  STORAGE_KEY,
  type DemoProgress,
  type View,
} from "@/lib/demo";
import {
  ActivitiesView,
  CourseView,
  ExperienceView,
  MentorView,
} from "./learning-views";
import { Action, AlgebraArt, Badge, Heading } from "./ui";

const navIcons = {
  dashboard: LayoutDashboard,
  course: BookOpen,
  mentor: MessageCircle,
  activities: WandSparkles,
  experience: BookMarked,
};

export function MentorApp() {
  const [progress, setProgress] = useState<DemoProgress>(initialProgress);
  const [view, setView] = useState<View>("dashboard");
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [toast, setToast] = useState("");
  const locale = progress.locale;
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);
  const selected = navigation.find((item) => item.id === view)!;
  const completedCount = progress.completed.filter(Boolean).length;
  const nextStep =
    steps[progress.completed.findIndex((done) => !done)] ?? steps[2];

  useEffect(() => {
    try {
      setProgress(parseProgress(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setStorageError(true);
    }
    setReady(true);
    const readHash = () => {
      const id = window.location.hash.slice(1);
      if (navigation.some((item) => item.id === id)) setView(id as View);
      else setView("dashboard");
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      setStorageError(true);
    }
  }, [progress, ready]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `${selected.label[locale]} · EduMentor AI`;
  }, [locale, selected]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function update(patch: Partial<DemoProgress>) {
    setProgress((previous) => ({ ...previous, ...patch }));
  }
  function go(next: View) {
    setView(next);
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: "instant" });
    window.requestAnimationFrame(() =>
      document.getElementById("page-title")?.focus({ preventScroll: true }),
    );
  }
  function reset() {
    if (
      !window.confirm(
        t(
          "Reiei demonstrația? Progresul și fișa exemplu din acest browser vor fi resetate.",
          "Начать демонстрацию заново? Прогресс и пример карточки в этом браузере будут сброшены.",
        ),
      )
    )
      return;
    setProgress({ ...initialProgress, locale });
    go("dashboard");
    setToast(
      t(
        "Demonstrația este pregătită pentru un nou început.",
        "Демонстрация готова к новому началу.",
      ),
    );
  }

  const props = { locale, go, progress, update, notify: setToast };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t("Sari la conținut", "Перейти к содержимому")}
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => go("dashboard")}
          aria-label={t("EduMentor, pagina principală", "EduMentor, главная")}
        >
          <span className="brand-mark">
            <BookOpen size={23} strokeWidth={1.7} />
          </span>
          <span>
            EduMentor<span className="brand-caption">AI MENTOR</span>
          </span>
        </button>
        <div className="sidebar-section-label">
          {t("SPAȚIUL TĂU", "ВАШЕ ПРОСТРАНСТВО")}
        </div>
        <nav
          className="main-nav"
          aria-label={t("Navigare principală", "Основная навигация")}
        >
          {navigation.map((item) => {
            const Icon = navIcons[item.id];
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                aria-current={view === item.id ? "page" : undefined}
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{item.label[locale]}</span>
                {item.id === "mentor" && <span className="nav-ai">AI</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <span className="sidebar-note-icon">
            <Sprout size={23} strokeWidth={1.5} />
          </span>
          <h3>{t("Pas cu pas, cu sens.", "Шаг за шагом, со смыслом.")}</h3>
          <p>
            {t(
              "Ideile prind viață când le încerci și reflectezi asupra lor.",
              "Идеи оживают, когда вы пробуете и осмысливаете их.",
            )}
          </p>
          <button className="text-button" onClick={() => go("course")}>
            {t("Explorează exemplul", "Изучить пример")}
            <ArrowRight size={14} />
          </button>
        </div>
        <button className="reset-button" onClick={reset}>
          <RotateCcw size={16} />
          {t("Reia demonstrația", "Начать заново")}
        </button>
        <div className="sidebar-profile">
          <span className="profile-avatar">AP</span>
          <span>
            <strong>{t("Ana Popescu", "Анна Попеску")}</strong>
            <small>
              {t("Profesor · cont demonstrativ", "Учитель · демопрофиль")}
            </small>
          </span>
          <LockKeyhole size={14} />
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>EduMentor</span>
            <ChevronRight size={14} />
            <strong>{selected.label[locale]}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-indicator">
              <span />
              {t("Mod demonstrativ", "Деморежим")}
            </span>
            <div
              className="locale-switch"
              role="group"
              aria-label={t("Limba interfeței", "Язык интерфейса")}
            >
              <button
                aria-pressed={locale === "ro"}
                onClick={() => {
                  setToast("");
                  update({ locale: "ro" });
                }}
              >
                RO
              </button>
              <button
                aria-pressed={locale === "ru"}
                onClick={() => {
                  setToast("");
                  update({ locale: "ru" });
                }}
              >
                RU
              </button>
            </div>
            <span className="topbar-avatar" aria-hidden="true">
              AP
            </span>
          </div>
        </header>
        <main id="main-content" className="content">
          {storageError && (
            <p className="storage-warning" role="alert">
              {t(
                "Stocarea browserului este indisponibilă. Poți explora demo-ul, dar progresul se păstrează doar până la reîncărcare.",
                "Хранилище браузера недоступно. Демо работает, но прогресс сохранится только до перезагрузки.",
              )}
            </p>
          )}
          {view === "dashboard" && (
            <>
              <Heading
                eyebrow={t(
                  "BINE AI VENIT ÎN SPAȚIUL TĂU",
                  "ДОБРО ПОЖАЛОВАТЬ В ВАШЕ ПРОСТРАНСТВО",
                )}
                title={t(
                  "Învățarea continuă cu tine.",
                  "Обучение продолжается с вами.",
                )}
                description={t(
                  "Un pic de inspirație, un plan clar și următorul pas spre clasă.",
                  "Немного вдохновения, понятный план и следующий шаг к практике.",
                )}
                action={
                  <span className="greeting-icon" aria-hidden="true">
                    <Sprout size={28} strokeWidth={1.4} />
                  </span>
                }
              />
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-kicker">
                    <span />
                    {t("DE LA IDEE LA PRACTICĂ", "ОТ ИДЕИ К ПРАКТИКЕ")}
                  </span>
                  <h2>
                    {t("Fiecare idee merită", "Каждая идея заслуживает")}
                    <br />
                    <span>{t("o șansă la clasă.", "шанса в классе.")}</span>
                  </h2>
                  <p>
                    {t(
                      "Transformă ce ai învățat într-o activitate potrivită elevilor tăi. Mentorul tău este aici, la fiecare pas.",
                      "Превратите изученное в задание для ваших учеников. Ваш наставник рядом на каждом шаге.",
                    )}
                  </p>
                  <Action onClick={() => go(nextStep.view)}>
                    {completedCount === 3
                      ? t("Revezi experiența ta", "Посмотреть свой опыт")
                      : t("Continuă traseul", "Продолжить маршрут")}
                  </Action>
                  <span className="hero-footnote">
                    {t(
                      "Un singur curs. Un exemplu complet. În ritmul tău.",
                      "Один курс. Полный пример. В вашем темпе.",
                    )}
                  </span>
                </div>
                <AlgebraArt russian={locale === "ru"} />
              </section>
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <section className="panel plan-panel">
                    <div className="panel-heading spread">
                      <div>
                        <p className="eyebrow">
                          {t("TRASEUL TĂU", "ВАШ МАРШРУТ")}
                        </p>
                        <h2>
                          {t(
                            "Pași mici. Aplicare concretă.",
                            "Маленькие шаги. Реальная практика.",
                          )}
                        </h2>
                      </div>
                      <span className="progress-caption">
                        {completedCount}
                        <span> / 3</span>
                      </span>
                    </div>
                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label={t(
                        "Progresul traseului demonstrativ",
                        "Прогресс демомаршрута",
                      )}
                      aria-valuenow={completedCount}
                      aria-valuemin={0}
                      aria-valuemax={3}
                    >
                      <span
                        style={{ width: `${(completedCount / 3) * 100}%` }}
                      />
                    </div>
                    <div className="plan-list">
                      {steps.map((step, index) => (
                        <button
                          className={`plan-step ${progress.completed[index] ? "is-complete" : ""}`}
                          key={step.view}
                          onClick={() => go(step.view)}
                        >
                          <span className="step-number">
                            {progress.completed[index] ? (
                              <Check size={16} />
                            ) : (
                              `0${index + 1}`
                            )}
                          </span>
                          <span className="step-info">
                            <strong>{step.title[locale]}</strong>
                            <small>{step.description[locale]}</small>
                          </span>
                          <span className="step-time">
                            {locale === "ru"
                              ? step.time.replace("min", "мин")
                              : step.time}
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      ))}
                    </div>
                    <p className="footnote">
                      {t(
                        "Progresul reflectă pașii explorați în demo, nu rezultate la clasă.",
                        "Прогресс отражает этапы демо, а не результаты в классе.",
                      )}
                    </p>
                  </section>
                  <section className="panel current-course">
                    <div className="section-heading">
                      <h2>
                        {t("Cursul tău, la îndemână", "Ваш курс под рукой")}
                      </h2>
                      <button
                        className="text-button"
                        onClick={() => go("course")}
                      >
                        {t("Vezi cursul", "Открыть курс")}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    <div className="course-preview">
                      <div className="mini-course-art" aria-hidden="true">
                        <span>2x + 3</span>
                        <span>= 11</span>
                      </div>
                      <div>
                        <Badge>{t("MATEMATICĂ · VII", "МАТЕМАТИКА · 7")}</Badge>
                        <h3>
                          {t("Ecuații de gradul I", "Линейные уравнения")}
                        </h3>
                        <p>
                          {t(
                            "Înțelegere, argumentare și verificare.",
                            "Понимание, объяснение и проверка.",
                          )}
                        </p>
                        <span className="course-meta">
                          <FileText size={14} />
                          {t(
                            "1 material demonstrativ",
                            "1 демонстрационный материал",
                          )}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
                <aside className="dashboard-right">
                  <section className="panel mentor-card">
                    <span className="mentor-card-icon">
                      <Sparkles size={23} strokeWidth={1.5} />
                    </span>
                    <Badge>{t("AI MENTOR", "AI-НАСТАВНИК")}</Badge>
                    <h2>
                      {t(
                        "O idee bună începe cu o întrebare.",
                        "Хорошая идея начинается с вопроса.",
                      )}
                    </h2>
                    <p>
                      {t(
                        "Explicații mai simple, activități adaptate sau un alt punct de vedere.",
                        "Простые объяснения, адаптированные задания или другой взгляд.",
                      )}
                    </p>
                    <Action onClick={() => go("mentor")} icon={MessageCircle}>
                      {t("Hai să explorăm", "Давайте изучать")}
                    </Action>
                    <span className="footnote">
                      {t(
                        "Conversații exemplu · fără API",
                        "Примеры диалогов · без API",
                      )}
                    </span>
                  </section>
                  <section className="reflection-card">
                    <span className="reflection-card-icon">
                      <Lightbulb size={20} />
                    </span>
                    <span className="eyebrow">
                      {t("UN MOMENT DE REFLECȚIE", "МОМЕНТ ДЛЯ РЕФЛЕКСИИ")}
                    </span>
                    <h3>
                      {t(
                        "Ce ai păstra? Ce ai schimba?",
                        "Что сохранить? Что изменить?",
                      )}
                    </h3>
                    <p>
                      {t(
                        "Experiențele devin valoroase când înțelegem ce am învățat din ele.",
                        "Опыт становится ценным, когда мы понимаем, чему научились.",
                      )}
                    </p>
                    <button
                      className="text-button"
                      onClick={() => go("experience")}
                    >
                      {t("Deschide jurnalul", "Открыть журнал")}
                      <ArrowRight size={15} />
                    </button>
                  </section>
                </aside>
              </div>
              <section className="principles-strip">
                <div>
                  <ShieldCheck size={19} />
                  <span>
                    {t("Tu verifici și decizi", "Вы проверяете и решаете")}
                  </span>
                </div>
                <div>
                  <LockKeyhole size={18} />
                  <span>
                    {t(
                      "Fișe private, fără publicare",
                      "Личные карточки без публикации",
                    )}
                  </span>
                </div>
                <div>
                  <GraduationCap size={20} />
                  <span>{t("Cu AI sau fără AI", "С AI или без AI")}</span>
                </div>
              </section>
            </>
          )}
          {view === "course" && <CourseView {...props} />}
          {view === "mentor" && <MentorView {...props} />}
          {view === "activities" && <ActivitiesView {...props} />}
          {view === "experience" && <ExperienceView {...props} />}
          <footer className="page-footer">
            <span>
              EduMentor AI <span className="footer-dot">·</span>{" "}
              {t(
                "Învățare cu sens. Experiențe care rămân.",
                "Осмысленное обучение. Опыт, который остаётся.",
              )}
            </span>
            <span>
              <CircleHelp size={13} />
              {t(
                "Date fictive · Salvare în acest browser",
                "Вымышленные данные · Хранение в браузере",
              )}
            </span>
            <button className="footer-reset text-button" onClick={reset}>
              <RotateCcw size={13} />
              {t("Reia demonstrația", "Начать заново")}
            </button>
          </footer>
        </main>
      </div>
      <div
        className={`toast ${toast ? "toast-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <Check size={17} />
            <span>{toast}</span>
            <button
              aria-label={t("Închide mesajul", "Закрыть сообщение")}
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
