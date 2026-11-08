import { useState } from 'react';
import type { FormatFilter, RankedCourse, SearchResponse, When } from '../../shared/types';
import { COMPETENCY_BY_ID } from '../../shared/dictionary';
import { IconAlert, IconAward, IconCheck, IconMonitor, IconSparkle, IconWallet, IconX } from '../icons';
import { lineVar } from '../lines';
import { RunTrack } from './RunTrack';

export interface Filters { when: When; format: FormatFilter; minCredits: number }

function Segmented<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      <span className="seg__label">{label}</span>
      <div className="seg__track">
        {options.map(([v, l]) => (
          <button key={String(v)} type="button" className="seg__btn" aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function Fact({ icon, children, tone }: { icon: React.ReactNode; children: React.ReactNode; tone?: 'muted' | 'warn' | 'ok' }) {
  return <li className={`fact${tone ? ` fact--${tone}` : ''}`}><span className="fact__icon">{icon}</span><span>{children}</span></li>;
}

function Rail({ lines }: { lines: string[] }) {
  return <div className="rail" aria-hidden="true">{(lines.length ? lines : ['Pedagogie']).map((g) => <i key={g} style={{ background: lineVar(g) }} />)}</div>;
}

function CourseCard({ c, rank, compared, onOpen, onCompare, onDone }: {
  c: RankedCourse; rank: number; compared: boolean; onOpen: () => void; onCompare: () => void; onDone: () => void;
}) {
  return (
    <article className={`card${rank === 1 ? ' card--best' : ''}`}>
      <Rail lines={c.lines} />
      <div className="card__top">
        <span className="station-tag"><i aria-hidden="true" />{c.providerName}</span>
        {rank === 1 ? <span className="card__best">Cea mai potrivită</span> : <span className="card__type">{c.typeLabel}</span>}
      </div>
      <h3 className="card__title"><button type="button" className="linklike" onClick={onOpen}>{c.title}</button></h3>
      <p className="card__why">{c.why}</p>
      <RunTrack run={c.run} label={c.availability.label} />
      <ul className="facts">
        <Fact icon={<IconAward />} tone={c.credits ? undefined : 'warn'}>{c.credits ?? 'credite nepublicate'}{c.hours ? <small>{c.hours}</small> : null}</Fact>
        <Fact icon={<IconWallet />} tone={c.price ? undefined : 'warn'}>{c.price ?? 'preț nepublicat'}</Fact>
        <Fact icon={<IconMonitor />} tone={c.format ? undefined : 'warn'}>{c.format ?? 'format nepublicat'}</Fact>
      </ul>
      <div className="badges">
        {c.officialSheet && <span className="badge badge--ok"><IconCheck /> Fișă oficială</span>}
        {c.accredited && <span className="badge badge--ok"><IconCheck /> Acreditare ANACEC</span>}
        {c.inferredCompetencies && <span className="badge badge--warn">Conținut descris sumar</span>}
        {c.novelty && <span className="badge">{c.novelty.fresh} din {c.novelty.total} teme noi pentru tine</span>}
      </div>
      <div className="card__actions">
        <button type="button" className="btn btn--secondary" onClick={onOpen}>Vezi detalii</button>
        <label className="check">
          <input type="checkbox" checked={compared} onChange={onCompare} /> Compară
        </label>
      </div>
      <button type="button" className="card__done" onClick={onDone}>Am făcut deja un curs ca acesta</button>
    </article>
  );
}

export function Results({ data, filters, onFilters, compare, onToggleCompare, onOpen, done, onDone, onUndone, onRemoveCompetency }: {
  data: SearchResponse; filters: Filters; onFilters: (f: Filters) => void;
  compare: string[]; onToggleCompare: (id: string) => void; onOpen: (id: string) => void;
  done: { id: string; title: string }[]; onDone: (c: RankedCourse) => void; onUndone: (id: string) => void;
  onRemoveCompetency: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const top = data.results.slice(0, 3);
  const rest = data.results.slice(3);
  const comps = data.interpretation.competencies;

  return (
    <section className="results" aria-live="polite">
{data.journalSaved === false && <p className="journal-warning" role="status">Rezultatele sunt disponibile, dar statistica anonimă nu s-a salvat.</p>}
      <div className="understood">
        <span className="understood__icon"><IconSparkle /></span>
        <div className="understood__body">
          <p className="understood__text">
            <strong>Am înțeles:</strong> {data.interpretation.summary || 'cauți formare pentru temele de mai jos.'}
            <span className={`pill${data.interpretation.source === 'gemini' ? ' pill--ai' : ''}`}>{data.interpretation.source === 'gemini' ? 'interpretat cu Gemini' : 'interpretat cu dicționarul'}</span>
          </p>
          <div className="tags">
            {comps.map((id) => (
              <span key={id} className="tag">
                <i className="tag__dot" style={{ background: lineVar(COMPETENCY_BY_ID[id]?.group ?? '') }} aria-hidden="true" />
                {COMPETENCY_BY_ID[id]?.label ?? id}
                {comps.length > 1 && <button type="button" className="tag__x" aria-label={`Scoate ${COMPETENCY_BY_ID[id]?.label}`} onClick={() => onRemoveCompetency(id)}><IconX size={14} /></button>}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="refine">
        <Segmented label="Când" value={filters.when} onChange={(when) => onFilters({ ...filters, when })}
          options={[['oricand', 'Oricând'], ['curand', 'În curând'], ['pana-in-iunie', 'Până în iunie']]} />
        <Segmented label="Format" value={filters.format} onChange={(format) => onFilters({ ...filters, format })}
          options={[['oricare', 'Oricare'], ['online', 'Online'], ['fata-in-fata', 'Față în față']]} />
        <Segmented label="Credite" value={filters.minCredits} onChange={(minCredits) => onFilters({ ...filters, minCredits })}
          options={[[0, 'Oricâte'], [5, '5+'], [10, '10+']]} />
      </div>

      {done.length > 0 && (
        <div className="done">
          <span>Ai făcut deja:</span>
          {done.map((d) => <span key={d.id} className="tag tag--muted">{d.title}<button type="button" className="tag__x" aria-label="Anulează" onClick={() => onUndone(d.id)}><IconX size={14} /></button></span>)}
        </div>
      )}

      {data.gaps.length > 0 && (
        <div className="notice"><IconAlert />
          <p>Pentru <strong>{data.gaps.join(', ')}</strong> nu am găsit un curs dedicat la furnizorii analizați. {data.results.length ? 'Îți arătăm cele mai apropiate.' : ''}</p>
        </div>
      )}

      {data.results.length === 0 ? (
        <div className="empty">
          <h2>Nu am găsit cursuri cu filtrele alese</h2>
          <p>Încearcă „Oricând” și „Oricare” la format, sau descrie altfel ce cauți.{data.excludedEnded ? ` ${data.excludedEnded} ediții potrivite s-au încheiat deja.` : ''}</p>
        </div>
      ) : (
        <>
          <div className="results__head">
            <h2>Recomandate pentru tine</h2>
            <span className="muted">{data.total} {data.total === 1 ? 'ofertă potrivită' : 'oferte potrivite'}{data.excludedEnded ? `, ${data.excludedEnded} ediții încheiate ascunse` : ''}</span>
          </div>
          <div className="grid3">
            {top.map((c, i) => (
              <CourseCard key={c.id} c={c} rank={i + 1} compared={compare.includes(c.id)}
                onOpen={() => onOpen(c.id)} onCompare={() => onToggleCompare(c.id)} onDone={() => onDone(c)} />
            ))}
          </div>
          {rest.length > 0 && (
            <div className="more">
              <h3 className="more__title">Alte opțiuni</h3>
              <ul className="rows">
                {(showAll ? rest : rest.slice(0, 5)).map((c) => (
                  <li key={c.id} className="row">
                    <Rail lines={c.lines} />
                    <div className="row__main">
                      <button type="button" className="linklike row__title" onClick={() => onOpen(c.id)}>{c.title}</button>
                      <span className="muted">{c.providerName}, {c.availability.label.toLowerCase()}</span>
                    </div>
                    <span className="row__fact">{c.credits ?? '—'}</span>
                    <span className="row__fact">{c.price ?? 'preț nepublicat'}</span>
                    <label className="check"><input type="checkbox" checked={compare.includes(c.id)} onChange={() => onToggleCompare(c.id)} /> Compară</label>
                  </li>
                ))}
              </ul>
              {rest.length > 5 && <button type="button" className="btn btn--ghost" onClick={() => setShowAll(!showAll)}>{showAll ? 'Arată mai puține' : `Arată toate cele ${rest.length}`}</button>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
