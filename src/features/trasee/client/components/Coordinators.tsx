import { useEffect, useState } from "react";
import type { CoverageResponse } from "../../shared/types";
import type { Api } from "../api";

const STATUS: Record<string, string> = {
  exista: "Ofertă există",
  necunoscut: "Date necunoscute",
  inexistent: "Ofertă inexistentă",
};

export function Coordinators({ api }: { api: Api }) {
  const [simulate, setSimulate] = useState(false);
  const [data, setData] = useState<CoverageResponse | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setError("");
    setData(null);
    api
      .coverage(simulate)
      .then((value) => {
        if (live) setData(value);
      })
      .catch((e: Error) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [api, simulate]);

  if (error)
    return (
      <div className="container">
        <div className="notice">
          <p>{error}</p>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="container">
        <span className="spinner" />
      </div>
    );
  const groups = [...new Set(data.rows.map((r) => r.group))];
  const courses = data.providers.reduce((s, p) => s + p.courses, 0);

  return (
    <div className="container coord">
      <div className="coord__head">
        <p className="eyebrow">Pentru coordonatori · Modulul 4</p>
        <h2 className="hero-title">
          Unde există ofertă și unde lipsesc datele
        </h2>
        <p className="lead">
          Harta tematică arată, pentru fiecare competență și treaptă, dacă
          oferta există, lipsește sau nu se poate ști din datele primite.
        </p>
      </div>
      <p className="hint">
        Statistici ale prototipului, inclusiv căutări de test. Sunt analizate
        cel mult ultimele 1.000 de căutări din 90 de zile.
      </p>
      <div className="kpis">
        <div className="kpi">
          <b>{courses}</b>
          <span>oferte în catalog</span>
        </div>
        <div className="kpi">
          <b>{data.providers.length}</b>
          <span>furnizori</span>
        </div>
        <div className="kpi">
          <b>{data.searches.total}</b>
          <span>căutări recente (maximum 1.000, în 90 de zile)</span>
        </div>
        <div className="kpi">
          <b>{data.searches.withoutResults}</b>
          <span>căutări fără rezultat</span>
        </div>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2>Harta tematică</h2>
          <label className="switch">
            <input
              type="checkbox"
              checked={simulate}
              onChange={(e) => setSimulate(e.target.checked)}
            />{" "}
            Simulează: toți furnizorii au trimis lista completă
          </label>
        </div>
        <div className="legend">
          {Object.entries(STATUS).map(([k, l]) => (
            <span key={k} className={`status status--${k}`}>
              {l}
            </span>
          ))}
        </div>
        <div className="table-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th scope="col">Competență</th>
                {data.stages.map((s) => (
                  <th key={s.id} scope="col">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => [
                <tr key={g} className="matrix__group">
                  <th colSpan={data.stages.length + 1}>{g}</th>
                </tr>,
                ...data.rows
                  .filter((r) => r.group === g)
                  .map((r) => (
                    <tr key={r.id}>
                      <th scope="row">{r.label}</th>
                      {r.cells.map((c, i) => (
                        <td key={i}>
                          <span
                            className={`cell status--${c.status}`}
                            title={c.note}
                          >
                            <b>{STATUS[c.status]}</b>
                            <small>{c.note}</small>
                          </span>
                        </td>
                      ))}
                    </tr>
                  )),
              ])}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two">
        <section className="panel">
          <h2>Ce date au trimis furnizorii</h2>
          <ul className="prov">
            {data.providers.map((p) => (
              <li key={p.id}>
                <div className="prov__top">
                  <strong>{p.name}</strong>
                  <span className="muted">{p.courses} oferte</span>
                </div>
                <div
                  className="meter"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={p.completeness}
                  aria-label={`Fișe completate: ${p.name}`}
                >
                  <i style={{ width: `${p.completeness}%` }} />
                </div>
                <span className="hint">
                  Fișe completate în medie: {p.completeness}% ·{" "}
                  {p.completeList ? "listă completă" : p.note}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Ce caută profesorii</h2>
          {data.searches.topCompetencies.length === 0 ? (
            <p className="muted">
              Încă nu există căutări. Datele apar aici pe măsură ce profesorii
              folosesc aplicația (fără textul scris de ei).
            </p>
          ) : (
            <ul className="bars">
              {data.searches.topCompetencies.map((t) => (
                <li key={t.id}>
                  <span>{t.label}</span>
                  <div className="meter">
                    <i
                      style={{
                        width: `${Math.round((t.count / data.searches.topCompetencies[0].count) * 100)}%`,
                      }}
                    />
                  </div>
                  <b>{t.count}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
