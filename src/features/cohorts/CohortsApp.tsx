"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, GraduationCap, Pencil, Plus, RefreshCw, UserPlus, Users, X } from "lucide-react";
import type { Account } from "@/lib/accounts";
import type { Locale } from "@/lib/demo";
import { canCreate, emptyCohort, limits, MAX_MEMBERS, type CohortBoard, type CohortCommand, type CohortContent, type CohortView } from "./shared";

const messages: Record<string, [string, string]> = {
  invalid: ["Verifică numele și câmpurile grupului.", "Проверьте название и поля группы."],
  forbidden: ["Nu poți modifica acest grup.", "У вас нет прав на изменение этой группы."],
  unauthorized: ["Sesiunea a expirat. Conectează-te din nou.", "Сессия истекла. Войдите снова."],
  not_found: ["Grupul nu mai este disponibil.", "Группа больше недоступна."],
  invalid_student: ["Un cont selectat nu mai este disponibil ca elev. Reîncarcă lista.", "Выбранный аккаунт больше недоступен как ученик. Обновите список."],
  conflict: ["Grupul s-a schimbat. Reîncarcă datele și repetă acțiunea pe versiunea actuală.", "Группа изменилась. Обновите данные и повторите действие с актуальной версией."],
  full: ["Un grup poate avea cel mult 100 de elevi.", "В группе может быть не более 100 учеников."],
  unavailable: ["Nu am putut comunica cu Supabase. Reîncarcă datele înainte de a repeta salvarea.", "Не удалось связаться с Supabase. Обновите данные перед повторным сохранением."],
};
const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
async function api<T>(command?: CohortCommand, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/cohorts", { method: command ? "POST" : "GET", cache: "no-store", signal, ...(command ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(command) } : {}) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "unavailable");
  return body as T;
}
export function CohortsApp({ account, locale }: { account: Account; locale: Locale }) {
  const t = (ro: string, ru: string) => locale === "ro" ? ro : ru;
  const manager = canCreate(account);
  const [board, setBoard] = useState<CohortBoard | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const busyRef = useRef(false), loadSequence = useRef(0);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [editor, setEditor] = useState<{ group: CohortView | null; content: CohortContent } | null>(null);
  const [query, setQuery] = useState(""), [studentQuery, setStudentQuery] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const load = useCallback(async (signal?: AbortSignal) => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    try {
      const next = await api<CohortBoard>(undefined, signal);
      if (!signal?.aborted && sequence === loadSequence.current) { setBoard(next); setError(""); }
    } catch (e) { if (!signal?.aborted && sequence === loadSequence.current) setError(e instanceof Error ? e.message : "unavailable"); }
    finally { if (!signal?.aborted && sequence === loadSequence.current) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const groups = board?.cohorts ?? [];
  const selected = groups.find(group => group.id === selectedId) ?? groups[0];
  const filtered = groups.filter(group => fold(`${group.name} ${group.subject} ${group.educationLevel}`).includes(fold(query.trim())));
  const candidates = (board?.students ?? []).filter(student => !selected?.members.some(member => member.id === student.id));
  const visibleStudents = candidates.filter(student => fold(`${student.name} ${student.login}`).includes(fold(studentQuery.trim())));
  const selectedStudents = checked.filter(id => candidates.some(student => student.id === id));
  const studentCount = new Set(groups.flatMap(group => group.members.map(student => student.id))).size;
  function choose(id: string) { setSelectedId(id); setChecked([]); setStudentQuery(""); setEditor(null); setNotice(""); }
  async function act(command: CohortCommand) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const result = await api<{ id: string }>(command);
      setSelectedId(result.id); setChecked([]); setStudentQuery(""); setEditor(null);
      setNotice(command.action === "create" ? t("Grupul a fost creat.", "Группа создана.") : command.action === "edit" ? t("Datele grupului au fost salvate.", "Данные группы сохранены.") : command.action === "add" ? t("Elevii au fost adăugați în grup.", "Ученики добавлены в группу.") : t("Elevul a fost eliminat din grup. Contul său rămâne activ.", "Ученик удалён из группы. Его аккаунт остаётся активным."));
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "unavailable"); }
    finally { busyRef.current = false; setBusy(false); }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editor) void act(editor.group ? { action: "edit", id: editor.group.id, version: editor.group.version, content: editor.content } : { action: "create", content: editor.content });
  }
  return <section className="cohorts-page" aria-busy={loading || busy}>
    <header className="ch-header"><div><p className="ch-eyebrow">{t("ÎNVĂȚARE · GRUPURI · COLABORARE", "ОБУЧЕНИЕ · ГРУППЫ · СОТРУДНИЧЕСТВО")}</p><h1 id="page-title" tabIndex={-1}>{t("Cohorte", "Когорты")}</h1><p>{manager ? t("Creează grupuri de învățare și adaugă elevi din conturile platformei.", "Создавайте учебные группы и добавляйте учеников из аккаунтов платформы.") : t("Grupurile de învățare în care te-a adăugat profesorul.", "Учебные группы, в которые вас добавил преподаватель.")}</p></div>{manager && <button className="ch-primary" disabled={busy} onClick={() => { setEditor({ group: null, content: { ...emptyCohort } }); setError(""); setNotice(""); }}><Plus size={18} />{t("Creează grup", "Создать группу")}</button>}</header>
    <div className="ch-summary"><div><Users size={24} /><span><strong>{groups.length}</strong>{t("Grupuri accesibile", "Доступных групп")}</span></div><div>{manager ? <UserPlus size={24} /> : <GraduationCap size={24} />}<span><strong>{manager ? studentCount : t("Elev", "Ученик")}</strong>{manager ? t("Elevi în grupurile tale", "Учеников в ваших группах") : t("Acces la grupurile tale", "Доступ к своим группам")}</span></div><p>{t("Componența se păstrează în cont și este disponibilă după reîncărcare.", "Состав сохраняется в аккаунте и доступен после перезагрузки.")}</p></div>
    {notice && <p className="ch-notice" role="status"><CheckCircle2 size={18} />{notice}</p>}
    {error && <div className="ch-error" role="alert"><p>{t(...(messages[error] ?? messages.unavailable))}</p><button disabled={loading || busy} onClick={() => void load()}>{t("Reîncarcă datele", "Обновить данные")}</button>{error === "unauthorized" && <a href="/login">{t("Conectare", "Войти")}</a>}</div>}
    {editor && manager ? <section className="ch-panel"><div className="ch-section-heading"><h2>{editor.group ? t("Editează grupul", "Редактирование группы") : t("Un grup nou de învățare", "Новая учебная группа")}</h2><button disabled={busy} onClick={() => setEditor(null)}><ArrowLeft size={16} />{t("Înapoi", "Назад")}</button></div><p className="ch-muted">{t("Numele este obligatoriu. După creare, selectează elevii pentru a forma componența grupului.", "Название обязательно. После создания выберите учеников, чтобы сформировать состав группы.")}</p><form onSubmit={save}><fieldset disabled={busy}><div className="ch-form-grid">{([ ["name", "Numele grupului", "Название группы"], ["subject", "Disciplina", "Предмет"], ["educationLevel", "Nivel / clasă", "Уровень / класс"], ["description", "Descriere", "Описание"] ] as const).map(([key, ro, ru]) => <div key={key} className={key === "name" || key === "description" ? "ch-wide" : ""}><label htmlFor={`ch-${key}`}>{t(ro, ru)}{key === "name" ? " *" : ""}</label>{key === "description" ? <textarea id={`ch-${key}`} rows={4} value={editor.content[key]} maxLength={limits[key]} onChange={e => setEditor(previous => previous && ({ ...previous, content: { ...previous.content, [key]: e.target.value } }))} /> : <input id={`ch-${key}`} required={key === "name"} maxLength={limits[key]} value={editor.content[key]} onChange={e => setEditor(previous => previous && ({ ...previous, content: { ...previous.content, [key]: e.target.value } }))} />}</div>)}</div><button type="submit" className="ch-primary ch-save">{busy ? t("Se salvează…", "Сохранение…") : editor.group ? t("Salvează modificările", "Сохранить изменения") : t("Creează grupul", "Создать учебную группу")}</button></fieldset></form></section> : <>
      <div className="ch-toolbar"><div><label htmlFor="ch-search">{t("Caută un grup", "Поиск группы")}</label><input type="search" id="ch-search" maxLength={120} value={query} onChange={e => setQuery(e.target.value)} placeholder={t("Nume, disciplină sau clasă…", "Название, предмет или класс…")} /></div><button disabled={loading || busy} aria-label={t("Reîncarcă grupurile", "Обновить группы")} onClick={() => void load()}><RefreshCw size={18} /></button></div>
      {loading && !board && <p role="status">{t("Se încarcă grupurile…", "Загрузка групп…")}</p>}
      {!loading && !error && groups.length === 0 && <div className="ch-empty"><Users size={32} /><h2>{t("Învățarea începe cu un grup", "Обучение начинается с группы")}</h2><p>{manager ? t("Creează prima cohortă, apoi adaugă elevi și urmărește componența ei.", "Создайте первую когорту, затем добавьте учеников и просматривайте её состав.") : t("Nu ești încă într-un grup. Profesorul te poate adăuga folosind contul tău existent.", "Вы пока не состоите в группе. Преподаватель может добавить ваш существующий аккаунт.")}</p></div>}
      {groups.length > 0 && <div className="ch-workspace"><div className="ch-group-list" aria-label={t("Lista grupurilor", "Список групп")}>{filtered.map(group => <button className="ch-group" key={group.id} disabled={busy} aria-pressed={selected?.id === group.id} onClick={() => choose(group.id)}><span className="ch-group-icon"><BookOpen size={20} /></span><span><strong>{group.name}</strong><small>{group.subject || t("Disciplină neindicată", "Предмет не указан")}{group.educationLevel ? ` · ${group.educationLevel}` : ""}</small><small>{t("Participanți", "Участников")}: {group.studentCount}</small></span></button>)}{filtered.length === 0 && <p className="ch-muted">{t("Niciun grup nu corespunde căutării.", "По вашему запросу группы не найдены.")}</p>}</div>
      {selected && <section className="ch-panel ch-detail" aria-label={t("Detaliile grupului", "Данные группы")}><div className="ch-section-heading"><div><p className="ch-eyebrow">{t("GRUP DE ÎNVĂȚARE", "УЧЕБНАЯ ГРУППА")}</p><h2>{selected.name}</h2></div>{selected.canManage && <button disabled={busy} aria-label={t("Editează grupul", "Редактировать группу")} onClick={() => setEditor({ group: selected, content: { name: selected.name, subject: selected.subject, educationLevel: selected.educationLevel, description: selected.description } })}><Pencil size={16} /></button>}</div><p className="ch-muted">{selected.subject}{selected.educationLevel ? ` · ${selected.educationLevel}` : ""}</p>{selected.description && <p className="ch-description">{selected.description}</p>}<div className="ch-owner"><GraduationCap size={19} /><span>{t("Profesor responsabil", "Ответственный преподаватель")}<strong>{selected.teacherName}</strong></span></div>
        <div className="ch-section-heading"><h3>{t("Componența grupului", "Состав группы")}</h3><span>{selected.studentCount} / {MAX_MEMBERS}</span></div>
        {selected.canManage ? <><ul className="ch-roster">{selected.members.map(member => <li key={member.id}><span className="ch-avatar" aria-hidden="true">{member.available ? "E" : "?"}</span><span><strong>{member.available ? member.name : t("Cont indisponibil", "Аккаунт недоступен")}</strong>{member.login && <small>Login: {member.login}</small>}</span><button disabled={busy} aria-label={`${t("Elimină din grup", "Удалить из группы")}: ${member.name}`} onClick={() => void act({ action: "remove", id: selected.id, version: selected.version, studentId: member.id })}><X size={16} /></button></li>)}</ul>{selected.members.length === 0 && <p className="ch-muted">{t("Grupul nu are încă elevi. Adaugă primii participanți mai jos.", "В группе пока нет учеников. Добавьте первых участников ниже.")}</p>}
        <div className="ch-add-members"><h3><UserPlus size={19} />{t("Adaugă elevi", "Добавить учеников")}</h3><p className="ch-muted">{t("Selectează conturi existente de elev. Adăugarea nu creează conturi sau parole noi.", "Выберите существующие аккаунты учеников. Добавление не создаёт новые аккаунты или пароли.")}</p><label htmlFor="ch-student-search">{t("Caută elevul după nume sau login", "Поиск ученика по имени или логину")}</label><input id="ch-student-search" type="search" maxLength={120} value={studentQuery} onChange={e => setStudentQuery(e.target.value)} /><fieldset className="ch-candidates" disabled={busy || loading || selected.studentCount >= MAX_MEMBERS}><legend className="sr-only">{t("Elevi disponibili", "Доступные ученики")}</legend>{visibleStudents.map(student => <label key={student.id}><input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={e => setChecked(previous => e.target.checked ? [...previous, student.id] : previous.filter(id => id !== student.id))} /><span><strong>{student.name}</strong>{student.login && <small>Login: {student.login}</small>}</span></label>)}{visibleStudents.length === 0 && <p className="ch-muted">{candidates.length === 0 ? t("Toate conturile disponibile sunt deja adăugate sau nu există încă elevi în platformă.", "Все доступные аккаунты уже добавлены либо на платформе пока нет учеников.") : t("Niciun elev nu corespunde căutării.", "По вашему запросу ученики не найдены.")}</p>}</fieldset><button className="ch-primary" disabled={busy || loading || selectedStudents.length === 0 || selected.studentCount + selectedStudents.length > MAX_MEMBERS} onClick={() => void act({ action: "add", id: selected.id, version: selected.version, studentIds: selectedStudents })}><UserPlus size={17} />{t("Adaugă selectați", "Добавить выбранных")} ({selectedStudents.length})</button></div></> : <p className="ch-member-note">{t("Ești membru al acestui grup. Profesorul gestionează componența; lista celorlalți elevi este privată.", "Вы участник этой группы. Преподаватель управляет составом; список остальных учеников скрыт.")}</p>}
      </section>}</div>}
    </>}
  </section>;
}
