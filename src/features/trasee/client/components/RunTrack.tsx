const MONTHS = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTHS_LONG = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

export function rangeLabel(start: string, end: string | null): string {
  const a = parse(start), b = end ? parse(end) : null;
  if (!b) return `din ${a.getDate()} ${MONTHS_LONG[a.getMonth()]}`;
  if (a.getFullYear() !== b.getFullYear()) return `${a.getDate()} ${MONTHS_LONG[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTHS_LONG[b.getMonth()]} ${b.getFullYear()}`;
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS_LONG[a.getMonth()]}`;
  return `${a.getDate()} ${MONTHS_LONG[a.getMonth()]} – ${b.getDate()} ${MONTHS_LONG[b.getMonth()]}`;
}

/** Bandă de 4 luni (luna curentă + 3): unde cade ediția față de azi. */
export function RunTrack({ run, label }: { run: { start: string; end: string | null } | null; label: string }) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 4, 1);
  const span = to.getTime() - from.getTime();
  const pos = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - from.getTime()) / span) * 100));
  const months = [0, 1, 2, 3].map((i) => new Date(now.getFullYear(), now.getMonth() + i, 1));
  let bar: { left: number; width: number; open: boolean } | null = null;
  let status = label;
  if (run) {
    const s = parse(run.start), e = run.end ? parse(run.end) : null;
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((s.getTime() - today0.getTime()) / 864e5);
    if (days > 1) status = `peste ${days} zile`;
    else if (days === 1) status = 'de mâine';
    else if (days === 0) status = 'de azi';
    else if (!e || e >= today0) status = 'în desfășurare';
  }
  if (run) {
    const s = parse(run.start), e = run.end ? parse(run.end) : new Date(s.getTime() + 14 * 864e5);
    if (e >= from && s < to) bar = { left: pos(s), width: Math.max(1.6, pos(e) - pos(s)), open: !run.end };
  }
  return (
    <div className="runtrack">
      <div className="runtrack__head">
        <span className="runtrack__when">{run ? rangeLabel(run.start, run.end) : 'Fără dată publicată'}</span>
        <span className="runtrack__status">{status}</span>
      </div>
      <div className={`runtrack__track${run ? '' : ' runtrack__track--none'}`} aria-hidden="true">
        {months.map((m, i) => <span key={i} className="runtrack__month" style={{ left: `${pos(m)}%` }}>{MONTHS[m.getMonth()]}</span>)}
        {bar && <i className={`runtrack__bar${bar.open ? ' runtrack__bar--open' : ''}`} style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />}
        <b className="runtrack__today" style={{ left: `${pos(now)}%` }} />
      </div>
    </div>
  );
}
