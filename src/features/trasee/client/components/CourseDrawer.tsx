import { useEffect, useRef, useState } from "react";
import type { CourseDetail } from "../../shared/rank";
import {
  IconAward,
  IconCalendar,
  IconCheck,
  IconCopy,
  IconExternal,
  IconMonitor,
  IconUsers,
  IconWallet,
  IconX,
} from "../icons";

const TPACK: Record<string, string> = {
  ck: "materia",
  pk: "pedagogia",
  tk: "tehnologia",
  pck: "cum predai materia",
  tck: "tehnologia în materie",
  tpk: "tehnologia în metodă",
  tpack: "integrarea celor trei",
};
const ACCR: Record<string, string> = {
  anacec: "Acreditare ANACEC declarată",
  declarat: "Declarată de furnizor sau aprobare internă",
  neconfirmat: "Acreditare neconfirmată",
};
const EVID: Record<string, string> = {
  oficial: "Fișă oficială a programului",
  pagina: "Pagină sau anunț al furnizorului",
  general: "Ofertă generală, fără rezultatele învățării",
  lista: "Doar o listă de module",
  inrudit: "Descrierea unui program înrudit",
};

export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key !== "Tab" || !ref.current) return;
      const nodes = [
        ...ref.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,summary,[tabindex="0"]',
        ),
      ].filter((node) => node.getClientRects().length);
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (!first) {
        e.preventDefault();
        ref.current.focus();
        return;
      }
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === ref.current)
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);
  return ref;
}

export function CourseDrawer({
  detail,
  loading,
  onClose,
}: {
  detail: CourseDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const ref = useDialog(true, onClose);
  const [copied, setCopied] = useState("");
  const c = detail?.course;

  async function copy() {
    if (!detail) return;
    const text =
      `Întrebări despre „${detail.course.title}” (${detail.providerName}):\n` +
      detail.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Copiat.");
    } catch {
      setCopied("Copierea nu e permisă aici. Selectează textul.");
    }
  }

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        ref={ref}
      >
        <header className="drawer__head">
          <div>
            <div className="card__meta">
              {detail ? `${detail.providerName} · ${detail.typeLabel}` : " "}
            </div>
            <h2 id="drawer-title" className="drawer__title">
              {c?.title ?? "Se încarcă…"}
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Închide"
          >
            <IconX />
          </button>
        </header>
        {loading || !detail || !c ? (
          <div className="drawer__body">
            <span className="spinner" />
          </div>
        ) : (
          <div className="drawer__body">
            <section className="sec">
              <h3 className="sec__title">Pe scurt</h3>
              <dl className="kv">
                <div>
                  <dt>
                    <IconCalendar /> Când
                  </dt>
                  <dd>{detail.availability.label}</dd>
                </div>
                <div>
                  <dt>
                    <IconAward /> Credite și durată
                  </dt>
                  <dd>
                    {[detail.credits, detail.hours]
                      .filter(Boolean)
                      .join(" · ") || <span className="na">nepublicat</span>}
                  </dd>
                </div>
                <div>
                  <dt>
                    <IconWallet /> Cost
                  </dt>
                  <dd>
                    {detail.price ?? <span className="na">nepublicat</span>}
                  </dd>
                </div>
                <div>
                  <dt>
                    <IconMonitor /> Format
                  </dt>
                  <dd>
                    {detail.format ?? <span className="na">nepublicat</span>}
                  </dd>
                </div>
                <div className="kv__wide">
                  <dt>
                    <IconUsers /> Pentru cine
                  </dt>
                  <dd>
                    {c.audience ?? <span className="na">nepublicat</span>}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="sec">
              <h3 className="sec__title">Ce vei învăța</h3>
              {c.description && <p>{c.description}</p>}
              {c.competencyText.length ? (
                <ul className="ticks">
                  {c.competencyText.map((t) => (
                    <li key={t}>
                      <IconCheck /> {t}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="na">Furnizorul nu publică temele cursului.</p>
              )}
              {c.competencyInferred && c.competencyText.length > 0 && (
                <p className="hint">
                  Temele sunt orientative: deduse din denumire, nu dintr-o fișă
                  oficială.
                </p>
              )}
            </section>

            {detail.missing.length > 0 && (
              <section className="sec">
                <h3 className="sec__title">Ce nu e publicat</h3>
                <div className="tags">
                  {detail.missing.map((m) => (
                    <span key={m} className="tag tag--warn">
                      {m}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="sec sec--accent">
              <h3 className="sec__title">Înainte să te înscrii, întreabă</h3>
              <ol className="qs">
                {detail.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={copy}
                >
                  <IconCopy /> Copiază întrebările
                </button>
                <span className="hint" role="status">
                  {copied}
                </span>
              </div>
            </section>

            <section className="sec">
              <h3 className="sec__title">Pași recomandați după curs</h3>
              <ol className="steps">
                <li>
                  <strong>La final:</strong> proiectezi o activitate pentru
                  clasa ta și o prezinți formatorului.
                </li>
                <li>
                  <strong>În primele 6 săptămâni:</strong> o aplici la clasă. Un
                  mentor te observă și îți dă feedback.
                </li>
                <li>
                  <strong>După circa 3 luni:</strong> verifici câți elevi ating
                  criteriul, față de situația de dinainte.
                </li>
              </ol>
              <p className="hint">
                Aceștia sunt pași recomandați de aplicare și evaluare, nu
                servicii garantate de fiecare furnizor.
              </p>
            </section>

            <details className="sec more-info">
              <summary>Mai multe detalii</summary>
              <dl className="kv kv--plain">
                <div className="kv__wide">
                  <dt>Acreditare</dt>
                  <dd>
                    {ACCR[c.accreditation]}
                    {c.accreditationNote ? ` · ${c.accreditationNote}` : ""}
                  </dd>
                </div>
                <div className="kv__wide">
                  <dt>Cât de bine e descris</dt>
                  <dd>{EVID[c.evidence]}</dd>
                </div>
                {detail.tpack.length > 0 && (
                  <div className="kv__wide">
                    <dt>Accent (TPACK, dedus)</dt>
                    <dd>{detail.tpack.map((k) => TPACK[k]).join(", ")}</dd>
                  </div>
                )}
                {c.conditions && (
                  <div className="kv__wide">
                    <dt>Observații</dt>
                    <dd>{c.conditions}</dd>
                  </div>
                )}
                {c.notes.length > 0 && (
                  <div className="kv__wide">
                    <dt>Note</dt>
                    <dd>{c.notes.join(" ")}</dd>
                  </div>
                )}
                {c.verify && (
                  <div className="kv__wide">
                    <dt>De verificat</dt>
                    <dd>{c.verify}</dd>
                  </div>
                )}
                <div className="kv__wide">
                  <dt>Verificat la</dt>
                  <dd>{c.checkedOn.split("-").reverse().join(".")}</dd>
                </div>
              </dl>
            </details>
          </div>
        )}
        {c && (
          <footer className="drawer__foot">
            {c.links.fisa && (
              <a
                className="btn btn--secondary"
                href={c.links.fisa}
                target="_blank"
                rel="noopener noreferrer"
              >
                Fișa programului <IconExternal />
              </a>
            )}
            {(c.links.page || c.links.source) && (
              <a
                className="btn btn--primary"
                href={(c.links.page || c.links.source)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pagina furnizorului <IconExternal />
              </a>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
