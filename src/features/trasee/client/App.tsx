"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CourseDetail } from "../shared/rank";
import type { RankedCourse, SearchResponse } from "../shared/types";
import type { Api } from "./api";
import { CompareDialog } from "./components/CompareDialog";
import { Coordinators } from "./components/Coordinators";
import { CourseDrawer } from "./components/CourseDrawer";
import { Results, type Filters } from "./components/Results";
import { SearchForm, type Query } from "./components/SearchForm";
import { IconCompare } from "./icons";

type Route = "cauta" | "coordonatori";

export function TraseeApp({
  api,
  canCoordinate,
}: {
  api: Api;
  canCoordinate: boolean;
}) {
  const [route, setRoute] = useState<Route>("cauta");
  const [query, setQuery] = useState<Query>({
    text: "",
    stage: "",
    discipline: "",
  });
  const [filters, setFilters] = useState<Filters>({
    when: "oricand",
    format: "oricare",
    minCredits: 0,
  });
  const [done, setDone] = useState<{ id: string; title: string }[]>([]);
  const [competencies, setCompetencies] = useState<string[] | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [compare, setCompare] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [compareItems, setCompareItems] = useState<CourseDetail[] | null>(null);

  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [counts, setCounts] = useState({ courses: 0, providers: 0 });
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => {
    let live = true;
    api
      .state()
      .then((state) => {
        if (live) {
          setDone(state.done);
          setCounts(state);
          setReady(true);
          setError("");
        }
      })
      .catch(() => {
        if (live) setError("Datele Trasee nu s-au încărcat. Reîncearcă.");
      });
    return () => {
      live = false;
      requestRef.current?.abort();
    };
  }, [api, attempt]);

  const run = useCallback(
    async (
      q: Query,
      f: Filters,
      d: { id: string }[],
      comps: string[] | null,
    ) => {
      if (!ready) return;
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setBusy(true);
      setError("");
      try {
        const res = await api.search(
          {
            ...q,
            ...f,
            done: d.map((x) => x.id),
            competencies: comps ?? undefined,
          },
          controller.signal,
        );
        if (!controller.signal.aborted) setResult(res);
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          setBusy(false);
        }
      }
    },
    [api, ready],
  );

  const submit = (q: Query) => {
    setQuery(q);
    setCompetencies(null);
    setCompare([]);
    run(q, filters, done, null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeFilters = (f: Filters) => {
    setFilters(f);
    run(query, f, done, competencies);
  };
  const updateDone = async (id: string, title: string, completed: boolean) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await api.complete(id, completed);
      const d = completed
        ? [...done.filter((x) => x.id !== id), { id, title }]
        : done.filter((x) => x.id !== id);
      setDone(d);
      setCompare(compare.filter((x) => x !== id));
      if (result) void run(query, filters, d, competencies);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  const markDone = (c: RankedCourse) => {
    void updateDone(c.id, c.title, true);
  };
  const undo = (id: string) => {
    void updateDone(id, "", false);
  };
  const removeComp = (id: string) => {
    const c = (
      competencies ??
      result?.interpretation.competencies ??
      []
    ).filter((x) => x !== id);
    setCompetencies(c);
    run(query, filters, done, c);
  };
  const toggleCompare = (id: string) =>
    setCompare((c) =>
      c.includes(id)
        ? c.filter((x) => x !== id)
        : c.length >= 3
          ? c
          : [...c, id],
    );

  useEffect(() => {
    if (!openId) {
      setDetail(null);
      return;
    }
    let live = true;
    setDetail(null);
    api
      .course(openId)
      .then((d) => {
        if (live) setDetail(d);
      })
      .catch((e: Error) => {
        if (live) {
          setError(e.message);
          setOpenId(null);
        }
      });
    return () => {
      live = false;
    };
  }, [api, openId]);

  const closeDrawer = useCallback(() => setOpenId(null), []);
  const closeCompare = useCallback(() => setCompareItems(null), []);
  const openCompare = async () => {
    try {
      setCompareItems(await api.courses(compare));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="trasee-module" lang="ro">
      <header className="trasee-heading">
        <div>
          <p className="eyebrow">DEZVOLTARE PROFESIONALĂ</p>
          <h1 id="page-title" tabIndex={-1}>
            Trasee de formare
          </h1>
        </div>
        <nav className="module-tabs" aria-label="Secțiuni Trasee">
          <button
            type="button"
            aria-pressed={route === "cauta"}
            onClick={() => setRoute("cauta")}
          >
            Caută un curs
          </button>
          {canCoordinate && (
            <button
              type="button"
              aria-pressed={route === "coordonatori"}
              onClick={() => setRoute("coordonatori")}
            >
              Pentru coordonatori
            </button>
          )}
        </nav>
      </header>
      <div className="module-main">
        {route === "coordonatori" && canCoordinate ? (
          <Coordinators api={api} />
        ) : (
          <>
            {!result ? (
              <section className="hero">
                <div className="container container--narrow">
                  <p className="eyebrow">
                    Formare continuă pentru cadre didactice
                  </p>
                  <h2 className="hero-title">
                    Găsește cursul potrivit pentru clasa ta
                  </h2>
                  <p className="lead">
                    Scrie cu cuvintele tale ce vrei să schimbi sau să înveți.
                    Comparăm pentru tine ofertele centrelor de formare și îți
                    arătăm cele mai potrivite 3.
                  </p>
                  <SearchForm
                    value={query}
                    onChange={setQuery}
                    onSubmit={submit}
                    busy={busy || !ready || saving}
                  />
                  <p className="trust">
                    {ready
                      ? `${counts.courses} de oferte · ${counts.providers} furnizori · catalog importat, surse consultate la 7 noiembrie 2026`
                      : "Se încarcă catalogul din Supabase…"}
                  </p>
                </div>
              </section>
            ) : (
              <div className="container">
                <div className="searchbar">
                  <SearchForm
                    compact
                    value={query}
                    onChange={setQuery}
                    onSubmit={submit}
                    busy={busy || !ready || saving}
                  />
                </div>
                <fieldset disabled={saving} className="results-fieldset">
                  <legend className="sr-only">Rezultatele căutării</legend>
                  <Results
                    data={result}
                    filters={filters}
                    onFilters={changeFilters}
                    compare={compare}
                    onToggleCompare={toggleCompare}
                    onOpen={setOpenId}
                    done={done}
                    onDone={markDone}
                    onUndone={undo}
                    onRemoveCompetency={removeComp}
                  />
                </fieldset>
              </div>
            )}
            {!result && done.length > 0 && (
              <section className="container saved-courses">
                <h3>Cursurile marcate deja</h3>
                <p className="hint">
                  Salvate în contul tău Supabase. Folosim aceste cursuri pentru
                  a identifica teme noi.
                </p>
                <div className="tags">
                  {done.map((d) => (
                    <span key={d.id} className="tag">
                      {d.title}
                      <button
                        type="button"
                        className="tag__x"
                        aria-label={`Anulează marcajul pentru ${d.title}`}
                        disabled={saving}
                        onClick={() => undo(d.id)}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </span>
                  ))}
                </div>
              </section>
            )}
            {saving && (
              <p className="container" role="status">
                Se salvează marcajul în contul tău…
              </p>
            )}
            {error && (
              <div className="container">
                <div className="notice notice--error" role="alert">
                  <p>{error}</p>
                  {!ready && (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setAttempt((v) => v + 1)}
                    >
                      Reîncearcă încărcarea
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="footer">
        <div className="container footer__inner">
          <p>
            Prototip DigiEduHack Legacy Moldova 2026 · Modulul 4 „Coordonare și
            trasee”. Datele provin din planurile și paginile oficiale ale
            furnizorilor; fiecare curs are link la sursă.
          </p>
          <p className="muted">
            Textul este interpretat cu dicționarul comun și nu se păstrează.
            Marcajele cursurilor sunt private; temele căutărilor se agregă
            anonim.
          </p>
        </div>
      </footer>

      {compare.length > 0 &&
        route === "cauta" &&
        result &&
        !openId &&
        !compareItems && (
          <div className="comparebar" role="region" aria-label="Comparare">
            <span>
              <IconCompare /> {compare.length}{" "}
              {compare.length === 1 ? "curs selectat" : "cursuri selectate"}{" "}
              (maximum 3)
            </span>
            <div className="actions">
              <button
                type="button"
                className="btn btn--ghost-inverse"
                onClick={() => setCompare([])}
              >
                Golește
              </button>
              <button
                type="button"
                className="btn btn--inverse"
                disabled={compare.length < 2}
                onClick={openCompare}
              >
                Compară
              </button>
            </div>
          </div>
        )}
      {openId && (
        <CourseDrawer detail={detail} loading={!detail} onClose={closeDrawer} />
      )}
      {compareItems && (
        <CompareDialog items={compareItems} onClose={closeCompare} />
      )}
    </div>
  );
}
