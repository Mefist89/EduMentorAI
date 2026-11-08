"use client";

import { useEffect, useState } from "react";
import {
  BookMarked,
  BookOpen,
  Check,
  CircleHelp,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  RotateCcw,
  WandSparkles,
  X,
} from "lucide-react";
import {
  initialProgress,
  navigation,
  parseProgress,
  STORAGE_KEY,
  type DemoProgress,
  type View,
} from "@/lib/demo";
import { ActivitiesView, CourseView, ExperienceView } from "./learning-views";
import { MentorChat as MentorView } from "./mentor-chat";
import { Dashboard } from "./dashboard";

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
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          <span>
            EduMentor<span className="brand-caption">AI MENTOR · MOLDOVA</span>
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
              </button>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
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
          <div className="topbar-title">
            <p>{t("PLATFORMĂ EDUCAȚIONALĂ", "ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА")}</p>
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
        <main
          id="main-content"
          className={`content ${view === "dashboard" ? "content-presentation" : ""}`}
        >
          {storageError && (
            <p className="storage-warning" role="alert">
              {t(
                "Stocarea browserului este indisponibilă. Poți explora demo-ul, dar progresul se păstrează doar până la reîncărcare.",
                "Хранилище браузера недоступно. Демо работает, но прогресс сохранится только до перезагрузки.",
              )}
            </p>
          )}
          {view === "dashboard" && (
            <Dashboard locale={locale} progress={progress} go={go} />
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
