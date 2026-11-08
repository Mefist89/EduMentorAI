export type Locale = "ro" | "ru";
export type View =
  | "continuitate"
  | "investigatie"
  | "cohorts"
  | "practices"
  | "puntea"
  | "dashboard"
  | "course"
  | "mentor"
  | "activities"
  | "experience"
  | "trasee"
  | "expertiza";
export type PromptKey = "start" | "differentiate" | "verify" | "reflect";
export type Difficulty = "basic" | "medium" | "advanced";
export type Bilingual = { ro: string; ru: string };
export const text = (ro: string, ru: string): Bilingual => ({ ro, ru });

export const navigation = [
  { id: "puntea", label: text("Puntea Edu", "ЭдуМост") },
  { id: "expertiza", label: text("Expertiză", "Экспертиза") },
  { id: "continuitate", label: text("Continuitate", "Продолжение") },
  { id: "trasee", label: text("Trasee", "Маршруты") },
  { id: "investigatie", label: text("Investigație", "Исследование") },
  { id: "dashboard", label: text("Prezentare", "Обзор") },
  { id: "practices", label: text("Practici pedagogice", "Практики") },
  { id: "course", label: text("Cursul meu", "Мой курс") },
  { id: "activities", label: text("Activități", "Задания") },
  { id: "cohorts", label: text("Cohorte", "Когорты") },
  { id: "mentor", label: text("AI Mentor", "AI Mentor") },
  { id: "experience", label: text("Experiența mea", "Мой опыт") },
] as const;

export const primaryViews = ["puntea", "expertiza", "continuitate", "trasee", "investigatie"] as const;
export const investigationViews = ["dashboard", "practices", "course", "activities", "cohorts", "mentor", "experience"] as const;

export const steps = [
  {
    title: text("Clarifică obiectivul", "Уточните цель"),
    description: text(
      "Explorează materialul și nevoile clasei tale.",
      "Изучите материал и потребности класса.",
    ),
    view: "course",
    time: "5 min",
  },
  {
    title: text("Adaptează activitatea", "Адаптируйте задание"),
    description: text(
      "Alege o variantă cu AI sau fără AI.",
      "Выберите вариант с AI или без AI.",
    ),
    view: "activities",
    time: "10 min",
  },
  {
    title: text("Aplică și reflectează", "Примените и осмыслите"),
    description: text(
      "Documentează observațiile într-o fișă privată.",
      "Запишите наблюдения в личной карточке.",
    ),
    view: "experience",
    time: "5 min",
  },
] as const;

export const diagnostic = [
  {
    question: text("Ce îți dorești să dezvolți?", "Что вы хотите улучшить?"),
    answer: text(
      "Să adaptez exercițiile de ecuații la niveluri diferite de pregătire.",
      "Адаптировать задания по уравнениям к разным уровням подготовки.",
    ),
  },
  {
    question: text(
      "Ce dificultate întâlnești?",
      "С какой трудностью вы сталкиваетесь?",
    ),
    answer: text(
      "Unii elevi aplică mecanic regulile și nu verifică soluțiile.",
      "Некоторые ученики применяют правила механически и не проверяют решения.",
    ),
  },
  {
    question: text("Ce resurse ai la dispoziție?", "Какие ресурсы у вас есть?"),
    answer: text(
      "Tablă, fișe tipărite și un laptop pentru profesor.",
      "Доска, печатные карточки и ноутбук учителя.",
    ),
  },
];

