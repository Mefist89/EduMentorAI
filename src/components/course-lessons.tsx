"use client";

import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import type { Locale } from "@/lib/demo";

type Lesson = { id: string; title: string; subject: string; grade: string; goal: string; content: string };
const empty = { title: "", subject: "", grade: "", goal: "", content: "" };
function valid(value: unknown): value is Lesson {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.length <= 64 && Object.entries(empty).every(([key]) => typeof item[key] === "string" && (item[key] as string).length <= (key === "content" ? 12000 : 300)) && Boolean((item.title as string).trim() && (item.content as string).trim());
}

export function CourseLessons({ locale, accountId }: { locale: Locale; accountId: string }) {
  const t = (ro: string, ru: string) => locale === "ro" ? ro : ru;
  const key = `edumentor-lessons-v1:${accountId}`;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [draft, setDraft] = useState(empty);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setReady(false); setLessons([]);
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (!Array.isArray(stored) || stored.length > 100 || !stored.every(valid)) throw new Error("data");
      setLessons(stored); setReady(true);
    } catch { setError(t("Lecțiile salvate nu pot fi încărcate în acest browser.", "Не удалось загрузить сохранённые уроки в этом браузере.")); }
  // The storage identity changes only when the signed-in account changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <section className="course-lessons" aria-label={t("Lecțiile mele", "Мои уроки")}>
    <div className="course-lessons-toolbar"><p>{t("Adaugă propriile materiale la curs.", "Добавьте собственные материалы к курсу.")}</p><button className="button button-primary" type="button" disabled={!ready} aria-expanded={open} aria-controls="lesson-composer" onClick={() => { setOpen(true); setNotice(""); }}><Plus size={17} aria-hidden="true" />{t("Adaugă lecție", "Добавить урок")}</button></div>
    {error && <p className="lesson-error" role="alert">{error}</p>}
    {notice && <p className="lesson-notice" role="status">{notice}</p>}
    {open && <form id="lesson-composer" className="panel lesson-composer" onSubmit={event => {
      event.preventDefault(); setError("");
      const lesson = { ...Object.fromEntries(Object.entries(draft).map(([k,v]) => [k,v.trim()])), id: crypto.randomUUID() };
      if (!valid(lesson) || lessons.length >= 100) { setError(t("Completează titlul și conținutul. Maximum 100 de lecții.", "Заполните название и содержание. Можно сохранить до 100 уроков.")); return; }
      const next = [...lessons, lesson];
      try { localStorage.setItem(key, JSON.stringify(next)); setLessons(next); setDraft(empty); setOpen(false); setNotice(t("Lecția a fost salvată în acest browser pentru contul tău.", "Урок сохранён в этом браузере для вашего аккаунта.")); }
      catch { setError(t("Salvarea nu a reușit. Verifică spațiul de stocare al browserului și reîncearcă.", "Не удалось сохранить урок. Проверьте хранилище браузера и повторите попытку.")); }
    }}>
      <h2>{t("Adaugă lecție", "Добавить урок")}</h2>
      <div className="lesson-fields">{([ ["title",t("Titlul lecției", "Название урока")], ["subject",t("Disciplina", "Предмет")], ["grade",t("Clasa", "Класс")], ["goal",t("Obiectivul lecției", "Цель урока")] ] as const).map(([field,label]) => <label key={field}>{label}{field === "title" ? " *" : ""}<input required={field === "title"} maxLength={300} value={draft[field]} onChange={e => setDraft(previous => ({...previous,[field]:e.target.value}))} /></label>)}</div>
      <label>{t("Conținutul lecției", "Содержание урока")} *<textarea required rows={7} maxLength={12000} value={draft.content} onChange={e=>setDraft(previous=>({...previous,content:e.target.value}))} /></label>
      <p className="muted small">{t("Salvare locală pentru contul tău, în acest browser. Lecția nu este publicată pentru elevi.", "Урок сохраняется для вашего аккаунта в этом браузере. Он не публикуется для учеников.")}</p>
      <div className="lesson-form-actions"><button className="button button-primary" type="submit"><Save size={16} aria-hidden="true" />{t("Salvează lecția", "Сохранить урок")}</button><button className="button button-secondary" type="button" onClick={()=>setOpen(false)}>{t("Anulează", "Отмена")}</button></div>
    </form>}
    {lessons.length > 0 && <div className="saved-lessons"><h2>{t("Lecțiile mele", "Мои уроки")} ({lessons.length})</h2>{lessons.map(lesson=><details key={lesson.id} className="panel"><summary>{lesson.title}</summary><p className="muted small">{[lesson.subject,lesson.grade].filter(Boolean).join(" · ")}</p>{lesson.goal && <p><strong>{t("Obiectiv: ","Цель: ")}</strong>{lesson.goal}</p>}<p className="lesson-content">{lesson.content}</p></details>)}</div>}
  </section>;
}
