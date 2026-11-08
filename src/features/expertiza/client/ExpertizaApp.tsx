"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  BookOpen,
  Crown,
  Heart,
  MessageCircle,
  MessagesSquare,
  Pin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { roleLabels } from "@/lib/accounts";
import type { Locale } from "@/lib/demo";
import type { Command, ExpertizaState, Message, Question } from "../shared";

type Tab =
  "questions" | "communities" | "teachers" | "info" | "messages" | "profile";
const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "questions", label: "Întrebări", icon: MessageCircle },
  { id: "communities", label: "Comunități", icon: Users },
  { id: "teachers", label: "Profesori", icon: ShieldCheck },
  { id: "info", label: "Informații", icon: BookOpen },
  { id: "messages", label: "Mesaje", icon: MessagesSquare },
  { id: "profile", label: "Profilul meu", icon: Crown },
];
async function api<T>(path: string, command?: Command): Promise<T> {
  const response = await fetch(`/api/expertiza/${path}`, {
    cache: "no-store",
    ...(command
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        }
      : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Serverul nu a răspuns. Reîncearcă.");
  }
  if (!response.ok)
    throw new Error(data.error || "Datele nu au putut fi salvate.");
  return data;
}
function fields(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  return (name: string) => String(data.get(name) || "").trim();
}
function Field({
  label,
  name,
  max = 2000,
  multiline = false,
  optional = false,
  initial = "",
}: {
  label: string;
  name: string;
  max?: number;
  multiline?: boolean;
  optional?: boolean;
  initial?: string;
}) {
  const props = {
    name,
    required: !optional,
    maxLength: max,
    defaultValue: initial,
  };
  return (
    <label className="ex-field">
      <span>{label}</span>
      {multiline ? <textarea {...props} rows={3} /> : <input {...props} />}
    </label>
  );
}
function Demo({ children = "Exemplu fictiv" }: { children?: ReactNode }) {
  return <span className="ex-demo">{children}</span>;
}
const role = (value: string) =>
  value === "ai"
    ? "Asistent AI"
    : value === "demo"
      ? "Exemplu fictiv"
      : roleLabels[value as keyof typeof roleLabels]?.ro || "Membru";
function Stamp({ name, kind }: { name: string; kind: string }) {
  return (
    <span className="ex-author">
      <span
        className={`ex-avatar ${kind === "ai" ? "ex-ai-avatar" : ""}`}
        aria-hidden="true"
      >
        {kind === "ai" ? (
          <Sparkles size={17} />
        ) : (
          name.slice(0, 2).toUpperCase()
        )}
      </span>
      <span>
        <strong>{name}</strong>
        <small>{role(kind)}</small>
      </span>
    </span>
  );
}
type Mutate = (command: Command) => Promise<boolean>;

export function ExpertizaApp({ locale = "ro" }: { locale?: Locale }) {
  const t = (ro: string, ru: string) => locale === "ro" ? ro : ru;
  const [state, setState] = useState<ExpertizaState | null>(null),
    [tab, setTab] = useState<Tab>("questions"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [pending, setPending] = useState(false),
    [loading, setLoading] = useState(true);
  const busy = useRef(false),
    mounted = useRef(true);
  const [filter, setFilter] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api<ExpertizaState>("state");
      if (mounted.current) setState(data);
    } catch (err) {
      if (mounted.current) setError((err as Error).message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, []);
  const mutate: Mutate = async (command) => {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    setError("");
    setNotice("");
    try {
      await api("actions", command);
      setNotice("Salvat în Supabase.");
      try {
        setState(await api<ExpertizaState>("state"));
      } catch {
        setError(
          "Modificarea este salvată. Reîncarcă fluxul pentru a vedea actualizarea.",
        );
      }
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  const admin = state?.me.role === "administrator";
  const contributions =
    state?.questions.reduce(
      (n, q) => n + q.replies.filter((r) => r.authorId === state.me.id).length,
      0,
    ) || 0;
  return (
    <section className="expertiza" lang="ro" aria-busy={pending || loading}>
      <header className="ex-heading" lang={locale}>
        <div>
          <p className="eyebrow">{t("COMUNITATEA EDUMENTOR", "СООБЩЕСТВО EDUMENTOR")}</p>
          <h1 id="page-title" tabIndex={-1}>
            {t("Expertiză", "Экспертиза")}
          </h1>
          <p>{t("Întreabă. Împărtășește. Creștem împreună.", "Спрашивайте. Делитесь. Развиваемся вместе.")}</p>
        </div>
        <span className="ex-connected">
          <span />{" "}
          {state ? t("Date încărcate din Supabase", "Данные загружены из Supabase") : t("Se verifică datele…", "Проверяем данные…")}
        </span>
      </header>
      <div className="ex-hero">
        <div>
          <span className="ex-kicker">UN SPAȚIU PENTRU IDEILE TALE</span>
          <h2>
            O întrebare bună.
            <br />
            <span>Mai multe perspective.</span>
          </h2>
          <p>Elevi și profesori, în aceeași comunitate de învățare.</p>
        </div>
        <div className="ex-hero-art" aria-hidden="true">
          <MessagesSquare />
          <span className="ex-orbit">✦</span>
          <span className="ex-orbit ex-orbit-two">?</span>
        </div>
      </div>
      <nav className="ex-tabs" aria-label="Secțiuni Expertiză">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => {
              setTab(id);
              setNotice("");
              setError("");
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <div className="ex-alert" role="alert">
          <p>{error}</p>
          <button onClick={() => void load()} disabled={pending || loading}>
            Reîncarcă datele
          </button>
        </div>
      )}
      <p role="status" className="ex-status">
        {pending
          ? "Se salvează…"
          : loading
            ? "Se încarcă datele comunității…"
            : notice}
      </p>
      {state && (
        <>
          <div className="ex-summary">
            <span>
              <strong>{state.communities.length}</strong> comunități
            </span>
            <span>
              <strong>{state.questions.length}</strong> întrebări în flux
            </span>
            <span>
              <strong>{contributions}</strong> răspunsuri de la tine{" "}
              {contributions >= 3 && (
                <Crown size={16} aria-label="Coroană pentru contribuții" />
              )}
            </span>
          </div>
          <p className="ex-source">
            Conținutul inițial din Daily este demonstrativ. Contribuțiile
            conturilor conectate se salvează în Supabase.
          </p>
          {tab === "questions" && (
            <div className="ex-columns">
              <div className="ex-stack">
                <form
                  className="ex-card ex-compose"
                  onSubmit={async (event) => {
                    const form = event.currentTarget,
                      v = fields(event);
                    if (
                      await mutate({
                        action: "question",
                        title: v("title"),
                        body: v("body"),
                        communityId: v("community") || null,
                      })
                    )
                      form.reset();
                  }}
                >
                  <div className="ex-section-title">
                    <span className="ex-icon">
                      <MessageCircle size={19} />
                    </span>
                    <h2>Ce vrei să afli astăzi?</h2>
                  </div>
                  <Field label="Întrebarea ta" name="title" max={140} />
                  <Field
                    label="Detalii (opțional)"
                    name="body"
                    multiline
                    optional
                  />
                  <div className="ex-form-row">
                    <label className="ex-field">
                      <span>Publică în</span>
                      <select name="community">
                        <option value="">Comunitatea EduMentor</option>
                        {state.communities
                          .filter((c) => c.joined)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <button className="ex-primary" disabled={pending}>
                      Publică întrebarea <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <small>
                    Întrebările sunt vizibile membrilor autentificați. Evită
                    datele personale.
                  </small>
                </form>
                <div className="ex-section-bar">
                  <h2>Conversații recente</h2>
                  <label className="ex-field ex-filter">
                    <span>Comunitate</span>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="">Toate comunitățile</option>
                      {state.communities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {state.questions
                  .filter((q) => !filter || q.communityId === filter)
                  .map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      state={state}
                      mutate={mutate}
                      pending={pending}
                    />
                  ))}
                {!state.questions.some(
                  (q) => !filter || q.communityId === filter,
                ) && (
                  <div className="ex-card ex-empty">
                    Încă nu sunt întrebări aici. Începe conversația.
                  </div>
                )}
              </div>
              <aside className="ex-stack ex-side">
                <div className="ex-card ex-tip">
                  <Sparkles size={24} />
                  <h2>Ideea zilei</h2>
                  <p>{state.tips[0]}</p>
                  <span className="ex-overline">
                    ÎNVĂȚAREA CONTINUĂ ÎMPREUNĂ
                  </span>
                </div>
                <div className="ex-card">
                  <h2>Comunitățile tale</h2>
                  {state.communities
                    .filter((c) => c.joined)
                    .map((c) => (
                      <p key={c.id}>{c.name}</p>
                    ))}
                  {!state.communities.some((c) => c.joined) && (
                    <p>Alege o comunitate și alătură-te conversației.</p>
                  )}
                  <button
                    className="ex-link"
                    onClick={() => setTab("communities")}
                  >
                    Explorează comunitățile <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="ex-card ex-soft">
                  <Crown size={22} />
                  <h2>Fiecare răspuns contează</h2>
                  <p>
                    Primești o coroană după 3 răspunsuri publicate de tine în
                    fluxul recent.
                  </p>
                </div>
              </aside>
            </div>
          )}
          {tab === "communities" && (
            <div className="ex-stack">
              <div className="ex-section-bar">
                <h2>Găsește-ți comunitatea</h2>
                <span>Discuții deschise membrilor EduMentor</span>
              </div>
              <div className="ex-grid">
                {state.communities.map((c) => (
                  <article className="ex-card" key={c.id}>
                    <div className="ex-community-icon">
                      <Users size={24} />
                    </div>
                    <div className="ex-badges">
                      {c.demo && <Demo />}
                      {c.pinned && <span className="ex-demo">Fixată</span>}
                    </div>
                    <h3>{c.name}</h3>
                    <p>{c.description}</p>
                    <small>{c.school}</small>
                    <div className="ex-card-bottom">
                      <span>{c.members} membri conectați</span>
                      <button
                        className={c.joined ? "" : "ex-primary"}
                        disabled={pending}
                        onClick={() =>
                          void mutate({
                            action: "join",
                            communityId: c.id,
                            active: !c.joined,
                          })
                        }
                      >
                        {c.joined ? "Părăsește" : "Alătură-te"}
                      </button>
                    </div>
                    {admin && (
                      <Moderation
                        kind="community"
                        id={c.id}
                        pinned={c.pinned}
                        mutate={mutate}
                        pending={pending}
                      />
                    )}
                  </article>
                ))}
              </div>
              {admin && (
                <form
                  className="ex-card ex-admin-form"
                  onSubmit={async (event) => {
                    const form = event.currentTarget,
                      v = fields(event);
                    if (
                      await mutate({
                        action: "community",
                        name: v("name"),
                        description: v("description"),
                        school: v("school"),
                      })
                    )
                      form.reset();
                  }}
                >
                  <h2>Comunitate nouă</h2>
                  <Field label="Nume" name="name" max={100} />
                  <Field label="Instituție / context" name="school" max={120} />
                  <Field
                    label="Descriere"
                    name="description"
                    max={500}
                    multiline
                  />
                  <button className="ex-primary" disabled={pending}>
                    Creează comunitatea
                  </button>
                </form>
              )}
            </div>
          )}
          {tab === "teachers" && (
            <div className="ex-stack">
              <div className="ex-section-bar">
                <h2>Perspective despre profesori</h2>
                <Demo>Director demonstrativ</Demo>
              </div>
              <p>
                Profilurile profesorilor și recenziile inițiale sunt fictive.
                Recenziile noi sunt contribuții ale conturilor conectate.
              </p>
              <div className="ex-grid">
                {state.teachers.map((t) => (
                  <article className="ex-card" key={t.id}>
                    <Stamp name={t.name} kind="demo" />
                    <h3>{t.subject}</h3>
                    <p>{t.position}</p>
                    <strong className="ex-rating">
                      ★{" "}
                      {(
                        t.reviews.reduce((n, r) => n + r.stars, 0) /
                        Math.max(t.reviews.length, 1)
                      ).toFixed(1)}{" "}
                      <small>din {t.reviews.length} recenzii</small>
                    </strong>
                    <details>
                      <summary>Vezi recenziile</summary>
                      <div className="ex-stack">
                        {t.reviews.map((r) => (
                          <blockquote className="ex-review" key={r.id}>
                            <strong>
                              {r.authorName} · {r.stars}/5
                            </strong>
                            {r.demo && <Demo />}
                            <p>{r.body}</p>
                          </blockquote>
                        ))}
                      </div>
                    </details>
                    <form
                      className="ex-review-form"
                      onSubmit={async (event) => {
                        const v = fields(event);
                        await mutate({
                          action: "review",
                          teacherId: t.id,
                          stars: Number(v("stars")),
                          body: v("body"),
                        });
                      }}
                    >
                      <label className="ex-field">
                        <span>Evaluarea ta pentru {t.name}</span>
                        <select
                          name="stars"
                          defaultValue={
                            t.reviews.find((r) => r.authorId === state.me.id)
                              ?.stars || 5
                          }
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} din 5
                            </option>
                          ))}
                        </select>
                      </label>
                      <Field
                        label="Recenzia ta"
                        name="body"
                        max={1000}
                        multiline
                        initial={
                          t.reviews.find((r) => r.authorId === state.me.id)
                            ?.body || ""
                        }
                      />
                      <button disabled={pending}>Salvează recenzia</button>
                      <small>
                        O recenzie per cont. Salvarea actualizează recenzia ta.
                      </small>
                    </form>
                  </article>
                ))}
              </div>
            </div>
          )}
          {tab === "info" && (
            <div className="ex-stack">
              <div className="ex-section-bar">
                <h2>Școli și informații utile</h2>
                <Demo>Date de exemplu</Demo>
              </div>
              <div className="ex-grid">
                {state.schools.map((s) => (
                  <article className="ex-card" key={s.n}>
                    <BookOpen size={24} />
                    <h3>{s.n}</h3>
                    <p>{s.a}</p>
                    <small>
                      {s.el} elevi · {s.pr} profesori (exemplu)
                    </small>
                  </article>
                ))}
              </div>
              <h2>Regulamente și anunțuri</h2>
              <p>
                Regulile importate sunt exemple din prototip. Confirmă
                regulamentele aplicabile direct cu instituția ta.
              </p>
              {state.rules.map((r) => (
                <article className="ex-card" key={r.id}>
                  <div className="ex-badges">
                    {r.demo ? (
                      <Demo>Regulă de exemplu</Demo>
                    ) : (
                      <span className="ex-demo">Publicat de administrator</span>
                    )}
                  </div>
                  <h3>{r.title}</h3>
                  <p className="ex-body">{r.body}</p>
                </article>
              ))}
              <h2>Calendar demonstrativ</h2>
              <div className="ex-grid">
                {state.events.map((e, i) => (
                  <article className="ex-card" key={i}>
                    <Demo />
                    <p className="ex-event-date">
                      {e.d} {e.m}
                    </p>
                    <h3>{e.t}</h3>
                    <p>{e.p}</p>
                  </article>
                ))}
              </div>
              {admin && (
                <form
                  className="ex-card ex-admin-form"
                  onSubmit={async (event) => {
                    const form = event.currentTarget,
                      v = fields(event);
                    if (
                      await mutate({
                        action: "rule",
                        title: v("title"),
                        body: v("body"),
                      })
                    )
                      form.reset();
                  }}
                >
                  <h2>Publică o informație</h2>
                  <Field label="Titlu" name="title" max={140} />
                  <Field label="Conținut" name="body" max={4000} multiline />
                  <button disabled={pending} className="ex-primary">
                    Publică informația
                  </button>
                </form>
              )}
            </div>
          )}
          {tab === "messages" && (
            <Messages state={state} mutate={mutate} pending={pending} />
          )}
          {tab === "profile" && (
            <div className="ex-columns">
              <div className="ex-stack">
                <form
                  className="ex-card"
                  onSubmit={async (event) => {
                    const v = fields(event);
                    await mutate({
                      action: "profile",
                      name: v("name"),
                      school: v("school"),
                      subject: v("subject"),
                    });
                  }}
                >
                  <Stamp name={state.me.name} kind={state.me.role} />
                  <h2>Profilul tău în comunitate</h2>
                  <Field
                    label="Nume afișat"
                    name="name"
                    max={80}
                    initial={state.me.name}
                  />
                  <Field
                    label="Instituție (opțional)"
                    name="school"
                    max={120}
                    initial={state.me.school}
                    optional
                  />
                  <Field
                    label="Disciplină / interes (opțional)"
                    name="subject"
                    max={80}
                    initial={state.me.subject}
                    optional
                  />
                  <p>
                    Aceste informații sunt vizibile membrilor autentificați.
                    Rolul contului este gestionat de administrator.
                  </p>
                  <button className="ex-primary" disabled={pending}>
                    Salvează profilul
                  </button>
                </form>
                {admin && (
                  <div className="ex-card">
                    <h2>Elemente arhivate</h2>
                    {state.archived.length === 0 && (
                      <p>Niciun element arhivat.</p>
                    )}
                    {state.archived.map((a) => (
                      <div className="ex-card-bottom" key={a.id}>
                        <span>{a.title}</span>
                        <button
                          disabled={pending}
                          onClick={() =>
                            void mutate({
                              action: "moderate",
                              kind: a.kind,
                              id: a.id,
                              flag: "archived",
                              active: false,
                            })
                          }
                        >
                          Restabilește
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <aside className="ex-card ex-tip">
                <Crown size={30} />
                <h2>
                  {contributions >= 3
                    ? "Ai primit o coroană!"
                    : "Experiența ta ajută comunitatea"}
                </h2>
                <p>
                  {contributions} răspunsuri publicate de tine în fluxul recent.
                </p>
                <p>Răspunsurile AI și exemplele nu se includ.</p>
              </aside>
            </div>
          )}
          <p className="ex-recent">
            Flux recent: până la 200 de înregistrări per categorie și 100 de
            mesaje per conversație.
          </p>
        </>
      )}
    </section>
  );
}

function Moderation({
  kind,
  id,
  pinned,
  mutate,
  pending,
}: {
  kind: "question" | "community";
  id: string;
  pinned: boolean;
  mutate: Mutate;
  pending: boolean;
}) {
  return (
    <div className="ex-moderation">
      <button
        disabled={pending}
        onClick={() =>
          void mutate({
            action: "moderate",
            kind,
            id,
            flag: "pinned",
            active: !pinned,
          })
        }
      >
        <Pin size={13} />
        {pinned ? "Desprinde" : "Fixează"}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (
            window.confirm(
              "Arhivezi acest element? Îl poți restabili din Profilul meu.",
            )
          )
            void mutate({
              action: "moderate",
              kind,
              id,
              flag: "archived",
              active: true,
            });
        }}
      >
        Arhivează
      </button>
    </div>
  );
}
function QuestionCard({
  question: q,
  state,
  mutate,
  pending,
}: {
  question: Question;
  state: ExpertizaState;
  mutate: Mutate;
  pending: boolean;
}) {
  const [answering, setAnswering] = useState(false),
    [aiNotice, setAiNotice] = useState(false);
  const community = state.communities.find((c) => c.id === q.communityId),
    canReply = !community || community.joined;
  return (
    <article className={`ex-card ex-question ${q.pinned ? "ex-pinned" : ""}`}>
      <div className="ex-card-top">
        <Stamp name={q.authorName} kind={q.role} />
        <div className="ex-badges">
          {q.pinned && (
            <span className="ex-demo">
              <Pin size={12} />
              Fixată
            </span>
          )}
          <span className="ex-category">{community?.name || "EduMentor"}</span>
        </div>
      </div>
      <h3>{q.title}</h3>
      {q.body && <p className="ex-body">{q.body}</p>}
      <div className="ex-actions">
        <button
          aria-pressed={q.liked}
          disabled={pending}
          onClick={() =>
            void mutate({ action: "like", questionId: q.id, active: !q.liked })
          }
        >
          <Heart size={16} />
          {q.likes} aprecieri
        </button>
        <button
          aria-expanded={answering}
          onClick={() => setAnswering(!answering)}
        >
          <MessageCircle size={16} />
          {q.replies.length} răspunsuri
        </button>
        <button
          className="ex-ai-link"
          onClick={() => setAiNotice(!aiNotice)}
          aria-expanded={aiNotice}
        >
          <Sparkles size={16} />
          Întreab-o pe Maria
        </button>
      </div>
      {aiNotice && (
        <div className="ex-ai-notice">
          <strong>Maria · asistent AI</strong>
          <p>
            Întrebarea și detaliile ei vor fi trimise către OpenAI. Răspunsul va
            fi publicat aici și poate conține erori.
          </p>
          <button
            disabled={pending || !canReply}
            onClick={async () => {
              if (await mutate({ action: "ai", questionId: q.id })) {
                setAiNotice(false);
                setAnswering(true);
              }
            }}
          >
            Trimite întrebarea către AI
          </button>
          {!canReply && (
            <small>Alătură-te comunității pentru a continua.</small>
          )}
        </div>
      )}
      {answering && (
        <div className="ex-replies">
          {q.replies.map((r) => (
            <div
              className={`ex-reply ${r.role === "ai" ? "ex-ai-reply" : ""}`}
              key={r.id}
            >
              <Stamp name={r.authorName} kind={r.role} />
              <p className="ex-body">{r.body}</p>
            </div>
          ))}
          {canReply ? (
            <form
              onSubmit={async (event) => {
                const form = event.currentTarget,
                  v = fields(event);
                if (
                  await mutate({
                    action: "answer",
                    questionId: q.id,
                    body: v("body"),
                  })
                )
                  form.reset();
              }}
            >
              <Field label="Răspunsul tău" name="body" multiline />
              <button disabled={pending} className="ex-primary">
                Publică răspunsul
              </button>
            </form>
          ) : (
            <p>
              Alătură-te comunității din secțiunea Comunități pentru a răspunde.
            </p>
          )}
        </div>
      )}
      {state.me.role === "administrator" && (
        <Moderation
          kind="question"
          id={q.id}
          pinned={q.pinned}
          mutate={mutate}
          pending={pending}
        />
      )}
    </article>
  );
}
function Messages({
  state,
  mutate,
  pending,
}: {
  state: ExpertizaState;
  mutate: Mutate;
  pending: boolean;
}) {
  const [recipient, setRecipient] = useState(state.contacts[0]?.id || ""),
    [messages, setMessages] = useState<Message[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true,
      inFlight = false;
    setMessages([]);
    setError("");
    async function load() {
      if (!recipient || inFlight) return;
      inFlight = true;
      setLoading(true);
      try {
        const result = await api<{ messages: Message[] }>(
          `messages?with=${encodeURIComponent(recipient)}`,
        );
        if (active) {
          setMessages(result.messages);
          setError("");
        }
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [recipient, refresh]);
  const person = state.contacts.find((p) => p.id === recipient);
  return (
    <div className="ex-messages">
      <aside className="ex-card ex-contacts">
        <h2>Conversații</h2>
        <p>Doar cu membrii autentificați.</p>
        {state.contacts.map((p) => (
          <button
            key={p.id}
            aria-pressed={recipient === p.id}
            onClick={() => setRecipient(p.id)}
          >
            <Stamp name={p.name} kind={p.role} />
          </button>
        ))}
      </aside>
      <div className="ex-card ex-conversation">
        <h2>
          {person
            ? `Mesaje cu ${person.name}`
            : "Nu există destinatari disponibili"}
        </h2>
        <p className="ex-source">
          Mesajele sunt private între cele două conturi participante.
        </p>
        {error && <p role="alert">{error}</p>}
        <div
          className="ex-message-list"
          role="log"
          aria-live="polite"
          aria-label="Istoricul conversației"
          aria-busy={loading}
        >
          {messages.length === 0 && !loading && (
            <p className="ex-empty">Niciun mesaj. Începe conversația.</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`ex-bubble ${m.senderId === state.me.id ? "ex-bubble-own" : ""}`}
            >
              <small>{m.senderId === state.me.id ? "Tu" : person?.name}</small>
              <p>{m.body}</p>
              <time dateTime={m.createdAt}>
                {new Date(m.createdAt).toLocaleString("ro-RO", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          ))}
        </div>
        {person && (
          <form
            key={recipient}
            onSubmit={async (event) => {
              const form = event.currentTarget,
                v = fields(event);
              if (
                await mutate({
                  action: "message",
                  recipientId: recipient,
                  body: v("body"),
                })
              ) {
                form.reset();
                setRefresh((n) => n + 1);
              }
            }}
          >
            <Field label="Mesajul tău" name="body" multiline />
            <button disabled={pending} className="ex-primary">
              Trimite mesajul
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
