"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  BookMarked,
  BookOpen,
  Check,
  CircleHelp,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  RotateCcw,
  Route,
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
import { type Account, roleLabels } from "@/lib/accounts";
import { LogoutButton } from "./login-form";
import { StudentLearning } from "./student-learning";
import { httpApi } from "@/features/trasee/client/api";

const TraseeApp = dynamic(
  () =>
    import("@/features/trasee/client/App").then((module) => module.TraseeApp),
  { loading: () => <p role="status">Se încarcă Trasee…</p> },
);

const navIcons = {
  dashboard: LayoutDashboard,
  course: BookOpen,
  mentor: MessageCircle,
  activities: WandSparkles,
  experience: BookMarked,
  trasee: Route,
};

export function MentorApp({ account }: { account: Account }) {
  const student = account.role === "elev";
  const allowedNavigation = navigation.filter(
    (item) =>
      !student || ["dashboard", "course", "activities"].includes(item.id),
  );
  const storageKey = `${STORAGE_KEY}:${account.id}`;
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
      setProgress(parseProgress(localStorage.getItem(storageKey)));
    } catch {
      setStorageError(true);
    }
    setReady(true);
    const readHash = () => {
      const id = window.location.hash.slice(1);
      if (
        navigation.some((item) => item.id === id) &&
        (!student || ["dashboard", "course", "activities"].includes(id))
      )
        setView(id as View);
      else setView("dashboard");
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [storageKey, student]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      setStorageError(true);
    }
  }, [progress, ready, storageKey]);

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
    <div className={`app-shell${student ? " student-shell" : ""}`}>
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
          {allowedNavigation.map((item) => {
            const Icon = navIcons[item.id];
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                aria-current={view === item.id ? "page" : undefined}
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>
                  {student && item.id === "activities"
                    ? t("Exerciții", "Задания")
                    : item.label[locale]}
                </span>
              </button>
            );
          })}
        </nav>
        {account.role === "administrator" && (
          <a className="admin-link" href="/admin">
            {t("Administrare", "Администрирование")}
          </a>
        )}
        <div className="sidebar-spacer" />
        <button className="reset-button" onClick={reset}>
          <RotateCcw size={16} />
          {t("Reia demonstrația", "Начать заново")}
        </button>
        <div className="sidebar-profile">
          <span className="profile-avatar">
            {account.role === "administrator"
              ? "AD"
              : account.role === "profesor"
                ? "PR"
                : "EL"}
          </span>
          <span>
            <strong>{roleLabels[account.role][locale]}</strong>
            <small>{t("Cont conectat", "Вход выполнен")}</small>
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
              {roleLabels[account.role][locale]}
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
              {account.role === "administrator"
                ? "AD"
                : account.role === "profesor"
                  ? "PR"
                  : "EL"}
            </span>
            <LogoutButton label={t("Deconectare", "Выйти")} />
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
          {student && <StudentLearning locale={locale} view={view} go={go} />}
          {!student && view === "dashboard" && (
            <Dashboard locale={locale} progress={progress} go={go} />
          )}
          {!student && view === "course" && <CourseView {...props} />}
          {!student && view === "mentor" && <MentorView {...props} />}
          {!student && view === "activities" && <ActivitiesView {...props} />}
          {!student && view === "experience" && <ExperienceView {...props} />}
          {!student && view === "trasee" && (
            <TraseeApp
              api={httpApi}
              canCoordinate={account.role === "administrator"}
            />
          )}
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
                view === "trasee"
                  ? "Catalog de formare · Marcaje salvate în cont"
                  : "Date fictive · Salvare în acest browser",
                view === "trasee"
                  ? "Каталог курсов · Отметки сохранены в аккаунте"
                  : "Вымышленные данные · Хранение в браузере",
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
