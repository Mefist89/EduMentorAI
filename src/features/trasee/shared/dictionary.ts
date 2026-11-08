/**
 * Dicționarul comun al competențelor (Modulul 4).
 * Leagă formulările profesorilor și ale furnizorilor de aceleași competențe,
 * ca potrivirea să funcționeze peste toți furnizorii.
 * Sinonimele cu „=” în față se potrivesc doar ca cuvânt întreg.
 */
import type { Competency, Skill } from "./types";

export function normalize(text: string): string {
  return String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export const COMPETENCIES: Competency[] = [
  {
    id: "diferentiere",
    group: "Pedagogie",
    label: "Diferențierea instruirii",
    synonyms: [
      "diferentier",
      "diferentiat",
      "sarcini diferentiate",
      "grupuri eterogene",
      "eterogen",
      "niveluri diferite",
      "ritm diferit",
      "individualiz",
      "personaliz",
    ],
    near: ["proiectare", "gandire"],
  },
  {
    id: "colaborare",
    group: "Pedagogie",
    label: "Lucru în grup și colaborare",
    synonyms: [
      "lucru in grup",
      "lucrul pe grupe",
      "lucrul in grup",
      "activitati de grup",
      "pe grupe",
      "in grup",
      "=grupe",
      "cooper",
      "colabor",
      "interactiv",
      "in echipa",
    ],
    near: ["proiectare"],
  },
  {
    id: "incluziune",
    group: "Pedagogie",
    label: "Educație incluzivă (CES)",
    synonyms: [
      "=ces",
      "cerinte educationale speciale",
      "incluz",
      "psihopedagogie speciala",
      "logoped",
      "dizabilit",
      "deficient",
      "auz",
      "auditiv",
      "invatamant special",
      "cadru didactic de sprijin",
      "autis",
    ],
    near: [],
  },
  {
    id: "proiectare",
    group: "Pedagogie",
    label: "Proiectare și strategii didactice",
    synonyms: [
      "design instructional",
      "proiectar",
      "strategii de predare",
      "strategii didactice",
      "psihopedagog",
      "metode de predare",
    ],
    near: [],
  },
  {
    id: "evaluare",
    group: "Pedagogie",
    label: "Evaluarea învățării",
    synonyms: ["evaluar", "feedback", "notare"],
    near: [],
  },
  {
    id: "gandire",
    group: "Pedagogie",
    label: "Gândire critică și creativitate",
    synonyms: [
      "gandiri critice",
      "gandire critica",
      "creativ",
      "autonom",
      "independent",
    ],
    near: [],
  },
  {
    id: "digital",
    group: "Digital și STEAM",
    label: "Competențe digitale",
    synonyms: [
      "digital",
      "=tic",
      "chromebook",
      "=web",
      "resurse educationale",
      "platform",
      "calculator",
      "tableta",
    ],
    near: [],
  },
  {
    id: "ai",
    group: "Digital și STEAM",
    label: "Inteligență artificială",
    synonyms: [
      "inteligenta artificiala",
      "inteligentei artificiale",
      "=ai",
      "=ia",
      "chatgpt",
      "generativ",
    ],
    near: ["digital"],
  },
  {
    id: "programare",
    group: "Digital și STEAM",
    label: "Programare și informatică",
    synonyms: ["programar", "informatic", "=cod", "scratch", "python"],
    near: [],
  },
  {
    id: "steam",
    group: "Digital și STEAM",
    label: "Abordare STEAM",
    synonyms: [
      "=steam",
      "ste(a)m",
      "=stem",
      "robot",
      "=3d",
      "imprimar",
      "dron",
      "educatie tehnologica",
      "fablab",
      "=iot",
      "arduino",
    ],
    near: [],
  },
  {
    id: "cercetare",
    group: "Digital și STEAM",
    label: "Învățare prin investigație",
    synonyms: ["cercetar", "experiment", "laborator", "senzor"],
    near: [],
  },
  {
    id: "jocuri",
    group: "Digital și STEAM",
    label: "Învățare prin joc și imersiune",
    synonyms: [
      "=joc",
      "jocuri",
      "gamif",
      "imersiv",
      "realitate virtuala",
      "=vr",
      "=ar",
    ],
    near: [],
  },
  {
    id: "d_mate",
    group: "Didactica disciplinelor",
    label: "Didactica matematicii",
    synonyms: ["matematic"],
    near: [],
  },
  {
    id: "d_stiinte",
    group: "Didactica disciplinelor",
    label: "Didactica științelor",
    synonyms: ["fizic", "chimi", "biolog", "stiinte"],
    near: [],
  },
  {
    id: "d_limbi",
    group: "Didactica disciplinelor",
    label: "Limbi și comunicare",
    synonyms: [
      "limba ",
      "literatur",
      "englez",
      "francez",
      "comunicar",
      "lectur",
    ],
    near: [],
  },
  {
    id: "d_uman",
    group: "Didactica disciplinelor",
    label: "Istorie, geografie, societate",
    synonyms: ["istori", "geograf", "societate", "civic"],
    near: [],
  },
  {
    id: "d_arte",
    group: "Didactica disciplinelor",
    label: "Arte",
    synonyms: ["=arte", "plastic", "desen", "multimedia"],
    near: [],
  },
  {
    id: "d_jur",
    group: "Didactica disciplinelor",
    label: "Discipline juridice",
    synonyms: ["juridic", "=drept"],
    near: [],
  },
  {
    id: "timpurie",
    group: "Trepte",
    label: "Educație timpurie",
    synonyms: ["prescolar", "gradinit", "educatie timpurie"],
    near: [],
  },
  {
    id: "primar",
    group: "Trepte",
    label: "Învățământ primar",
    synonyms: ["invatamantul primar", "clasele primare", "=primar"],
    near: [],
  },
  {
    id: "ipt",
    group: "Trepte",
    label: "Învățământ profesional tehnic",
    synonyms: ["=ipt", "=vet", "profesional tehnic"],
    near: [],
  },
  {
    id: "management",
    group: "Conducere și carieră",
    label: "Management și leadership",
    synonyms: ["manag", "leadership", "conducere", "director", "lider"],
    near: [],
  },
  {
    id: "mentorat",
    group: "Conducere și carieră",
    label: "Mentorat și formarea formatorilor",
    synonyms: ["mentor", "coaching", "formarea formatorilor", "debutant"],
    near: [],
  },
  {
    id: "bunastare",
    group: "Conducere și carieră",
    label: "Bunăstare și dezvoltare personală",
    synonyms: [
      "stres",
      "emotional",
      "dezvoltare personala",
      "dezvoltarea personala",
      "rezilient",
      "motivat",
    ],
    near: [],
  },
  {
    id: "sustenabil",
    group: "Conducere și carieră",
    label: "Sustenabilitate",
    synonyms: ["sustenab", "durabil", "tranzitie verde", "circular"],
    near: [],
  },
];

export const COMPETENCY_BY_ID: Record<string, Competency> = Object.fromEntries(
  COMPETENCIES.map((c) => [c.id, c]),
);

function synonymRegex(syn: string): RegExp {
  const whole = syn.startsWith("=");
  const text = (whole ? syn.slice(1) : syn).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  return new RegExp(
    (whole ? "(^|[^a-z0-9])" : "") + text + (whole ? "($|[^a-z0-9])" : ""),
  );
}
const COMPETENCY_RX = COMPETENCIES.map((c) => ({
  id: c.id,
  rx: c.synonyms.map((s) => ({ s: s.replace(/^=/, ""), rx: synonymRegex(s) })),
}));

/** Competențele recunoscute într-un text, cu sinonimul care le-a declanșat. */
export function matchCompetencies(
  text: string,
): { id: string; matchedBy: string }[] {
  const t = " " + normalize(text) + " ";
  const out: { id: string; matchedBy: string }[] = [];
  for (const c of COMPETENCY_RX) {
    const hit = c.rx.find((r) => r.rx.test(t));
    if (hit) out.push({ id: c.id, matchedBy: hit.s });
  }
  return out;
}

/** Competențe fine (pentru „ce e nou pentru tine”) și domeniul lor TPACK. */
export const SKILLS: (Skill & { rx: RegExp })[] = [
  {
    id: "interdisc",
    label: "Corelarea interdisciplinară",
    tpack: ["pck"],
    rx: /interdisciplin|integrat|corelar/,
  },
  {
    id: "pbl",
    label: "Proiecte și probleme autentice",
    tpack: ["pk"],
    rx: /proiecte|bazate pe proiect|problem|\bpbl\b|misiuni/,
  },
  {
    id: "invest",
    label: "Investigație și experimente",
    tpack: ["pck"],
    rx: /investiga|experiment|cercetar|ipotez/,
  },
  {
    id: "senzori",
    label: "Senzori și analiza datelor",
    tpack: ["tck"],
    rx: /senzor|colectar|analiza datelor|interpretarea datelor|documentarea datelor|pocketlab|microscop/,
  },
  {
    id: "iot",
    label: "Microcontrolere și IoT",
    tpack: ["tk"],
    rx: /arduino|micro:?bit|\biot\b|conectate|microcontrol/,
  },
  {
    id: "robot",
    label: "Robotică educațională",
    tpack: ["tk"],
    rx: /robot|lego|spike|matatalab/,
  },
  {
    id: "prog",
    label: "Programare și algoritmi",
    tpack: ["tk"],
    rx: /program(are|area|elor|e de|ar)|algoritm|scratch|python|\bcod\b/,
  },
  { id: "drone", label: "Drone", tpack: ["tk"], rx: /dron/ },
  {
    id: "d3",
    label: "Modelare și imprimare 3D",
    tpack: ["tk"],
    rx: /\b3d\b|imprim|\bcura\b/,
  },
  {
    id: "fablab",
    label: "FabLab și prototipare",
    tpack: ["tk"],
    rx: /fablab|fabricat|prototip/,
  },
  {
    id: "design",
    label: "Design ingineresc",
    tpack: ["tck"],
    rx: /ingineres|inginer|produse(lor)? tehnologic|activitatilor practice|activitatilor aplicative|\bdesign\b(?! instruc)/,
  },
  {
    id: "digital",
    label: "Instrumente și resurse digitale",
    tpack: ["tk"],
    rx: /digital|resurse|instrumente|\btic\b|platform|chromebook|\bweb\b|software|panou|moodle/,
  },
  {
    id: "eval",
    label: "Evaluarea învățării",
    tpack: ["pk"],
    rx: /evaluar|portofol/,
  },
  {
    id: "curric",
    label: "Proiectare didactică",
    tpack: ["pk"],
    rx: /proiectar|curricul|design instruc|planific/,
  },
  {
    id: "activ",
    label: "Metode activ-participative",
    tpack: ["pk"],
    rx: /activ-particip|interactiv|metode active|metode moderne/,
  },
  {
    id: "sustain",
    label: "Sustenabilitate",
    tpack: ["ck"],
    rx: /sustenab|durabil|circular|verde/,
  },
  {
    id: "safety",
    label: "Siguranța echipamentelor",
    tpack: ["tk"],
    rx: /siguran|mentenan|responsabil|securitat/,
  },
  {
    id: "ai",
    label: "Inteligență artificială",
    tpack: ["tk"],
    rx: /inteligent[ae] artificial|\bia\b|\bai\b|generativ/,
  },
  {
    id: "arvr",
    label: "AR/VR și jocuri",
    tpack: ["tk"],
    rx: /\bar\b|\bvr\b|realitat|imersiv|\bjoc|gamif|storytelling/,
  },
  {
    id: "collab",
    label: "Colaborare",
    tpack: ["pk"],
    rx: /colabor|lucru in echipa|cooper|\bgrup/,
  },
  {
    id: "think",
    label: "Gândire critică și creativitate",
    tpack: ["pk"],
    rx: /gandir|creativ|analitic/,
  },
  {
    id: "mgmt",
    label: "Managementul proiectelor",
    tpack: ["pk"],
    rx: /managementul|gestion|coordon/,
  },
  {
    id: "differ",
    label: "Diferențiere și personalizare",
    tpack: ["pk"],
    rx: /diferent|personaliz|adaptiv|individualiz/,
  },
  {
    id: "incl",
    label: "Incluziune (CES)",
    tpack: ["pk"],
    rx: /\bces\b|incluz|dizabil|cerinte educationale speciale|psihopedagogie speciala|logoped|auditiv/,
  },
  {
    id: "disc",
    label: "Didactica disciplinei",
    tpack: ["ck", "pck"],
    rx: /specialitat|didactica (matematicii|chimiei|informaticii|disciplin)|matematic|fizic|chimi|biolog|geograf/,
  },
];

export function skillsOf(phrase: string): string[] {
  const t = normalize(phrase);
  return SKILLS.filter((s) => s.rx.test(t)).map((s) => s.id);
}

export const STAGE_LABELS: Record<string, string> = {
  prescolar: "Educație timpurie",
  primar: "Clase primare",
  gl: "Gimnaziu și liceu",
  ipt: "Învățământ profesional tehnic",
  management: "Management școlar",
  superior: "Învățământ superior",
};

/** Disciplinele din formular și competențele la care trimit. */
export const DISCIPLINES: Record<
  string,
  { label: string; competencies: string[]; busola: string | null }
> = {
  matematica: {
    label: "Matematică",
    competencies: ["d_mate"],
    busola: "Matematica",
  },
  stiinte: {
    label: "Fizică, chimie, biologie",
    competencies: ["d_stiinte"],
    busola: "Fizica, Biologia, Științe",
  },
  informatica: {
    label: "Informatică",
    competencies: ["programare", "digital"],
    busola: "Informatica",
  },
  tehnologie: {
    label: "Educație tehnologică",
    competencies: ["steam"],
    busola: null,
  },
  limbi: {
    label: "Limbi și literatură",
    competencies: ["d_limbi"],
    busola: "Limba și literatura română, Limba străină",
  },
  umaniste: {
    label: "Istorie, geografie, societate",
    competencies: ["d_uman"],
    busola: "Istoria, Geografia",
  },
  arte: { label: "Arte", competencies: ["d_arte"], busola: null },
  primar: {
    label: "Toate disciplinele (învățător)",
    competencies: ["primar"],
    busola: null,
  },
};
