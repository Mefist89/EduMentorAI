"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  GraduationCap,
  Lightbulb,
  MessagesSquare,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { Locale } from "@/lib/demo";

const modules = [
  {
    icon: BookOpen,
    name: ["Materiale de învățare", "Учебные материалы"],
    description: [
      "Un curs demonstrativ despre ecuații de gradul I, explicat pas cu pas, pentru profesori și elevi.",
      "Демонстрационный курс по линейным уравнениям: пошаговые объяснения для учителей и учеников.",
    ],
  },
  {
    icon: Lightbulb,
    name: ["Activități la clasă", "Задания для занятий"],
    description: [
      "Exemple cu AI și fără AI, exerciții pe trei niveluri și soluții pe care le poți verifica.",
      "Примеры с AI и без него, задания трёх уровней сложности и решения для проверки.",
    ],
  },
  {
    icon: Sparkles,
    name: ["Mentor AI", "AI-наставник"],
    description: [
      "Întrebări ghidate și perspective pentru pregătirea lecției. Profesorul verifică și decide ce aplică.",
      "Готовые вопросы и идеи для подготовки урока. Учитель проверяет рекомендации и выбирает, что применить.",
    ],
  },
  {
    icon: Compass,
    name: ["Trasee de formare", "Маршруты развития"],
    description: [
      "Profesorii explorează cursuri, compară oferte de formare și păstrează în cont marcajele cursurilor urmate.",
      "Учителя находят курсы, сравнивают предложения и сохраняют отметки о пройденном обучении.",
    ],
  },
  {
    icon: MessagesSquare,
    name: ["Expertiză și comunitate", "Экспертиза и сообщество"],
    description: [
      "Întrebări, răspunsuri și comunități. Mesaje private între conturile platformei și sprijin de la Maria AI.",
      "Вопросы, ответы и сообщества. Личные сообщения между участниками платформы и помощь Maria AI.",
    ],
  },
  {
    icon: NotebookPen,
    name: ["Reflecție profesională", "Профессиональная рефлексия"],
    description: [
      "O fișă demonstrativă te ajută să explorezi ce ai observat, ce a funcționat și ce ai adapta la clasă.",
      "Демонстрационная карточка помогает осмыслить наблюдения, удачные решения и возможные изменения урока.",
    ],
  },
] as const;

const resources = [
  {
    title: ["Curriculumul național", "Национальный куррикулум"],
    provider: "MEC · Republica Moldova",
    description: [
      "Documente curriculare pentru învățământul primar, gimnazial și liceal.",
      "Учебные программы для начальной школы, гимназии и лицея.",
    ],
    href: "https://www.mec.gov.md/ro/content/curriculumul-national",
    tag: ["CURRICULUM", "ПРОГРАММЫ"],
  },
  {
    title: ["EduResurse", "EduResurse"],
    provider: "EduResurse Moldova",
    description: [
      "Catalog de materiale educaționale, organizat pe trepte de învățământ și discipline.",
      "Каталог образовательных материалов по ступеням обучения и предметам.",
    ],
    href: "https://www.eduresurse.gov.md/catalog",
    tag: ["MATERIALE", "МАТЕРИАЛЫ"],
  },
  {
    title: ["Educație Online", "Educație Online"],
    provider: ["Biblioteca Digitală", "Цифровая библиотека"],
    description: [
      "Lecții filmate și resurse pentru clasele I–XII și pregătirea pentru examene.",
      "Видеоуроки и ресурсы для 1–12 классов и подготовки к экзаменам.",
    ],
    href: "https://educatieonline.md/",
    tag: ["LECȚII VIDEO", "ВИДЕОУРОКИ"],
  },
  {
    title: ["Programe de examene", "Экзаменационные программы"],
    provider: "ANCE",
    description: [
      "Programele de examen publicate de Agenția Națională pentru Curriculum și Evaluare.",
      "Экзаменационные программы Национального агентства по куррикулуму и оцениванию.",
    ],
    href: "https://www.ance.gov.md/content/programe-de-examene",
    tag: ["EVALUARE", "ОЦЕНИВАНИЕ"],
  },
  {
    title: ["Resurse pentru profesori", "Ресурсы для учителей"],
    provider: "INEL",
    description: [
      "Materiale despre mentorat, reflecție pedagogică și siguranță online.",
      "Материалы о наставничестве, педагогической рефлексии и безопасности в интернете.",
    ],
    href: "https://inel.md/ro/resurse",
    tag: ["MENTORAT", "НАСТАВНИЧЕСТВО"],
  },
  {
    title: ["eTwinning Moldova", "eTwinning Moldova"],
    provider: "eTwinning · UTM",
    description: [
      "Informații despre colaborare între școli și proiecte educaționale comune.",
      "Информация о сотрудничестве школ и совместных образовательных проектах.",
    ],
    href: "https://e-twinning.utm.md/",
    tag: ["COLABORARE", "СОТРУДНИЧЕСТВО"],
  },
] as const;

