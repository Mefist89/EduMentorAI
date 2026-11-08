"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, CheckCircle2, Clock3, FilePenLine, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import type { Account } from "@/lib/accounts";
import type { Locale } from "@/lib/demo";
import { canAuthor, emptyContent, fieldLimits, type Practice, type PracticeBoard, type PracticeCommand, type PracticeContent, type PracticeStatus } from "./shared";

type Tab = "library" | "mine" | "editor" | "moderation";
const statusText: Record<PracticeStatus, [string, string]> = { draft: ["Ciornă", "Черновик"], pending: ["În verificare", "На проверке"], approved: ["Publicată", "Опубликована"], rejected: ["Respinsă", "Отклонена"] };
const actionText = { create: ["Ciornă creată", "Черновик создан"], save: ["Ciornă salvată", "Черновик сохранён"], submit: ["Trimisă spre aprobare", "Отправлено на проверку"], approve: ["Aprobată și publicată", "Одобрено и опубликовано"], reject: ["Respinsă de moderator", "Отклонено модератором"] } as const;
const errorText: Record<string, [string, string]> = {
  invalid: ["Completează titlul; pentru trimitere, și disciplina, clasa, descrierea, problema și metodele. Sursa trebuie să fie un link HTTPS valid. Pentru respingere, explică motivul.", "Укажите заголовок; для отправки также нужны предмет, класс, описание, проблема и методы. Ссылка должна использовать HTTPS. При отклонении укажите причину."],
  forbidden: ["Nu ai permisiunea pentru această acțiune.", "У вас нет прав на это действие."],
  unauthorized: ["Sesiunea a expirat. Conectează-te din nou.", "Сессия истекла. Войдите снова."],
  conflict: ["Practica s-a schimbat sau nu mai poate fi modificată în această stare. Reîncarcă lista și deschide versiunea actuală.", "Практика изменилась или недоступна для этого действия. Обновите список и откройте актуальную версию."],
  unavailable: ["Nu am putut comunica cu Supabase. Verifică lista înainte de a repeta o salvare.", "Не удалось связаться с Supabase. Проверьте список перед повторным сохранением."],
  not_found: ["Practica nu mai este disponibilă.", "Практика больше недоступна."],
};
async function request<T>(command?: PracticeCommand, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/practices", { method: command ? "POST" : "GET", cache: "no-store", signal, ...(command ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(command) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "unavailable");
  return data as T;
}
export function PracticesApp({ locale, account }: { locale: Locale; account: Account }) {
  const t = (ro: string, ru: string) => locale === "ro" ? ro : ru;
  const [tab, setTab] = useState<Tab>("library");
  const [board, setBoard] = useState<PracticeBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Practice | null>(null);
  const [content, setContent] = useState<PracticeContent>({ ...emptyContent });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const author = canAuthor(account), admin = account.role === "administrator";
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try { setBoard(await request<PracticeBoard>(undefined, signal)); setError(""); }
    catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : "unavailable"); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const date = (value: string) => new Intl.DateTimeFormat(locale === "ro" ? "ro-MD" : "ru", { dateStyle: "medium", timeZone: "Europe/Bucharest" }).format(new Date(value));
  function openEditor(practice: Practice | null) {
    setEditing(practice);
    setContent(practice ? Object.fromEntries(Object.keys(emptyContent).map(key => [key, practice[key as keyof PracticeContent]])) as PracticeContent : { ...emptyContent, language: locale });
    setError(""); setNotice(""); setQuery(""); setStatus("all"); setTab("editor");
  }
  async function act(command: PracticeCommand) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const { practice } = await request<{ practice: Practice }>(command);
      setNotice(actionText[command.action][locale === "ro" ? 0 : 1] + ".");
      if (command.action === "create" || command.action === "save") { setEditing(practice); setContent(practice); }
      if (command.action === "submit") { setEditing(null); setTab("mine"); }
      if (command.action === "approve" || command.action === "reject") setNotes(previous => ({ ...previous, [practice.id]: "" }));
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "unavailable"); }
    finally { busyRef.current = false; setBusy(false); }
  }
  const pending = board?.moderation.filter(p => p.status === "pending").length ?? 0;
  const list = (tab === "mine" ? board?.mine : tab === "moderation" ? board?.moderation : board?.published) ?? [];
  const visible = list.filter(p => (tab !== "mine" || status === "all" || p.status === status) && (tab !== "moderation" || reviewStatus === "all" || p.status === reviewStatus) && `${p.title} ${p.subject} ${p.educationLevel} ${p.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const fields: [keyof typeof fieldLimits, string, string, boolean][] = [
    ["title", "Titlul practicii", "Название практики", false], ["subject", "Disciplina", "Предмет", false], ["educationLevel", "Nivel de studii / clasă", "Уровень обучения / класс", false],
    ["description", "Descrierea practicii", "Описание практики", true], ["problem", "Problema pedagogică", "Педагогическая проблема", true], ["method", "Metode utilizate", "Используемые методы", true], ["context", "Context și resurse", "Контекст и ресурсы", true], ["sourceUrl", "Sursă / material (link HTTPS, opțional)", "Источник / материал (HTTPS, необязательно)", false],
  ];
  return <section className="practices-page" aria-busy={busy || loading}>
    <header className="pr-header"><div><p className="pr-eyebrow">{t("EXPERIENȚĂ · COMUNITATE · ÎNVĂȚARE", "ОПЫТ · СООБЩЕСТВО · ОБУЧЕНИЕ")}</p><h1 id="page-title" tabIndex={-1}>{t("Practici pedagogice", "Педагогические практики")}</h1><p>{t("Experiențe de la clasă, revizuite de un administrator înainte de publicare.", "Опыт работы в классе с проверкой администратором перед публикацией.")}</p></div>{author && <button className="pr-primary" disabled={busy} onClick={() => openEditor(null)}><Plus size={18} />{t("Adaugă practică", "Добавить практику")}</button>}</header>
    <div className="pr-workflow"><FilePenLine size={21} /><span>{t("Ciornă", "Черновик")}</span><span aria-hidden="true">→</span><Clock3 size={21} /><span>{t("În verificare", "На проверке")}</span><span aria-hidden="true">→</span><ShieldCheck size={21} /><span>{t("Publicată sau respinsă cu observații", "Публикация или отклонение с замечаниями")}</span></div>
    <nav className="pr-tabs" aria-label={t("Secțiuni practici", "Разделы практик")}>
      {([["library", t("Biblioteca de practici", "Библиотека практик"), BookOpen], ...(author ? [["mine", t("Practicile mele", "Мои практики"), FilePenLine] as const] : []), ...(admin ? [["moderation", `${t("Moderare", "Модерация")} (${pending})`, ShieldCheck] as const] : [])] as const).map(([id, label, Icon]) => <button key={id} disabled={busy} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); setQuery(""); setError(""); }}><Icon size={17} />{label}</button>)}
      <button className="pr-refresh" disabled={busy || loading} aria-label={t("Reîncarcă practicile", "Обновить практики")} onClick={() => void load()}><RefreshCw size={17} /></button>
    </nav>
    {notice && <p className="pr-notice" role="status"><CheckCircle2 size={18} />{notice}</p>}
    {error && <div className="pr-error" role="alert"><p>{t(...(errorText[error] ?? errorText.unavailable))}</p><button disabled={busy || loading} onClick={() => void load()}>{t("Reîncarcă lista", "Обновить список")}</button>{error === "unauthorized" && <a href="/login">{t("Conectare", "Войти")}</a>}</div>}
    {tab === "editor" && author ? <section className="pr-editor"><div className="pr-section-heading"><h2>{editing ? t("Editează ciorna", "Редактирование черновика") : t("O idee din practica ta", "Идея из вашей практики")}</h2>{editing && <span className={`pr-status pr-${editing.status}`}>{t(...statusText[editing.status])}</span>}</div><p>{t("Titlul este necesar pentru salvare. Înainte de trimitere completează și disciplina, clasa, descrierea, problema și metodele. Nu include date personale ale elevilor.", "Для сохранения нужен заголовок. Перед отправкой заполните также предмет, класс, описание, проблему и методы. Не включайте персональные данные учеников.")}</p>
      <form onSubmit={e => { e.preventDefault(); void act(editing ? { action: "save", id: editing.id, version: editing.version, content } : { action: "create", content }); }}>
        <fieldset disabled={busy}><div className="pr-form-grid">{fields.map(([key, ro, ru, area]) => <div className={area || key === "title" || key === "sourceUrl" ? "pr-wide" : ""} key={key}><label htmlFor={`pr-${key}`}>{t(ro, ru)}{key === "title" ? " *" : ""}</label>{area ? <textarea id={`pr-${key}`} rows={key === "description" || key === "method" ? 5 : 3} maxLength={fieldLimits[key]} value={content[key]} onChange={e => setContent(previous => ({ ...previous, [key]: e.target.value }))} /> : <input id={`pr-${key}`} type={key === "sourceUrl" ? "url" : "text"} required={key === "title"} maxLength={fieldLimits[key]} value={content[key]} onChange={e => setContent(previous => ({ ...previous, [key]: e.target.value }))} />}</div>)}<label htmlFor="pr-language"><span>{t("Limba practicii", "Язык практики")}</span><select id="pr-language" value={content.language} onChange={e => setContent(previous => ({ ...previous, language: e.target.value as "ro" | "ru" }))}><option value="ro">Română</option><option value="ru">Русский</option></select></label></div>
          <div className="pr-form-actions"><button type="submit" className="pr-primary">{busy ? t("Se salvează…", "Сохранение…") : t("Salvează ciorna", "Сохранить черновик")}</button><button type="button" onClick={() => { setTab("mine"); setQuery(""); }}>{t("Înapoi la practicile mele", "К моим практикам")}</button></div>
        </fieldset>
      </form>
      {editing && <p className="pr-save-hint">{t("Salvează modificările înainte de a părăsi formularul. Pentru publicare, mergi la «Practicile mele» și trimite versiunea salvată spre aprobare.", "Сохраните изменения перед выходом из формы. Для публикации перейдите в «Мои практики» и отправьте сохранённую версию на проверку.")}</p>}
    </section> : <>
      <div className="pr-list-tools"><label htmlFor="pr-search"><span>{t("Caută o practică", "Поиск практики")}</span><input id="pr-search" type="search" maxLength={160} value={query} onChange={e => setQuery(e.target.value)} placeholder={t("Titlu, disciplină sau clasă…", "Название, предмет или класс…")} /></label>{(tab === "mine" || tab === "moderation") && <label htmlFor="pr-status-filter"><span>{t("Stare", "Статус")}</span><select id="pr-status-filter" value={tab === "mine" ? status : reviewStatus} onChange={e => tab === "mine" ? setStatus(e.target.value) : setReviewStatus(e.target.value)}><option value="all">{t("Toate stările", "Все статусы")}</option>{Object.entries(statusText).map(([id, words]) => <option key={id} value={id}>{t(...words)}</option>)}</select></label>}</div>
      <div className="pr-section-heading"><h2>{tab === "mine" ? t("Practicile mele", "Мои практики") : tab === "moderation" ? t("Verificarea practicilor", "Проверка практик") : t("Biblioteca comunității", "Библиотека сообщества")}</h2><span role="status">{loading ? t("Se încarcă…", "Загрузка…") : `${visible.length} ${locale === "ro" ? visible.length === 1 ? "practică" : "practici" : visible.length % 10 === 1 && visible.length % 100 !== 11 ? "практика" : [2,3,4].includes(visible.length % 10) && ![12,13,14].includes(visible.length % 100) ? "практики" : "практик"}`}</span></div>
      {!loading && !error && visible.length === 0 && <div className="pr-empty"><BookOpen size={30} /><h3>{t("Nu există practici în această selecție", "В этой подборке пока нет практик")}</h3><p>{tab === "library" ? t("Aici vor apărea numai practicile aprobate. Profesorii pot propune experiențe de la clasă pentru comunitate.", "Здесь появятся только одобренные практики. Учителя могут предложить сообществу свой опыт работы в классе.") : t("Schimbă filtrul sau adaugă o practică nouă. Ciornele nu sunt publice.", "Измените фильтр или добавьте практику. Черновики не видны другим пользователям.")}</p>{author && <button className="pr-primary" disabled={busy} onClick={() => openEditor(null)}>{t("Adaugă practică", "Добавить практику")}</button>}</div>}
      <div className="pr-grid">{visible.map(practice => <article className="pr-card" key={practice.id}>
        <div className="pr-card-top"><span>{practice.subject || t("Disciplină neindicată", "Предмет не указан")}</span><span className={`pr-status pr-${practice.status}`}>{t(...statusText[practice.status])}</span></div>
        <h3 lang={practice.language}>{practice.title}</h3><p className="pr-card-meta">{practice.educationLevel} · {practice.language === "ro" ? "Română" : "Русский"} · {practice.authorName} · {date(practice.updatedAt)}</p><p className="pr-description" lang={practice.language}>{practice.description || t("Descriere în lucru.", "Описание ещё не заполнено.")}</p>
        <details><summary>{t("Detalii despre practică", "Подробнее о практике")}</summary><dl>{([["problem", t("Problema pedagogică", "Педагогическая проблема")], ["method", t("Metode utilizate", "Используемые методы")], ["context", t("Context și resurse", "Контекст и ресурсы")]] as const).map(([key, label]) => practice[key] ? <div key={key}><dt>{label}</dt><dd lang={practice.language}>{practice[key]}</dd></div> : null)}</dl>{practice.sourceUrl && <a href={practice.sourceUrl} target="_blank" rel="noopener noreferrer">{t("Deschide materialul (filă nouă)", "Открыть материал (новая вкладка)")} ↗</a>}</details>
        {practice.reviewNote && <div className="pr-feedback"><strong>{t("Observația moderatorului", "Замечание модератора")}</strong><p>{practice.reviewNote}</p></div>}
        {(tab === "mine" || tab === "moderation") && practice.history.length > 0 && <details className="pr-history"><summary>{t("Istoricul verificării", "История проверки")}</summary><ol>{practice.history.map((event, i) => <li key={i}><strong>{actionText[event.action][locale === "ro" ? 0 : 1]}</strong><time dateTime={event.at}>{date(event.at)}</time>{event.note && <p>{event.note}</p>}</li>)}</ol></details>}
        {tab === "mine" && ["draft", "rejected"].includes(practice.status) && <div className="pr-card-actions"><button disabled={busy} onClick={() => openEditor(practice)}>{t("Editează", "Редактировать")}</button><button className="pr-primary" disabled={busy} onClick={() => void act({ action: "submit", id: practice.id, version: practice.version })}>{t("Trimite spre aprobare", "Отправить на проверку")}</button></div>}
        {tab === "mine" && practice.status === "pending" && <p className="pr-save-hint">{t("Așteaptă decizia administratorului. Versiunea trimisă nu poate fi editată în timpul verificării.", "Ожидает решения администратора. Отправленная версия недоступна для редактирования во время проверки.")}</p>}
        {tab === "moderation" && admin && practice.status === "pending" && <div className="pr-review"><div className="pr-review-field"><label htmlFor={`review-${practice.id}`}>{t("Observație (obligatorie la respingere)", "Замечание (обязательно при отклонении)")}</label><textarea id={`review-${practice.id}`} maxLength={2000} rows={3} value={notes[practice.id] ?? ""} disabled={busy} onChange={e => setNotes(previous => ({ ...previous, [practice.id]: e.target.value }))} /></div><div className="pr-card-actions"><button className="pr-primary" disabled={busy} onClick={() => void act({ action: "approve", id: practice.id, version: practice.version, note: notes[practice.id] ?? "" })}>{t("Aprobă și publică", "Одобрить и опубликовать")}</button><button className="pr-reject" disabled={busy || !notes[practice.id]?.trim()} onClick={() => void act({ action: "reject", id: practice.id, version: practice.version, note: notes[practice.id] ?? "" })}>{t("Respinge", "Отклонить")}</button></div></div>}
      </article>)}</div>
    </>}
  </section>;
}
