import { useEffect, useState } from 'react';
import type { CoverageResponse, OverlapItem } from '../../shared/types';
import type { Api } from '../api';
import { lineKey, lineVar } from '../lines';
import { rangeLabel } from './RunTrack';

const MONTHS = ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sep.', 'oct.', 'nov.', 'dec.'];
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

/** Intensitatea culorii după numărul de oferte active (scară pe trepte, ca să se citească dintr-o privire). */
const level = (n: number) => (n >= 10 ? 4 : n >= 5 ? 3 : n >= 2 ? 2 : 1);

function Heatmap({ data }: { data: CoverageResponse }) {
  const groups = [...new Set(data.rows.map((r) => r.group))];
  return (
    <div className="table-wrap">
      <table className="heat">
        <thead><tr><th scope="col"><span className="sr-only">Competență</span></th>{data.stages.map((s) => <th key={s.id} scope="col">{s.label}</th>)}</tr></thead>
        <tbody>
          {groups.map((g) => [
            <tr key={g} className="heat__group"><th colSpan={data.stages.length + 1}><i style={{ background: lineVar(g) }} aria-hidden="true" />{g}</th></tr>,
            ...data.rows.filter((r) => r.group === g).map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.label}</th>
                {r.cells.map((c, i) => (
                  <td key={i}>
                    {c.status === 'exista' ? (
                      <span className={`hcell hcell--l${level(c.active)} hcell--k-${lineKey(g)}`} style={{ ['--c' as string]: lineVar(g) }} title={c.note}>
                        <b>{c.active}</b><small>{c.active === 1 ? 'ofertă' : 'oferte'}</small>
                      </span>
                    ) : c.status === 'necunoscut' ? (
                      <span className="hcell hcell--unknown" title={c.note}><b>?</b><small>nu știm</small></span>
                    ) : (
                      <span className="hcell hcell--none" title={c.note}><b>0</b><small>nu există</small></span>
                    )}
                  </td>
                ))}
              </tr>
            )),
          ])}
        </tbody>
      </table>
    </div>
  );
}

function Overlaps({ data }: { data: CoverageResponse }) {
  const from = parse(data.window.from), to = new Date(parse(data.window.to).getTime() + 864e5);
  const span = to.getTime() - from.getTime();
  const pos = (d: Date) => ((d.getTime() - from.getTime()) / span) * 100;
  const months: Date[] = [];
  for (let d = new Date(from); d < to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d);
  const today = parse(data.window.today);
  const clash = (it: OverlapItem, all: OverlapItem[]) => all
    .filter((o) => o.providerId !== it.providerId)
    .map((o) => ({ s: o.start > it.start ? o.start : it.start, e: o.end < it.end ? o.end : it.end }))
    .filter((x) => x.s <= x.e);

  if (!data.overlaps.length) return <p className="muted">În fereastra aceasta nu am găsit aceeași disciplină la două centre în aceleași săptămâni.</p>;
  return (
    <div className="gantt">
      <div className="gantt__axis" aria-hidden="true">
        <span />
        <div className="gantt__months">
          {months.map((m) => <span key={m.toISOString()} style={{ left: `${pos(m)}%` }}>{MONTHS[m.getMonth()]} {m.getMonth() === 0 || m === months[0] ? m.getFullYear() : ''}</span>)}
          <b className="gantt__today" style={{ left: `${pos(today)}%` }}>azi</b>
        </div>
      </div>
      {data.overlaps.map((g) => (
        <section key={g.key} className="gantt__group" aria-label={`${g.label}: ${g.providers} centre, până la ${g.overlapDays} zile în paralel`}>
          <h3 className="gantt__title">{g.label}<span>{g.providers} centre, până la {g.overlapDays} zile în paralel</span></h3>
          {[...new Set(g.items.map((it) => it.providerId))].map((pid) => {
            const mine = g.items.filter((it) => it.providerId === pid);
            return (
              <div key={pid} className="gantt__row">
                <span className="gantt__who">{mine[0].providerName}</span>
                <div className="gantt__track">
                  {months.map((m) => <i key={m.toISOString()} className="gantt__grid" style={{ left: `${pos(m)}%` }} />)}
                  {mine.map((it, i) => {
                    const left = Math.max(0, pos(parse(it.start))), right = Math.min(100, pos(new Date(parse(it.end).getTime() + 864e5)));
                    return (
                      <span key={i} className="gantt__bar" style={{ left: `${left}%`, width: `${right - left}%` }}
                        title={`${it.title}, ${it.providerName}: ${rangeLabel(it.start, it.end)}${it.credits ? `, ${it.credits}` : ''}${it.price ? `, ${it.price}` : ''}`}>
                        {clash(it, g.items).map((x, j) => {
                          const a = pos(parse(x.s)), b = pos(new Date(parse(x.e).getTime() + 864e5));
                          return <i key={j} className="gantt__clash" style={{ left: `${((a - left) / (right - left)) * 100}%`, width: `${((b - a) / (right - left)) * 100}%` }} />;
                        })}
                      </span>
                    );
                  })}
                  <b className="gantt__todayline" style={{ left: `${pos(today)}%` }} />
                </div>
                <span className="gantt__meta">{mine.map((it) => rangeLabel(it.start, it.end)).join('; ')}</span>
              </div>
            );
          })}
        </section>
      ))}
      <p className="gantt__legend"><i className="gantt__key" /> ediție publicată <i className="gantt__key gantt__key--clash" /> în aceleași zile cu ediția altui centru</p>
    </div>
  );
}

