import { useId } from 'react';
import { DISCIPLINES, STAGE_LABELS } from '../../shared/dictionary';
import type { Stage } from '../../shared/types';
import { IconSearch } from '../icons';

export interface Query { text: string; stage: Stage | ''; discipline: string }

const EXAMPLES = [
  'Vreau lecții STEAM cu proiecte practice',
  'Am elevi cu CES și nu știu cum să-i implic în grup',
  'Vreau să folosesc inteligența artificială la lecții',
  'Robotică pentru elevii de gimnaziu',
  'Evaluare și feedback mai eficient',
];
const STAGE_OPTIONS: (Stage | '')[] = ['', 'prescolar', 'primar', 'gl', 'ipt', 'management'];

export function SearchForm({ value, onChange, onSubmit, compact, busy }: {
  value: Query; onChange: (q: Query) => void; onSubmit: (q: Query) => void; compact?: boolean; busy?: boolean;
}) {
  const id = useId();
  const canSubmit = value.text.trim().length >= 3 || !!value.discipline;
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (canSubmit) onSubmit(value); };

  return (
    <form className={compact ? 'search search--compact' : 'search'} onSubmit={submit} role="search">
      <label htmlFor={`${id}-q`} className={compact ? 'sr-only' : 'search__label'}>Ce vrei să înveți sau să schimbi la clasă?</label>
      <div className="search__field">
        {compact && <span className="search__icon"><IconSearch /></span>}
        {compact ? (
          <input id={`${id}-q`} className="input input--bare" value={value.text} maxLength={800}
            onChange={(e) => onChange({ ...value, text: e.target.value })} placeholder="Ce vrei să înveți?" />
        ) : (
          <textarea id={`${id}-q`} className="input textarea" rows={3} value={value.text} maxLength={800}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canSubmit) onSubmit(value); } }}
            placeholder="De exemplu: vreau să fac lecțiile de fizică mai practice, cu experimente și senzori" />
        )}
      </div>
      <div className="search__row">
        <label className="select-wrap">
          <span className="select-wrap__label">Predau la</span>
          <select className="select" value={value.stage} onChange={(e) => onChange({ ...value, stage: e.target.value as Stage | '' })}>
            {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s ? STAGE_LABELS[s] : 'Orice treaptă'}</option>)}
          </select>
        </label>
        <label className="select-wrap">
          <span className="select-wrap__label">Disciplina</span>
          <select className="select" value={value.discipline} onChange={(e) => onChange({ ...value, discipline: e.target.value })}>
            <option value="">Oricare</option>
            {Object.entries(DISCIPLINES).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}
          </select>
        </label>
        <button className="btn btn--primary btn--lg" type="submit" disabled={!canSubmit || busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : null}
          {compact ? 'Caută' : 'Găsește cursuri'}
        </button>
      </div>
      {!compact && (
        <div className="examples" aria-label="Exemple">
          <span className="examples__label">Sau pornește de la un exemplu:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip" onClick={() => { const q = { ...value, text: ex }; onChange(q); onSubmit(q); }}>{ex}</button>
          ))}
        </div>
      )}
    </form>
  );
}