export const courseSections = [
  {
    title: text(
      "1. Ce înseamnă să rezolvi o ecuație",
      "1. Что значит решить уравнение",
    ),
    body: text(
      "O soluție este o valoare a necunoscutei pentru care egalitatea este adevărată. În ecuația 2x + 3 = 11, valoarea x = 4 este soluție deoarece 2 × 4 + 3 = 11.",
      "Решение — значение неизвестной, при котором равенство верно. В уравнении 2x + 3 = 11 число x = 4 является решением, потому что 2 × 4 + 3 = 11.",
    ),
  },
  {
    title: text("2. Păstrăm echilibrul egalității", "2. Сохраняем равенство"),
    body: text(
      "Adunăm sau scădem aceeași expresie în ambii membri. Putem înmulți sau împărți ambii membri cu același număr nenul. Pentru 2x + 3 = 11, scădem 3, apoi împărțim la 2: 2x = 8, deci x = 4.",
      "Прибавляем или вычитаем одно и то же выражение из обеих частей. Обе части можно умножить или разделить на одно и то же ненулевое число. Для 2x + 3 = 11 вычитаем 3, затем делим на 2: 2x = 8, значит x = 4.",
    ),
  },
  {
    title: text("3. Verificăm și explicăm", "3. Проверяем и объясняем"),
    body: text(
      "Înlocuim x cu valoarea obținută în ecuația inițială. Elevul explică fiecare transformare. Un răspuns corect fără argumentare nu arată singur cum a înțeles metoda. Profesorul poate folosi lucrul în perechi și un bilet de ieșire pentru observații.",
      "Подставляем найденное значение x в исходное уравнение. Ученик объясняет каждое преобразование. Правильный ответ без объяснения сам по себе не показывает понимание метода. Учитель может использовать работу в парах и выходной билет для наблюдений.",
    ),
  },
];

export const prompts: Record<
  PromptKey,
  { label: Bilingual; answer: Bilingual; source?: number }
> = {
  start: {
    label: text(
      "Cum explic ecuațiile mai simplu?",
      "Как объяснить уравнения проще?",
    ),
    answer: text(
      "Pornește de la ideea unei balanțe: ce faci într-un membru, faci și în celălalt. Pentru 2x + 3 = 11, scade 3 din ambele părți, apoi împarte la 2. Obții x = 4. Cere elevilor să explice de ce fiecare pas păstrează egalitatea și să verifice: 2 × 4 + 3 = 11.",
      "Начните с образа весов: что делаем с одной частью, делаем и с другой. Для 2x + 3 = 11 вычтите 3 из обеих частей, затем разделите на 2. Получится x = 4. Попросите учеников объяснить сохранение равенства и проверить: 2 × 4 + 3 = 11.",
    ),
    source: 2,
  },
  differentiate: {
    label: text(
      "Propune o activitate pe niveluri",
      "Предложите задание по уровням",
    ),
    answer: text(
      "Propun trei puncte de pornire: 2x + 3 = 11 pentru lucru ghidat; 3(x − 2) = 12 pentru exersarea parantezelor; (2x − 1)/3 + 2 = 5 pentru aprofundare. Elevii pot lucra în perechi, apoi compara explicațiile. Soluțiile sunt 4, 6 și 5. Nivelurile sunt propuneri de activitate, nu etichete ale elevilor.",
      "Предлагаю три отправные точки: 2x + 3 = 11 для работы с поддержкой; 3(x − 2) = 12 для раскрытия скобок; (2x − 1)/3 + 2 = 5 для углубления. Ученики могут работать в парах и сравнивать объяснения. Решения: 4, 6 и 5. Уровни относятся к заданиям, а не к ученикам.",
    ),
  },
  verify: {
    label: text("Cum verificăm un răspuns AI?", "Как проверить ответ AI?"),
    answer: text(
      "Verifică independent fiecare transformare și înlocuiește rezultatul în ecuația inițială. Pentru x = 4 în 2x + 3 = 11: membrul stâng este 2 × 4 + 3 = 11, egal cu membrul drept. Cere o explicație, nu doar rezultatul. Un răspuns AI poate conține erori; profesorul verifică materialul înainte de a-l folosi.",
      "Независимо проверьте каждое преобразование и подставьте ответ в исходное уравнение. Для x = 4 в 2x + 3 = 11: левая часть 2 × 4 + 3 = 11 равна правой. Просите объяснение, а не только результат. В ответе AI возможны ошибки; учитель проверяет материал до использования.",
    ),
    source: 3,
  },
  reflect: {
    label: text("Ce notez după activitate?", "Что записать после занятия?"),
    answer: text(
      "Notează ce ai făcut efectiv, ce ai observat și ce ai schimba. Separă observația de explicația posibilă. De exemplu: «În simulare, câteva perechi au omis verificarea» este o observație demonstrativă; «poate au avut nevoie de un exemplu suplimentar» este o ipoteză. Fără date de comparație nu putem afirma o îmbunătățire cauzată de metodă.",
      "Запишите, что вы сделали, что наблюдали и что изменили бы. Отделяйте наблюдение от возможного объяснения. «В симуляции несколько пар пропустили проверку» — демонстрационное наблюдение; «возможно, им нужен дополнительный пример» — гипотеза. Без данных для сравнения нельзя утверждать, что метод вызвал улучшение.",
    ),
  },
};

