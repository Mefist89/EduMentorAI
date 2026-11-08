/**
 * Logica de potrivire și clasare. Funcții pure, folosite de server și de demo.
 * Nicio informație lipsă nu e ghicită: ce nu e publicat apare în `missing`.
 */
import { COMPETENCY_BY_ID, COMPETENCIES, DISCIPLINES, matchCompetencies, normalize, SKILLS, skillsOf, STAGE_LABELS } from './dictionary';

const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
import type {
  Availability, Catalog, Course, CoverageCell, CoverageResponse, Interpretation, Network, OverlapGroup,
  RankedCourse, SearchRequest, SearchResponse, Stage,
} from './types';

const DAY = 86_400_000;
const MONTHS = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
export const TYPE_LABELS: Record<string, string> = { perf: 'Perfecționare', micro: 'Microcalificare', recal: 'Recalificare', modul: 'Modul scurt', anunt: 'Anunț' };

function parseDate(iso: string): Date { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
export function fmtDate(d: Date): string { return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; }
function startOfDay(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

/* ---------------- etichete ---------------- */
export function creditsLabel(c: Course): string | null {
  const v = c.variants.map((x) => x.credits).filter((x): x is number => x != null);
  if (!v.length) return null;
  return v.join(' sau ') + (v.length === 1 && v[0] === 1 ? ' credit' : ' credite');
}
export function hoursLabel(c: Course): string | null {
  const v = c.variants.filter((x) => x.hours != null);
  if (!v.length) return c.variants[0]?.contactHours ? `${c.variants[0].contactHours} ore de contact` : null;
  return v.map((x) => `${x.hours} ore`).join(' / ');
}
export function priceLabel(c: Course): string | null {
  const v = c.variants.filter((x) => x.priceMdl != null);
  if (!v.length) return null;
  return v.map((x) => `${x.priceMdl!.toLocaleString('ro-MD')} MDL${c.variants.length > 1 && x.credits ? ` (${x.credits} cr.)` : ''}`).join(' · ');
}
export function formatLabel(c: Course): string | null {
  if (!c.format) return c.onDemand ? 'la cerere' : null;
  if (c.format.length === 2) return 'online sau față în față';
  return c.format[0] === 'online' ? 'online' : 'față în față';
}
export function maxCredits(c: Course): number | null {
  const v = c.variants.map((x) => x.credits).filter((x): x is number => x != null);
  return v.length ? Math.max(...v) : null;
}

/* ---------------- disponibilitate ---------------- */
export function availability(c: Course, today: Date): Availability {
  const t = startOfDay(today);
  const sess = c.sessions.map((s) => ({ s, start: parseDate(s.start), end: s.end ? parseDate(s.end) : parseDate(s.start) }));
  const future = sess.filter((x) => x.s.kind !== 'reg' && x.start > t).sort((a, b) => +a.start - +b.start)[0];
  if (future) {
    const days = (+future.start - +t) / DAY;
    const label = future.s.kind === 'month' ? `în ${MONTHS[future.start.getMonth()]} ${future.start.getFullYear()}`
      : future.s.kind === 'approx' ? `aprox. din ${MONTHS[future.start.getMonth()]} ${future.start.getFullYear()}`
      : `începe pe ${fmtDate(future.start)}`;
    return { kind: days <= 60 ? 'curand' : 'mai-tarziu', date: future.s.start, label };
  }
  const reg = sess.filter((x) => x.s.kind === 'reg' && x.end >= t).sort((a, b) => +a.start - +b.start)[0];
  if (reg) {
    const open = reg.start <= t;
    return { kind: 'inscriere', date: reg.s.start, label: open ? `înscriere deschisă până pe ${fmtDate(reg.end)}` : `înscriere din ${fmtDate(reg.start)}` };
  }
  const running = sess.filter((x) => x.s.kind !== 'reg' && x.start <= t && x.end >= t)[0];
  if (running) {
    if (running.s.kind === 'approx') return { kind: 'la-cerere', date: null, label: 'pe parcursul anului, la formarea grupei' };
    return { kind: 'in-desfasurare', date: running.s.start, label: `a început pe ${fmtDate(running.start)}` };
  }
  if (c.onDemand) return { kind: 'la-cerere', date: null, label: 'la cererea unui grup' };
  if (sess.length || c.ended) return { kind: 'incheiat', date: null, label: 'ediția publicată s-a încheiat' };
  return { kind: 'necunoscut', date: null, label: 'calendar nepublicat' };
}

/* ---------------- treaptă ---------------- */
export type StageFit = 'explicit' | 'dedus' | 'general' | 'necunoscut' | 'nepotrivit';
export function stageFit(c: Course, stage: Stage | ''): StageFit {
  if (!stage) return 'necunoscut';
  if (c.stageAll) return 'general';
  if (c.stages.length) return c.stages.includes(stage) ? 'explicit' : 'nepotrivit';
  if (c.stagesInferred.length) return c.stagesInferred.includes(stage) ? 'dedus' : 'nepotrivit';
  return 'necunoscut';
}

/* ---------------- interpretare fără AI ---------------- */
export function interpretByDictionary(text: string, discipline: string): Interpretation {
  const ids = new Set(matchCompetencies(text).map((m) => m.id));
  if (ids.size === 0 && discipline && DISCIPLINES[discipline]) DISCIPLINES[discipline].competencies.forEach((c) => ids.add(c));
  const list = [...ids].filter((id) => COMPETENCY_BY_ID[id]).slice(0, 4);
  const summary = list.length ? `Cauți formare pentru: ${list.map((id) => lcFirst(COMPETENCY_BY_ID[id].label)).join(', ')}.` : '';
  return { competencies: list, summary, source: 'dictionar' };
}

/* ---------------- fișa ---------------- */
export function missingFields(c: Course): string[] {
  const m: string[] = [];
  if (!priceLabel(c)) m.push('preț');
  if (!c.format) m.push('format');
  if (!c.sessions.some((s) => s.kind !== 'reg')) m.push('data de start');
  if (!c.sessions.some((s) => s.kind === 'reg')) m.push('termen de înscriere');
  if (!creditsLabel(c)) m.push('credite');
  if (!c.audience) m.push('public țintă');
  if (c.competencyInferred) m.push('competențe exacte');
  if (c.accreditation !== 'anacec') m.push('acreditare confirmată');
  return m;
}

const EVIDENCE_PTS: Record<string, number> = { oficial: 10, pagina: 7, general: 4, lista: 3, inrudit: 2 };
const ACCR_PTS: Record<string, number> = { anacec: 5, declarat: 3, neconfirmat: 1 };
const AVAIL_PTS: Record<string, number> = { curand: 20, inscriere: 17, 'mai-tarziu': 14, 'la-cerere': 12, 'in-desfasurare': 8, necunoscut: 6, incheiat: 0 };
const FIT_PTS: Record<StageFit, number> = { explicit: 10, dedus: 8, general: 7, necunoscut: 5, nepotrivit: 0 };

function whenOk(a: Availability, when: SearchRequest['when'], today: Date): boolean {
  if (when === 'oricand') return true;
  if (a.kind === 'la-cerere') return true;
  if (!a.date) return false;
  const d = parseDate(a.date);
  if (when === 'curand') return a.kind === 'inscriere' || (+d - +startOfDay(today)) / DAY <= 45;
  return d <= new Date(today.getFullYear() + (today.getMonth() >= 6 ? 1 : 0), 5, 30);
}

/* ---------------- căutarea ---------------- */
export function search(catalog: Catalog, req: SearchRequest, interp: Interpretation, today: Date): SearchResponse {
  const comps = (req.competencies && req.competencies.length ? req.competencies : interp.competencies).filter((id) => COMPETENCY_BY_ID[id]);
  const providers = Object.fromEntries(catalog.providers.map((p) => [p.id, p]));
  const doneSkills = new Set(catalog.courses.filter((c) => req.done.includes(c.id)).flatMap((c) => c.skills.map((s) => s.id)));
  const has = (c: Course, id: string) => c.competencies.some((k) => k.id === id);
  const eligible = (c: Course) => stageFit(c, req.stage) !== 'nepotrivit';
  // teme specifice din textul profesorului (de ex. „robotică”), pentru a ordona mai fin în aceeași competență
  const wanted = new Set(skillsOf(req.text).filter((s) => !['digital', 'curric', 'pbl'].includes(s)));
  const skillLabel = Object.fromEntries(SKILLS.map((s) => [s.id, s.label]));

  const gaps: string[] = [];
  const near = new Set<string>();
  for (const id of comps) {
    if (!catalog.courses.some((c) => has(c, id) && eligible(c))) {
      gaps.push(COMPETENCY_BY_ID[id].label);
      COMPETENCY_BY_ID[id].near.forEach((n) => { if (!comps.includes(n)) near.add(n); });
    }
  }

  let excludedEnded = 0;
  const ranked: RankedCourse[] = [];
  for (const c of catalog.courses) {
    if (req.done.includes(c.id) || !eligible(c)) continue;
    const primary = comps.filter((id) => has(c, id));
    const nearHits = [...near].filter((id) => has(c, id));
    if (!primary.length && !nearHits.length) continue;
    if (req.format === 'online' && c.format && !c.format.includes('online')) continue;
    if (req.format === 'fata-in-fata' && c.format && !c.format.includes('offline')) continue;
    const mc = maxCredits(c);
    if (req.minCredits > 0 && (mc == null || mc < req.minCredits)) continue;
    const a = availability(c, today);
    if (a.kind === 'incheiat') { excludedEnded++; continue; }
    if (!whenOk(a, req.when, today)) continue;

    const skills = c.skills.map((s) => s.id);
    const fresh = skills.filter((s) => !doneSkills.has(s)).length;
    const novelty = doneSkills.size && skills.length ? { fresh, total: skills.length } : null;
    const relevance = primary.length ? 40 * (primary.length / comps.length) : 15;
    const noveltyPts = novelty ? 15 * (fresh / novelty.total) : 10;
    const fit = stageFit(c, req.stage);
    const specific = skills.filter((s) => wanted.has(s));
    const score = Math.round(relevance + noveltyPts + AVAIL_PTS[a.kind] + (EVIDENCE_PTS[c.evidence] ?? 2) + (ACCR_PTS[c.accreditation] ?? 1) + FIT_PTS[fit] + Math.min(12, specific.length * 6));

    const matched = (primary.length ? primary : nearHits).map((id) => COMPETENCY_BY_ID[id].label);
    const parts = [`${primary.length ? 'Lucrează pe' : 'Cel mai apropiat de ce cauți'}: ${matched.map(lcFirst).join(', ')}`];
    if (specific.length) parts.push(`include ${specific.map((s) => lcFirst(skillLabel[s])).join(', ')}`);
    if (novelty) parts.push(`${fresh} din ${novelty.total} teme sunt noi pentru tine`);
    if (fit === 'explicit') parts.push(`scris pentru ${STAGE_LABELS[req.stage].toLowerCase()}`);
    if (c.evidence === 'oficial') parts.push('are fișă oficială');

    ranked.push({
      id: c.id,
      title: c.title,
      providerId: c.providerId,
      providerName: providers[c.providerId]?.name ?? c.providerId,
      typeLabel: TYPE_LABELS[c.type] ?? c.type,
      credits: creditsLabel(c),
      hours: hoursLabel(c),
      price: priceLabel(c),
      format: formatLabel(c),
      availability: a,
      officialSheet: c.evidence === 'oficial',
      accredited: c.accreditation === 'anacec',
      inferredCompetencies: c.competencyInferred,
      matched,
      nearOnly: !primary.length,
      novelty,
      why: parts.join('; ') + '.',
      missing: missingFields(c),
      score,
      lines: [...new Set((primary.length ? primary : nearHits).map((id) => COMPETENCY_BY_ID[id].group).filter((g) => g !== 'Trepte'))],
      run: nextRun(c, today),
    });
  }
  ranked.sort((x, y) => Number(x.nearOnly) - Number(y.nearOnly) || y.score - x.score || (x.availability.date ?? '9').localeCompare(y.availability.date ?? '9'));
  // diversitate: în primele 3, cel mult 2 oferte de la același furnizor, dacă există o alternativă apropiată ca scor
  if (ranked.length > 3) {
    const top = ranked.slice(0, 3);
    const counts = new Map<string, number>();
    top.forEach((r) => counts.set(r.providerId, (counts.get(r.providerId) ?? 0) + 1));
    const [dominant, n] = [...counts].sort((a, b) => b[1] - a[1])[0];
    if (n === 3) {
      const alt = ranked.findIndex((r, i) => i >= 3 && r.providerId !== dominant && !r.nearOnly && r.score >= ranked[0].score - 20);
      if (alt > 0) { const [r] = ranked.splice(alt, 1); ranked.splice(2, 0, r); }
    }
  }
  return { interpretation: { ...interp, competencies: comps }, results: ranked, total: ranked.length, gaps, excludedEnded };
}

/* ---------------- înainte de înscriere ---------------- */
export function questionsFor(c: Course, today: Date): string[] {
  const a = availability(c, today);
  const q: string[] = [];
  if (c.accreditation !== 'anacec') q.push('Care este numărul deciziei de acreditare ANACEC (sau al ordinului MEC) pentru acest program?');
  if (!priceLabel(c)) q.push('Cât costă programul și ce include taxa?');
  q.push(a.kind === 'curand' || a.kind === 'mai-tarziu' ? `Care este orarul exact (zile și ore) pentru sesiunea care ${a.label}?` : 'Când începe următoarea grupă și care este orarul (zile și ore)?');
  if (!c.format) q.push('Se poate urma online sau doar față în față?');
  if (c.competencyInferred || c.evidence !== 'oficial') q.push('Puteți trimite fișa programului, cu temele și rezultatele învățării?');
  q.push('Ce certificat primesc la final și câte credite îmi sunt recunoscute?');
  return q;
}

/** Profil TPACK dedus din competențele fine ale cursului. */
export function tpackOf(c: Course, catalog: Catalog): string[] {
  const map = Object.fromEntries(catalog.skills.map((s) => [s.id, s.tpack]));
  const d = new Set<string>();
  c.skills.forEach((s) => (map[s.id] ?? []).forEach((k) => d.add(k)));
  if (d.has('tk') && (d.has('pk') || d.has('pck'))) d.add('tpk');
  if (d.has('tk') && (d.has('ck') || d.has('pck'))) d.add('tck');
  if (d.has('tk') && (d.has('pk') || d.has('pck')) && (d.has('ck') || d.has('pck') || d.has('tck'))) d.add('tpack');
  return ['ck', 'pk', 'tk', 'pck', 'tck', 'tpk', 'tpack'].filter((k) => d.has(k));
}

/* ---------------- harta acoperirii (pentru coordonatori) ---------------- */
const COVERAGE_STAGES: Stage[] = ['prescolar', 'primar', 'gl', 'ipt', 'management'];

export function completeness(c: Course): number {
  const known = [
    !!c.description, !c.competencyInferred && c.competencyText.length > 0, !!c.audience, c.stages.length > 0 || c.stageAll,
    !!c.level, !!hoursLabel(c), !!creditsLabel(c), !!c.format, !!c.languages,
    c.sessions.some((s) => s.kind === 'reg'), c.sessions.some((s) => s.kind !== 'reg'), !!priceLabel(c),
    c.accreditation === 'anacec', c.evidence === 'oficial', !!c.conditions,
  ];
  return known.filter(Boolean).length / known.length;
}

/* ---------------- ediții, suprapuneri, harta traseelor ---------------- */
const RUN_KINDS = new Set(['run', 'month', 'start']);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Următoarea ediție cu date (sau cea în desfășurare); fără perioade aproximative sau ferestre de înscriere. */
export function nextRun(c: Course, today: Date): { start: string; end: string | null } | null {
  const t = iso(today);
  const runs = c.sessions.filter((s) => RUN_KINDS.has(s.kind) && s.start).sort((a, b) => a.start!.localeCompare(b.start!));
  const r = runs.find((s) => (s.end ?? s.start!) >= t);
  return r ? { start: r.start!, end: r.end ?? null } : null;
}

const titleKey = (t: string) => normalize(t).replace(/\(.*?\)/g, '').replace(/\s*[–-]\s*perfectionare.*$/, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Aceeași disciplină (după titlu), la cel puțin două centre, cu ediții care se suprapun în fereastra
 * de 2 luni în urmă – 4 luni înainte. Doar ediții cu început și sfârșit publicate.
 */
export function overlaps(catalog: Catalog, today: Date): { groups: OverlapGroup[]; window: CoverageResponse['window'] } {
  const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 4, 0);
  const [f, t] = [iso(from), iso(to)];
  const providers = Object.fromEntries(catalog.providers.map((p) => [p.id, p.name]));
  const byKey = new Map<string, OverlapGroup['items']>();
  for (const c of catalog.courses) {
    for (const s of c.sessions) {
      if (!RUN_KINDS.has(s.kind) || !s.start || !s.end || s.end < f || s.start > t) continue;
      const k = titleKey(c.title);
      if (!k) continue;
      const list = byKey.get(k) ?? [];
      list.push({ courseId: c.id, providerId: c.providerId, providerName: providers[c.providerId] ?? c.providerId, title: c.title, start: s.start, end: s.end, credits: creditsLabel(c), price: priceLabel(c) });
      byKey.set(k, list);
    }
  }
  const days = (a: string, b: string) => Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / DAY) + 1;
  const groups: OverlapGroup[] = [];
  for (const [key, items] of byKey) {
    const provs = new Set(items.map((i) => i.providerId));
    if (provs.size < 2) continue;
    let best = 0;
    for (const a of items) for (const b of items) {
      if (a.providerId >= b.providerId) continue;
      const s = a.start > b.start ? a.start : b.start;
      const e = a.end < b.end ? a.end : b.end;
      if (s <= e) best = Math.max(best, days(s, e));
    }
    if (!best) continue;
    const label = items.map((i) => i.title.replace(/\s*[–-]\s*perfecționare.*$/i, '')).sort((a, b) => a.length - b.length)[0];
    items.sort((a, b) => a.providerName.localeCompare(b.providerName, 'ro') || a.start.localeCompare(b.start));
    groups.push({ key, label, providers: provs.size, overlapDays: best, items });
  }
  groups.sort((a, b) => b.providers - a.providers || b.overlapDays - a.overlapDays || a.label.localeCompare(b.label, 'ro'));
  return { groups: groups.slice(0, 8), window: { from: f, to: t, today: iso(today) } };
}

/** Liniile (grupuri de competențe) și stațiile (centre) pentru harta de pe prima pagină. */
export function network(catalog: Catalog): Network {
  const groups = [...new Set(COMPETENCIES.map((k) => k.group))].filter((g) => g !== 'Trepte');
  const groupOf = Object.fromEntries(COMPETENCIES.map((k) => [k.id, k.group]));
  const stations = catalog.providers.map((p) => ({ id: p.id, name: p.name, courses: catalog.courses.filter((c) => c.providerId === p.id).length }))
    .sort((a, b) => b.courses - a.courses);
  const lines = groups.map((g) => {
    const cs = catalog.courses.filter((c) => c.competencies.some((k) => k.matchedBy !== 'near' && groupOf[k.id] === g));
    const stops = stations.filter((st) => cs.some((c) => c.providerId === st.id)).map((st) => st.id);
    return { id: g, label: g, stops, courses: cs.length };
  });
  return { stations, lines };
}

export function coverage(catalog: Catalog, today: Date, assumeComplete: boolean, searches: CoverageResponse['searches']): CoverageResponse {
  const allComplete = assumeComplete || catalog.providers.every((p) => p.completeList);
  const missing = catalog.providers.filter((p) => !p.completeList).length;
  const rows = COMPETENCIES.filter((k) => k.group !== 'Trepte').map((k) => {
    const withComp = catalog.courses.filter((c) => c.competencies.some((x) => x.id === k.id));
    const cells: CoverageCell[] = COVERAGE_STAGES.map((st) => {
      const fit = withComp.filter((c) => { const f = stageFit(c, st); return f === 'explicit' || f === 'dedus' || f === 'general'; });
      const unknown = withComp.filter((c) => stageFit(c, st) === 'necunoscut');
      const active = fit.filter((c) => availability(c, today).kind !== 'incheiat');
      if (active.length) return { status: 'exista', active: active.length, note: `${active.length} ${active.length === 1 ? 'ofertă activă' : 'oferte active'}` };
      if (fit.length || unknown.length) return { status: 'necunoscut', active: 0, note: fit.length ? 'doar ediții încheiate' : 'public țintă nepublicat' };
      if (allComplete) return { status: 'inexistent', active: 0, note: 'zero cursuri la toți furnizorii' };
      return { status: 'necunoscut', active: 0, note: `zero în datele primite; ${missing} furnizori fără listă completă` };
    });
    return { id: k.id, label: k.label, group: k.group, cells };
  });
  const providers = catalog.providers.map((p) => {
    const cs = catalog.courses.filter((c) => c.providerId === p.id);
    const avg = cs.length ? cs.reduce((s, c) => s + completeness(c), 0) / cs.length : 0;
    return { id: p.id, name: p.name, courses: cs.length, completeness: Math.round(avg * 100), completeList: p.completeList, note: p.dataNote };
  });
  const ov = overlaps(catalog, today);
  return { stages: COVERAGE_STAGES.map((id) => ({ id, label: STAGE_LABELS[id] })), rows, providers, searches, overlaps: ov.groups, window: ov.window };
}

/* ---------------- detaliile unui curs ---------------- */
export interface CourseDetail {
  course: Course;
  providerName: string;
  providerFullName: string;
  providerCity: string | null;
  typeLabel: string;
  credits: string | null;
  hours: string | null;
  price: string | null;
  format: string | null;
  availability: Availability;
  competencyLabels: string[];
  tpack: string[];
  questions: string[];
  missing: string[];
}

export function courseDetail(catalog: Catalog, id: string, today: Date): CourseDetail | null {
  const c = catalog.courses.find((x) => x.id === id);
  if (!c) return null;
  const p = catalog.providers.find((x) => x.id === c.providerId);
  return {
    course: c,
    providerName: p?.name ?? c.providerId,
    providerFullName: p?.fullName ?? c.providerId,
    providerCity: p?.city ?? null,
    typeLabel: TYPE_LABELS[c.type] ?? c.type,
    credits: creditsLabel(c),
    hours: hoursLabel(c),
    price: priceLabel(c),
    format: formatLabel(c),
    availability: availability(c, today),
    competencyLabels: c.competencies.map((k) => COMPETENCY_BY_ID[k.id]?.label).filter(Boolean) as string[],
    tpack: tpackOf(c, catalog),
    questions: questionsFor(c, today),
    missing: missingFields(c),
  };
}