export function PublicLanding() {
  const [locale, setLocale] = useState<Locale>("ro");
  const index = locale === "ro" ? 0 : 1;
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <div className="public-landing" lang={locale}>
      <a className="public-skip" href="#public-main">
        {t("Sari la conținut", "Перейти к содержимому")}
      </a>
      <header className="public-header">
        <a
          className="public-brand"
          href="/"
          aria-label={t("EduMentor, pagina principală", "EduMentor, главная")}
        >
          <span className="public-brand-mark">E</span>
          <span>
            <strong>EduMentor</strong>
            <small>AI LAB · MOLDOVA</small>
          </span>
        </a>
        <nav
          className="public-nav"
          aria-label={t("Navigare publică", "Навигация сайта")}
        >
          <a href="#despre">{t("Despre", "О платформе")}</a>
          <a href="#module">{t("Ce oferim", "Возможности")}</a>
          <a href="#resurse">{t("Resurse", "Ресурсы")}</a>
        </nav>
        <div className="public-header-actions">
          <div
            className="public-language"
            role="group"
            aria-label={t("Limba paginii", "Язык страницы")}
          >
            {(["ro", "ru"] as const).map((language) => (
              <button
                key={language}
                type="button"
                aria-pressed={locale === language}
                onClick={() => setLocale(language)}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
          <a
            className="public-button public-button-dark public-login"
            href="/login"
          >
            {t("Intră în cont", "Войти")}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </header>
      <main id="public-main">
        <section
          className="public-hero public-wrap"
          aria-labelledby="public-title"
        >
          <div className="public-hero-copy">
            <p className="public-eyebrow">
              <span />
              {t(
                "ÎNVĂȚARE · PRACTICĂ · COMUNITATE",
                "ОБУЧЕНИЕ · ПРАКТИКА · СООБЩЕСТВО",
              )}
            </p>
            <h1 id="public-title">
              {t("Ideile bune merită", "Хорошими идеями")}
              <br />
              <em>{t("împărtășite.", "стоит делиться.")}</em>
            </h1>
            <p className="public-lead">
              {t(
                "Un spațiu pentru profesorii și elevii care învață împreună. Descoperă resurse, explorează idei cu AI și transformă învățarea în practică.",
                "Пространство для учителей и учеников, которые учатся вместе. Находите ресурсы, исследуйте идеи с AI и применяйте знания на практике.",
              )}
            </p>
            <div className="public-hero-actions">
              <a href="/login" className="public-button public-button-lime">
                {t("Intră în platformă", "Перейти в платформу")}
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a href="#module" className="public-text-link">
                {t("Descoperă posibilitățile", "Узнать о возможностях")}
                <ChevronRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="public-hero-trust">
              <span>
                <ShieldCheck size={16} aria-hidden="true" />
                {t("Profesorul decide", "Решает учитель")}
              </span>
              <span>
                <BookOpen size={16} aria-hidden="true" />
                {t("Resurse deschise", "Открытые ресурсы")}
              </span>
              <span>
                <Users size={16} aria-hidden="true" />
                {t("Învățăm împreună", "Учимся вместе")}
              </span>
            </div>
          </div>
          <div className="public-hero-visual" aria-hidden="true">
            <div className="public-visual-orbit" aria-hidden="true" />
            <div className="public-floating public-floating-top">
              <Sparkles size={17} aria-hidden="true" />
              {t("O perspectivă nouă", "Новый взгляд")}
            </div>
            <div className="public-preview-card">
              <div className="public-preview-header">
                <span className="public-preview-icon">
                  <BookOpen size={23} aria-hidden="true" />
                </span>
                <div>
                  <p>{t("PARCURS DEMONSTRATIV", "ДЕМОНСТРАЦИОННЫЙ МАРШРУТ")}</p>
                  <strong>
                    {t("Învățare cu sens", "Осмысленное обучение")}
                  </strong>
                </div>
                <span className="public-preview-dot" aria-hidden="true" />
              </div>
              <div className="public-preview-note">
                <span>
                  <Lightbulb size={17} aria-hidden="true" />
                  {t("De la o idee…", "От идеи…")}
                </span>
                <p>
                  {t(
                    "Cum fac lecția mai clară și mai apropiată de elevii mei?",
                    "Как сделать урок понятнее и ближе моим ученикам?",
                  )}
                </p>
              </div>
              <ol className="public-preview-steps">
                {[
                  ["Un obiectiv clar", "Понятная цель"],
                  ["O activitate potrivită", "Подходящее задание"],
                  ["Timp pentru reflecție", "Время для рефлексии"],
                ].map((label, i) => (
                  <li key={i}>
                    <span>{i + 1}</span>
                    {label[index]}
                    <Check size={15} aria-hidden="true" />
                  </li>
                ))}
              </ol>
              <div className="public-preview-footer">
                <span className="public-preview-avatar" aria-hidden="true">
                  E
                </span>
                <span>
                  {t(
                    "Tu aduci contextul. AI ajută la idei.",
                    "Вы задаёте контекст. AI помогает с идеями.",
                  )}
                </span>
              </div>
            </div>
            <div className="public-floating public-floating-bottom">
              <Users size={18} aria-hidden="true" />
              <span>{t("Împreună, mai departe.", "Вместе — дальше.")}</span>
            </div>
          </div>
        </section>
        <section
          className="public-intro public-wrap"
          id="despre"
          aria-labelledby="public-about-title"
        >
          <div>
            <p className="public-eyebrow">
              {t("DE CE EDUMENTOR", "ЗАЧЕМ НУЖЕН EDUMENTOR")}
            </p>
            <h2 id="public-about-title">
              {t(
                "Experiența din clasă devine un punct de pornire.",
                "Опыт урока становится отправной точкой.",
              )}
            </h2>
          </div>
          <div>
            <p>
              {t(
                "O întrebare, o activitate sau o observație poate deschide un drum nou. EduMentor conectează materialele de învățare, formarea profesională și conversațiile dintre oameni.",
                "Вопрос, задание или наблюдение могут открыть новый путь. EduMentor объединяет учебные материалы, профессиональное развитие и общение.",
              )}
            </p>
            <p>
              {t(
                "Inteligența artificială oferă perspective. Profesorul păstrează contextul, verifică recomandările și alege ce este potrivit pentru clasă.",
                "Искусственный интеллект предлагает идеи. Учитель учитывает контекст, проверяет рекомендации и выбирает подходящее для своего класса.",
              )}
            </p>
          </div>
        </section>
        <section
          className="public-modules-section"
          id="module"
          aria-labelledby="public-modules-title"
        >
          <div className="public-wrap">
            <div className="public-section-heading">
              <div>
                <p className="public-eyebrow">
                  {t("MAI MULTE MODURI DE A ÎNVĂȚA", "РАЗНЫЕ СПОСОБЫ УЧИТЬСЯ")}
                </p>
                <h2 id="public-modules-title">
                  {t(
                    "Spațiul tău, de la idee la practică.",
                    "Ваш путь от идеи к практике.",
                  )}
                </h2>
              </div>
              <p>
                {t(
                  "Descoperă instrumentele disponibile în cont, în funcție de rolul tău.",
                  "Откройте инструменты, доступные в кабинете в зависимости от вашей роли.",
                )}
              </p>
            </div>
            <div className="public-modules-grid">
              {modules.map(({ icon: Icon, name, description }, i) => (
                <article className="public-module" key={name[0]}>
                  <div className="public-module-top">
                    <span className="public-module-icon">
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <span className="public-module-number">0{i + 1}</span>
                  </div>
                  <h3>{name[index]}</h3>
                  <p>{description[index]}</p>
                </article>
              ))}
            </div>
            <p className="public-module-note">
              {t(
                "Materialele de curs, activitățile și fișa de reflecție includ exemple demonstrative. Trasee este destinat profesorilor și administratorului; Expertiză este deschis tuturor celor trei roluri.",
                "Курс, задания и карточка рефлексии содержат демонстрационные примеры. Маршруты доступны учителям и администратору; Экспертиза — всем трём ролям.",
              )}
            </p>
          </div>
        </section>
        <section
          className="public-journey public-wrap"
          aria-labelledby="public-journey-title"
        >
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">
                {t("UN PARCURS SIMPLU", "ПРОСТОЙ МАРШРУТ")}
              </p>
              <h2 id="public-journey-title">
                {t(
                  "Descoperă. Aplică. Reflectează.",
                  "Узнавайте. Пробуйте. Осмысляйте.",
                )}
              </h2>
            </div>
          </div>
          <div className="public-journey-grid">
            {[
              {
                icon: Compass,
                title: [
                  "Găsește un punct de pornire",
                  "Найдите отправную точку",
                ],
                body: [
                  "Explorează resursele publice sau intră în cont pentru cursuri, activități și comunitate.",
                  "Изучите открытые ресурсы или войдите в кабинет, чтобы открыть курсы, задания и сообщество.",
                ],
              },
              {
                icon: Lightbulb,
                title: ["Alege ce se potrivește", "Выберите подходящее"],
                body: [
                  "Folosește exemplele și sprijinul AI. Verifică ideile și adaptează-le la contextul tău.",
                  "Используйте примеры и помощь AI. Проверяйте идеи и соотносите их со своим контекстом.",
                ],
              },
              {
                icon: NotebookPen,
                title: ["Învață din experiență", "Учитесь на опыте"],
                body: [
                  "Explorează reflecția pedagogică și împărtășește întrebări sau idei în Expertiză.",
                  "Осмыслите педагогический опыт и поделитесь вопросами или идеями в Экспертизе.",
                ],
              },
            ].map(({ icon: Icon, title, body }, i) => (
              <article key={i}>
                <div className="public-journey-marker">
                  <Icon size={23} aria-hidden="true" />
                  <span>0{i + 1}</span>
                </div>
                <h3>{title[index]}</h3>
                <p>{body[index]}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className="public-resources-section"
          id="resurse"
          aria-labelledby="public-resources-title"
        >
          <div className="public-wrap">
            <div className="public-section-heading">
              <div>
                <p className="public-eyebrow">
                  {t("DESCHISE PENTRU TOȚI", "ОТКРЫТО ДЛЯ ВСЕХ")}
                </p>
                <h2 id="public-resources-title">
                  {t(
                    "Resurse de la care poți începe.",
                    "Ресурсы, с которых можно начать.",
                  )}
                </h2>
              </div>
              <p>
                {t(
                  "Fără cont EduMentor. Linkurile duc la site-urile furnizorilor și se deschid într-o filă nouă.",
                  "Без аккаунта EduMentor. Ссылки ведут на сайты поставщиков и открываются в новой вкладке.",
                )}
              </p>
            </div>
            <div className="public-resources-grid">
              {resources.map((resource) => (
                <article className="public-resource" key={resource.href}>
                  <span className="public-resource-tag">
                    {resource.tag[index]}
                  </span>
                  <h3>{resource.title[index]}</h3>
                  <span className="public-resource-provider">
                    {typeof resource.provider === "string"
                      ? resource.provider
                      : resource.provider[index]}
                  </span>
                  <p>{resource.description[index]}</p>
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t("Deschide sursa", "Открыть источник")}: ${resource.title[index]} (${t("filă nouă", "новая вкладка")})`}
                  >
                    {t("Deschide sursa", "Открыть источник")}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
            <p className="public-resource-note">
              {t(
                "Resursele aparțin furnizorilor indicați. Verifică ediția și condițiile de utilizare direct la sursă.",
                "Ресурсы принадлежат указанным поставщикам. Проверяйте редакцию и условия использования на сайте источника.",
              )}
            </p>
          </div>
        </section>
        <section
          className="public-roles public-wrap"
          aria-labelledby="public-roles-title"
        >
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">
                {t("UN LOC PENTRU FIECARE", "МЕСТО ДЛЯ КАЖДОГО")}
              </p>
              <h2 id="public-roles-title">
                {t(
                  "Același scop. Perspective diferite.",
                  "Общая цель. Разные взгляды.",
                )}
              </h2>
            </div>
          </div>
          <div className="public-roles-grid">
            {[
              {
                icon: BookOpen,
                title: ["Pentru profesori", "Для учителей"],
                body: [
                  "Materiale, mentor AI, trasee de formare și reflecție asupra practicii.",
                  "Материалы, AI-наставник, маршруты развития и осмысление практики.",
                ],
              },
              {
                icon: GraduationCap,
                title: ["Pentru elevi", "Для учеников"],
                body: [
                  "Explicații, exerciții pe niveluri și participare la comunitatea Expertiză.",
                  "Объяснения, задания по уровням и участие в сообществе Экспертиза.",
                ],
              },
              {
                icon: ShieldCheck,
                title: ["Pentru administratori", "Для администраторов"],
                body: [
                  "Coordonarea formării și gestionarea comunităților și a discuțiilor din Expertiză.",
                  "Координация обучения и управление сообществами и обсуждениями в Экспертизе.",
                ],
              },
            ].map(({ icon: Icon, title, body }) => (
              <article key={title[0]}>
                <Icon size={24} aria-hidden="true" />
                <h3>{title[index]}</h3>
                <p>{body[index]}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="public-wrap public-bottom-wrap">
          <div className="public-bottom-cta">
            <div>
              <p className="public-eyebrow">
                {t("URMĂTORUL PAS ÎȚI APARȚINE", "СЛЕДУЮЩИЙ ШАГ — ЗА ВАМИ")}
              </p>
              <h2>
                {t("Învățăm unii de la alții.", "Учимся друг у друга.")}
                <br />
                <em>{t("Creștem împreună.", "Растём вместе.")}</em>
              </h2>
              <p>
                {t(
                  "Intră cu datele primite de la administratorul platformei. Rolul este asociat contului tău.",
                  "Войдите с данными, полученными от администратора платформы. Роль назначена вашему аккаунту.",
                )}
              </p>
            </div>
            <a className="public-button public-button-lime" href="/login">
              {t("Intră în cont", "Войти в аккаунт")}
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <footer className="public-footer public-wrap">
        <a className="public-brand" href="/despre">
          <span className="public-brand-mark">E</span>
          <span>
            <strong>EduMentor</strong>
            <small>AI LAB · MOLDOVA</small>
          </span>
        </a>
        <p>
          {t(
            "Platformă educațională în dezvoltare. AI sprijină; omul verifică și decide.",
            "Образовательная платформа в разработке. AI помогает; человек проверяет и решает.",
          )}
        </p>
        <a href="#public-title">{t("Înapoi sus", "Наверх")} ↑</a>
      </footer>
    </div>
  );
}
