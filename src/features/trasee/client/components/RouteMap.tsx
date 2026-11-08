import { useEffect, useMemo, useState } from 'react';
import type { Network } from '../../shared/types';
import type { Api } from '../api';
import { lineKey } from '../lines';

type Pt = [number, number];

/** Decalează o linie frântă cu `d` pixeli pe normală, păstrând distanța și în curbe (îmbinare în colț). */
function offset(points: Pt[], d: number): Pt[] {
  const dir = (a: Pt, b: Pt): Pt => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const nrm = (u: Pt): Pt => [-u[1], u[0]];
  return points.map((p, i) => {
    const n1 = i > 0 ? nrm(dir(points[i - 1], p)) : null;
    const n2 = i < points.length - 1 ? nrm(dir(p, points[i + 1])) : null;
    if (!n1 || !n2) { const n = (n1 ?? n2)!; return [p[0] + n[0] * d, p[1] + n[1] * d]; }
    const m: Pt = [n1[0] + n2[0], n1[1] + n2[1]];
    const ml = Math.hypot(m[0], m[1]) || 1;
    const mu: Pt = [m[0] / ml, m[1] / ml];
    const k = d / (mu[0] * n1[0] + mu[1] * n1[1]);
    return [p[0] + mu[0] * k, p[1] + mu[1] * k];
  });
}

const W = 640, H = 330, STEP = 46, STUB = 16, GAP = 14;
const SHAPE = [0, 0, 1, 1, 2, 3, 3, 2, 2, 1];

export function RouteMap({ api }: { api: Api }) {
  const [net, setNet] = useState<Network | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    let live = true; setFailed(false);
    api.network().then(value => { if (live) setNet(value); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [api, attempt]);

  const geo = useMemo(() => {
    if (!net) return null;
    const n = net.stations.length;
    const x0 = 46, dx = (W - 2 * x0) / Math.max(1, n - 1);
    const st = net.stations.map((s, i) => ({ ...s, x: x0 + i * dx, y: 118 + SHAPE[i % SHAPE.length] * STEP }));
    const center: Pt[] = [];
    st.forEach((s, i) => {
      center.push([i === 0 ? s.x - 34 : s.x - STUB, s.y]);
      center.push([i === n - 1 ? s.x + 34 : s.x + STUB, s.y]);
    });
    // liniile cu cele mai multe stații stau la mijloc, ca stațiile să le cuprindă pe toate fără goluri
    const byStops = [...net.lines].sort((a, b) => b.stops.length - a.stops.length);
    const slots: number[] = [];
    byStops.forEach((_, i) => { const mid = (byStops.length - 1) / 2; slots.push(i % 2 === 0 ? Math.floor(mid) - i / 2 : Math.ceil(mid) + (i - 1) / 2); });
    const lines = byStops.map((l, i) => {
      const d = (slots[i] - (byStops.length - 1) / 2) * GAP;
      const pts = offset(center, d);
      return { ...l, d, path: 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L') };
    }).sort((a, b) => a.d - b.d);
    const caps = st.map((s, i) => {
      const ds = lines.filter((l) => l.stops.includes(s.id)).map((l) => l.d);
      return ds.length ? { ...s, i, top: s.y + Math.min(...ds) - 9, bottom: s.y + Math.max(...ds) + 9 } : null;
    }).filter((c): c is NonNullable<typeof c> => !!c);
    return { lines, caps };
  }, [net]);

  if (failed) return <div className="routemap routemap--empty" role="status"><p>Harta centrelor nu s-a încărcat.</p><button type="button" className="btn btn--inverse" onClick={() => setAttempt(x => x + 1)}>Reîncearcă harta</button></div>;
  if (!net || !geo) return <div className="routemap routemap--empty" aria-hidden="true" />;
  const total = net.stations.reduce((s, x) => s + x.courses, 0);

  return (
    <figure className="routemap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Harta traseelor: ${net.lines.length} grupuri de competențe trec prin ${net.stations.length} centre de formare, ${total} de cursuri`}>
        <g className="routemap__lines">
          {geo.lines.map((l, i) => (
            <path key={l.id} d={l.path} pathLength={1} className={`rline rline--${lineKey(l.id)}${active && active !== l.id ? ' is-dim' : ''}`}
              style={{ animationDelay: `${i * 0.12}s` }} onMouseEnter={() => setActive(l.id)} onMouseLeave={() => setActive(null)} />
          ))}
        </g>
        <g className="routemap__stations">
          {geo.caps.map((c) => (
            <g key={c.id} className="station" style={{ animationDelay: `${0.35 + c.i * 0.13}s` }}>
              <rect x={c.x - 11} y={c.top} width={22} height={c.bottom - c.top} rx={11} />
              <text className="station__name" transform={`translate(${c.x - 2} ${c.top - 10}) rotate(-38)`}>{c.name}</text>
              <text className="station__count" x={c.x} y={c.bottom + 22} textAnchor="middle">{c.courses}</text>
            </g>
          ))}
        </g>
      </svg>
      <figcaption>
        <ul className="routemap__legend" aria-label="Liniile de pe hartă">
          {geo.lines.map((l) => (
            <li key={l.id}>
              <button type="button" className={`legend-line legend-line--${lineKey(l.id)}`} aria-pressed={active === l.id}
                onMouseEnter={() => setActive(l.id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(l.id)} onBlur={() => setActive(null)}
                onClick={() => setActive(active === l.id ? null : l.id)}>
                <i aria-hidden="true" />{l.label}<span>{l.courses} cursuri, {l.stops.length} centre</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="routemap__note">Fiecare linie e un grup de competențe, fiecare stație un centru de formare. Cifra de sub stație arată câte cursuri are centrul în baza noastră.</p>
      </figcaption>
    </figure>
  );
}