export function Coordinators({ api }: { api: Api }) {
  const [simulate, setSimulate] = useState(false);
  const [data, setData] = useState<CoverageResponse | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setData(null); setError('');
    api.coverage(simulate).then(value => { if (live) setData(value); }).catch((e: Error) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [api, simulate]);

  if (error) return <div className="container"><div className="notice notice--error"><p>{error}</p></div></div>;
  if (!data) return <div className="container coord-loading"><span className="spinner" /></div>;
  const courses = data.providers.reduce((s, p) => s + p.courses, 0);
  const complete = data.providers.filter((p) => p.completeList).length;
  const unknown = data.rows.reduce((s, r) => s + r.cells.filter((c) => c.status !== 'exista').length, 0);

  return (
    <>
      <section className="band band--head">
        <div className="container">
          <h2 className="display display--md">Unde se suprapune oferta și unde lipsește</h2>
          <p className="lead">Aceleași date ca în căutarea profesorilor, privite de sus: pe competențe și trepte, pe calendar și pe centre.</p>
          <dl className="kpis">
            <div><dt>oferte în bază</dt><dd>{courses}</dd></div>
            <div><dt>centre de formare</dt><dd>{data.providers.length}</dd></div>
            <div><dt>centre cu lista completă</dt><dd>{complete}<small> din {data.providers.length}</small></dd></div>
            <div><dt>discipline cu ediții în paralel</dt><dd>{data.overlaps.length}</dd></div>
          </dl>
        </div>
      </section>

      <div className="container coord">
        <section className="panel panel--wide">
          <div className="panel__head">
            <div>
              <h2>Aceeași disciplină, în aceleași săptămâni</h2>
              <p className="hint">Ediții cu date publicate în perioada {rangeLabel(data.window.from, data.window.to)}. Roșul arată zilele în care două centre predau același curs în paralel.</p>
            </div>
          </div>
          <Overlaps data={data} />
        </section>

        <section className="panel panel--wide">
          <div className="panel__head">
            <div>
              <h2>Harta tematică</h2>
              <p className="hint">Oferte active pe competență și treaptă. {unknown ? `${unknown} celule nu se pot evalua, pentru că ${data.providers.length - complete} centre nu și-au publicat lista completă.` : 'Toate celulele au ofertă.'}</p>
            </div>
            <label className="switch"><input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} /> Simulează: toate centrele au trimis lista completă</label>
          </div>
          <div className="heat-legend" aria-hidden="true">
            <span><i className="hcell hcell--l1 hcell--key" />1</span><span><i className="hcell hcell--l2 hcell--key" />2–4</span>
            <span><i className="hcell hcell--l3 hcell--key" />5–9</span><span><i className="hcell hcell--l4 hcell--key" />10+ oferte</span>
            <span><i className="hcell hcell--unknown hcell--key" />nu știm</span><span><i className="hcell hcell--none hcell--key" />nu există</span>
          </div>
          <Heatmap data={data} />
        </section>

        <div className="two">
          <section className="panel">
            <h2>Cât de complete sunt fișele</h2>
            <ul className="prov">
              {data.providers.slice().sort((a, b) => b.completeness - a.completeness).map((p) => (
                <li key={p.id}>
                  <div className="prov__top"><strong>{p.name}</strong><span>{p.completeness}%</span></div>
                  <div className="meter" role="img" aria-label={`Fișe completate în medie ${p.completeness}%`}><i style={{ width: `${p.completeness}%` }} /></div>
                  <span className="hint">{p.courses} oferte. {p.completeList ? 'Lista publicată e completă.' : p.note}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <h2>Ce caută profesorii</h2>
            {data.searches.topCompetencies.length === 0 ? <p className="muted">Încă nu există căutări. Temele apar aici pe măsură ce profesorii folosesc aplicația, fără textul scris de ei.</p> : (
              <>
                <p className="hint">{data.searches.total} căutări în ultimele 90 de zile, dintre care {data.searches.withoutResults} fără niciun rezultat.</p>
                <ul className="bars">
                  {data.searches.topCompetencies.map((t) => (
                    <li key={t.id}><span>{t.label}</span><div className="meter"><i style={{ width: `${Math.round((t.count / data.searches.topCompetencies[0].count) * 100)}%` }} /></div><b>{t.count}</b></li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