export const activities = {
  without: {
    title: text("Detectivii egalității", "Детективы равенства"),
    subtitle: text(
      "Învățare prin colaborare, cu tablă și fișe.",
      "Совместная работа с доской и карточками.",
    ),
    steps: [
      text(
        "Arată ecuația 2x + 3 = 11 și discută ideea de echilibru.",
        "Покажите уравнение 2x + 3 = 11 и обсудите равновесие.",
      ),
      text(
        "În perechi, elevii rezolvă și explică fiecare transformare.",
        "В парах ученики решают и объясняют каждое преобразование.",
      ),
      text(
        "Schimbă fișele și verifică soluția prin substituție.",
        "Обменяйтесь карточками и проверьте решение подстановкой.",
      ),
      text(
        "Încheie cu un bilet de ieșire: «De ce verificăm soluția?»",
        "Завершите выходным билетом: «Зачем проверять решение?»",
      ),
    ],
  },
  with: {
    title: text("Găsește eroarea mentorului", "Найдите ошибку наставника"),
    subtitle: text(
      "AI pregătește un exemplu; elevii îl analizează critic.",
      "AI готовит пример; ученики критически его анализируют.",
    ),
    steps: [
      text(
        "Profesorul pregătește cu AI o rezolvare ce conține o eroare intenționată.",
        "Учитель с AI готовит решение с намеренной ошибкой.",
      ),
      text(
        "Exemplu greșit: 2x + 3 = 11 → 2x = 14 → x = 7.",
        "Пример с ошибкой: 2x + 3 = 11 → 2x = 14 → x = 7.",
      ),
      text(
        "Elevii identifică pasul greșit: trebuia scăzut 3, nu adunat.",
        "Ученики находят ошибку: нужно вычесть 3, а не прибавить.",
      ),
      text(
        "Corectează: 2x = 8 → x = 4. Verifică: 2 × 4 + 3 = 11.",
        "Исправьте: 2x = 8 → x = 4. Проверка: 2 × 4 + 3 = 11.",
      ),
    ],
  },
};

export const exercises: Record<
  Difficulty,
  { equation: string; solution: string; check: string }[]
> = {
  basic: [
    {
      equation: "2x + 3 = 11",
      solution: "2x = 8 → x = 4",
      check: "2 × 4 + 3 = 11 ✓",
    },
    {
      equation: "5x − 4 = 16",
      solution: "5x = 20 → x = 4",
      check: "5 × 4 − 4 = 16 ✓",
    },
    {
      equation: "x / 3 + 2 = 5",
      solution: "x / 3 = 3 → x = 9",
      check: "9 / 3 + 2 = 5 ✓",
    },
  ],
  medium: [
    {
      equation: "3(x − 2) = 12",
      solution: "x − 2 = 4 → x = 6",
      check: "3 × (6 − 2) = 12 ✓",
    },
    {
      equation: "4x + 2 = 2x + 10",
      solution: "2x = 8 → x = 4",
      check: "4 × 4 + 2 = 2 × 4 + 10 = 18 ✓",
    },
    {
      equation: "2(x + 3) − 4 = 10",
      solution: "2x + 2 = 10 → x = 4",
      check: "2 × (4 + 3) − 4 = 10 ✓",
    },
  ],
  advanced: [
    {
      equation: "(2x − 1) / 3 + 2 = 5",
      solution: "2x − 1 = 9 → x = 5",
      check: "(2 × 5 − 1) / 3 + 2 = 5 ✓",
    },
    {
      equation: "(x + 2) / 4 = (x − 1) / 2",
      solution: "x + 2 = 2x − 2 → x = 4",
      check: "(4 + 2) / 4 = (4 − 1) / 2 = 1,5 ✓",
    },
    {
      equation: "5 − 2(3x − 1) = −11",
      solution: "7 − 6x = −11 → x = 3",
      check: "5 − 2 × (3 × 3 − 1) = −11 ✓",
    },
  ],
};

