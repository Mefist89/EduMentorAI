/** Tipuri comune pentru server, client și demo. */

export type Stage = 'prescolar' | 'primar' | 'gl' | 'ipt' | 'management' | 'superior';
export type SessionKind = 'run' | 'reg' | 'month' | 'approx' | 'start';
export type Evidence = 'oficial' | 'pagina' | 'general' | 'lista' | 'inrudit';
export type Accreditation = 'anacec' | 'declarat' | 'neconfirmat';
export type CourseType = 'perf' | 'micro' | 'recal' | 'modul' | 'anunt';
export type Format = 'online' | 'offline';

export interface Provider {
  id: string;
  name: string;
  fullName: string;
  city: string | null;
  url: string | null;
  dataNote: string;
  completeList: boolean;
}

export interface Competency {
  id: string;
  label: string;
  group: string;
  synonyms: string[];
  near: string[];
}

export interface Skill {
  id: string;
  label: string;
  tpack: string[];
}

export interface Variant {
  credits: number | null;
  hours: number | null;
  contactHours: number | null;
  priceMdl: number | null;
}

export interface Session {
  kind: SessionKind;
  start: string; // ISO yyyy-mm-dd
  end: string | null;
}

export interface Course {
  id: string;
  providerId: string;
  title: string;
  type: CourseType;
  audience: string | null;
  stages: Stage[];
  stagesInferred: Stage[];
  stageAll: boolean;
  level: string | null;
  format: Format[] | null;
  languages: string[] | null;
  description: string | null;
  competencyText: string[];
  competencyInferred: boolean;
  evidence: Evidence;
  evidenceNote: string | null;
  accreditation: Accreditation;
  accreditationNote: string | null;
  conditions: string | null;
  verify: string | null;
  links: { fisa: string | null; page: string | null; source: string | null; price: string | null };
  checkedOn: string;
  onDemand: boolean;
  ended: boolean;
  notes: string[];
  variants: Variant[];
  sessions: Session[];
  competencies: { id: string; matchedBy: string }[];
  skills: { id: string; phrase: string }[];
}

export interface Catalog {
  providers: Provider[];
  competencies: Competency[];
  skills: Skill[];
  courses: Course[];
}

export type When = 'oricand' | 'curand' | 'pana-in-iunie';
export type FormatFilter = 'oricare' | 'online' | 'fata-in-fata';

export interface SearchRequest {
  text: string;
  stage: Stage | '';
  discipline: string;
  when: When;
  format: FormatFilter;
  minCredits: number;
  done: string[];
  competencies?: string[]; // dacă profesorul a ajustat manual temele
}

export interface Interpretation {
  competencies: string[];
  summary: string;
  source: 'gemini' | 'dictionar';
}

export interface Availability {
  kind: 'curand' | 'mai-tarziu' | 'inscriere' | 'la-cerere' | 'in-desfasurare' | 'incheiat' | 'necunoscut';
  date: string | null;
  label: string;
}

export interface RankedCourse {
  id: string;
  title: string;
  providerId: string;
  providerName: string;
  typeLabel: string;
  credits: string | null;
  hours: string | null;
  price: string | null;
  format: string | null;
  availability: Availability;
  officialSheet: boolean;
  accredited: boolean;
  inferredCompetencies: boolean;
  matched: string[];
  nearOnly: boolean;
  novelty: { fresh: number; total: number } | null;
  why: string;
  missing: string[];
  score: number;
  /** grupurile de competențe atinse (liniile de pe hartă) */
  lines: string[];
  /** următoarea ediție cu date publicate (sau cea în desfășurare) */
  run: { start: string; end: string | null } | null;
}

export interface SearchResponse {
  journalSaved?: boolean;
  interpretation: Interpretation;
  results: RankedCourse[];
  total: number;
  gaps: string[];
  excludedEnded: number;
}

export type CellStatus = 'exista' | 'necunoscut' | 'inexistent';
export interface CoverageCell {
  status: CellStatus;
  active: number;
  note: string;
}
export interface CoverageResponse {
  stages: { id: Stage; label: string }[];
  rows: { id: string; label: string; group: string; cells: CoverageCell[] }[];
  providers: { id: string; name: string; courses: number; completeness: number; completeList: boolean; note: string }[];
  searches: { total: number; topCompetencies: { id: string; label: string; count: number }[]; withoutResults: number };
  /** aceeași disciplină, la centre diferite, în perioade care se suprapun */
  overlaps: OverlapGroup[];
  window: { from: string; to: string; today: string };
}

export interface OverlapItem { courseId: string; providerId: string; providerName: string; title: string; start: string; end: string; credits: string | null; price: string | null }
export interface OverlapGroup { key: string; label: string; providers: number; overlapDays: number; items: OverlapItem[] }

/** harta traseelor: liniile = grupuri de competențe, stațiile = centre */
export interface Network {
  stations: { id: string; name: string; courses: number }[];
  lines: { id: string; label: string; stops: string[]; courses: number }[];
}