export const reflectionExamples = [
  {
    label: text("Context și obiectiv", "Контекст и цель"),
    value: text(
      "Simulare demonstrativă · Matematică, clasa a VII-a. Obiectiv: rezolvarea ecuațiilor de gradul I și justificarea transformărilor.",
      "Демонстрационная симуляция · Математика, 7 класс. Цель: решение линейных уравнений и объяснение преобразований.",
    ),
  },
  {
    label: text("Ce a funcționat", "Что получилось"),
    value: text(
      "În scenariul fictiv, lucrul în perechi a creat ocazii pentru explicarea pașilor și compararea soluțiilor.",
      "В вымышленном сценарии работа в парах создала возможности объяснить шаги и сравнить решения.",
    ),
  },
  {
    label: text("Ce a fost dificil", "Что вызвало трудности"),
    value: text(
      "În simulare, unele perechi au omis verificarea prin substituție. Nu sunt consemnate rezultate reale ale elevilor.",
      "В симуляции некоторые пары пропустили проверку подстановкой. Реальные результаты учеников не фиксировались.",
    ),
  },
  {
    label: text("Ce aș adapta", "Что я изменю"),
    value: text(
      "Aș adăuga o rubrică separată pentru verificare și un exemplu rezolvat înainte de lucrul independent.",
      "Я добавлю отдельное поле для проверки и разобранный пример перед самостоятельной работой.",
    ),
  },
];

export const synthesisExamples = [
  {
    label: text("O posibilă explicație", "Возможное объяснение"),
    value: text(
      "Exemplul sugerează că o etapă explicită de verificare ar putea sprijini argumentarea. Aceasta este o ipoteză de explorat.",
      "Пример предполагает, что явный этап проверки может поддержать аргументацию. Это гипотеза для изучения.",
    ),
  },
  {
    label: text("De încercat data viitoare", "Что попробовать в следующий раз"),
    value: text(
      "Include o rubrică de verificare și observă dacă elevii o folosesc independent.",
      "Добавьте поле проверки и наблюдайте, используют ли его ученики самостоятельно.",
    ),
  },
  {
    label: text("Ce nu putem concluziona", "Чего нельзя заключить"),
    value: text(
      "Nu avem date reale, grup de comparație sau măsurători de progres.",
      "Нет реальных данных, группы сравнения или измерений прогресса.",
    ),
  },
];

export type DemoProgress = {
  version: 1;
  locale: Locale;
  diagnosticDone: boolean;
  activityVariant: "without" | "with" | null;
  completed: boolean[];
  saved: boolean;
  approved: boolean;
  feedback: "useful" | "clearer" | null;
};
export const initialProgress: DemoProgress = {
  version: 1,
  locale: "ro",
  diagnosticDone: false,
  activityVariant: null,
  completed: [false, false, false],
  saved: false,
  approved: false,
  feedback: null,
};
export const STORAGE_KEY = "edumentor-demo-v1";

export function parseProgress(raw: string | null): DemoProgress {
  if (!raw) return initialProgress;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return initialProgress;
    const v = value as Record<string, unknown>;
    if (
      v.version !== 1 ||
      (v.locale !== "ro" && v.locale !== "ru") ||
      !Array.isArray(v.completed) ||
      v.completed.length !== 3 ||
      !v.completed.every((x) => typeof x === "boolean") ||
      typeof v.diagnosticDone !== "boolean" ||
      typeof v.saved !== "boolean" ||
      typeof v.approved !== "boolean" ||
      !["useful", "clearer", null].includes(v.feedback as string | null)
    )
      return initialProgress;
    if (
      v.activityVariant !== null &&
      v.activityVariant !== "with" &&
      v.activityVariant !== "without"
    )
      return initialProgress;
    if (v.approved && !v.saved) return initialProgress;
    return v as DemoProgress;
  } catch {
    return initialProgress;
  }
}
