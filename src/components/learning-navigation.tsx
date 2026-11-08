import { ArrowRight, BookOpen, Check, ChevronRight, Compass, Flag, Layers3 } from "lucide-react";
import { navigation, steps, type DemoProgress, type Locale, type View } from "@/lib/demo";
import { Action } from "./ui";

export function ContinuityView({ locale, progress, go, student }: { locale: Locale; progress: DemoProgress; go: (view: View) => void; student: boolean }) {
  const t = (ro: string, ru: string) => locale === "ro" ? ro : ru;
  const completed = progress.completed.filter(Boolean).length;
  const nextIndex = progress.completed.findIndex(done => !done);
  const next = steps[nextIndex < 0 ? 2 : nextIndex];
  return <section className="ln-page">
    <header className="ln-heading"><p className="eyebrow">{t("CONTINUĂ ÎN RITMUL TĂU", "ПРОДОЛЖАЙТЕ В СВОЁМ ТЕМПЕ")}</p><h1 id="page-title" tabIndex={-1}>{t("Continuitate", "Продолжение")}</h1><p>{t("Revino la învățare și alege următorul pas din traseul tău.", "Возвращайтесь к обучению и выбирайте следующий шаг своего маршрута.")}</p></header>
    <section className="ln-hero"><span className="ln-hero-icon"><Compass size={32} aria-hidden="true" /></span><div><p>{student ? t("SPAȚIUL ELEVULUI", "ПРОСТРАНСТВО УЧЕНИКА") : t("TRASEUL TĂU DE ÎNVĂȚARE", "ВАШ УЧЕБНЫЙ МАРШРУТ")}</p><h2>{student ? t("Reia materialul sau exersează", "Вернитесь к материалу или упражнениям") : completed === 3 ? t("Traseul demonstrativ este parcurs", "Демомаршрут пройден") : next.title[locale]}</h2><p>{student ? t("Materialul despre ecuații și exercițiile sunt pregătite pentru tine.", "Материал об уравнениях и упражнения готовы к изучению.") : completed === 3 ? t("Poți reveni la reflecție sau reciti oricare dintre etape.", "Можно вернуться к рефлексии или повторить любой этап.") : next.description[locale]}</p><Action onClick={() => go(student ? "course" : next.view)}>{student ? t("Deschide cursul", "Открыть курс") : completed === 3 ? t("Revino la reflecție", "Вернуться к рефлексии") : t("Continuă traseul", "Продолжить маршрут")}</Action></div></section>
    {student ? <div className="ln-grid"><button className="ln-card" onClick={() => go("course")}><BookOpen size={23} /><h2>{t("Cursul meu", "Мой курс")}</h2><p>{t("Ecuații de gradul I: înțelege, rezolvă, verifică.", "Линейные уравнения: понять, решить, проверить.")}</p><span>{t("Deschide materialul", "Открыть материал")}<ArrowRight size={16} /></span></button><button className="ln-card" onClick={() => go("activities")}><Layers3 size={23} /><h2>{t("Exerciții", "Задания")}</h2><p>{t("Nouă exerciții cu soluții, pe trei niveluri.", "Девять упражнений с решениями на трёх уровнях.")}</p><span>{t("Continuă exersarea", "Продолжить практику")}<ArrowRight size={16} /></span></button></div> : <section className="ln-progress"><div className="ln-section-heading"><h2>{t("De la învățare la experiență", "От обучения к опыту")}</h2><strong>{completed} / 3</strong></div><div className="progress-track" role="progressbar" aria-label={t("Progresul traseului demonstrativ", "Прогресс демомаршрута")} aria-valuemin={0} aria-valuemax={3} aria-valuenow={completed}><span style={{ width: `${completed / 3 * 100}%` }} /></div><ol className="ln-steps">{steps.map((step, index) => <li key={step.view}><button onClick={() => go(step.view)}><span className={`ln-step-number${progress.completed[index] ? " is-complete" : ""}`}>{progress.completed[index] ? <Check size={18} aria-hidden="true" /> : index + 1}</span><span><strong>{step.title[locale]}</strong><small>{step.description[locale]}</small><em>{progress.completed[index] ? t("Etapă parcursă", "Этап пройден") : t("Etapă de parcurs", "Этап впереди")}</em></span><ChevronRight size={18} aria-hidden="true" /></button></li>)}</ol></section>}
    <p className="ln-note"><Flag size={16} aria-hidden="true" />{student ? t("Deschide cursul, apoi treci la exerciții și verifică soluțiile.", "Откройте курс, затем перейдите к упражнениям и проверьте решения.") : t("Progresul demonstrativ se păstrează pentru contul tău în acest browser și se actualizează în etapele cursului, activității și reflecției.", "Прогресс демомаршрута сохраняется для вашего аккаунта в этом браузере и обновляется при прохождении курса, задания и рефлексии.")}</p>
  </section>;
}

const descriptions = {
  dashboard: ["Descoperă platforma și ideile pentru învățare.", "Обзор платформы и идей для обучения."],
  practices: ["Biblioteca practicilor pedagogice.", "Библиотека педагогических практик."],
  course: ["Parcurge materialul și consolidează ideile de bază.", "Изучите материал и закрепите основные идеи."],
  activities: ["Alege activități și exersează pe niveluri.", "Выбирайте задания и практикуйтесь по уровням."],
  cohorts: ["Regăsește grupurile și învățarea împreună.", "Учебные группы и совместное обучение."],
  mentor: ["Discută ideile cu mentorul AI.", "Обсуждайте идеи с AI-наставником."],
  experience: ["Notează observațiile și reflectează asupra practicii.", "Записывайте наблюдения и размышляйте о практике."],
} as const;
export function InvestigationView({ locale, views, go, student }: { locale: Locale; views: readonly View[]; go: (view: View) => void; student: boolean }) {
  const t = (ro: string, ru: string) => locale === "ro" ? ro : ru;
  return <section className="ln-page"><header className="ln-heading"><p className="eyebrow">{t("EXPLOREAZĂ · ÎNVAȚĂ · APLICĂ", "ИССЛЕДУЙТЕ · УЧИТЕСЬ · ПРИМЕНЯЙТЕ")}</p><h1 id="page-title" tabIndex={-1}>{t("Investigație", "Исследование")}</h1><p>{t("Toate secțiunile de învățare, într-un singur loc. Alege unde continui.", "Все учебные разделы в одном месте. Выберите, куда перейти.")}</p></header><div className="ln-grid">{views.map(id => {
    const item = navigation.find(entry => entry.id === id)!;
    const description = descriptions[id as keyof typeof descriptions];
    return <button className="ln-card" key={id} onClick={() => go(id)}><BookOpen size={23} aria-hidden="true" /><h2>{student && id === "activities" ? t("Exerciții", "Задания") : item.label[locale]}</h2><p>{description?.[locale === "ro" ? 0 : 1]}</p><span>{t("Deschide secțiunea", "Открыть раздел")}<ArrowRight size={16} aria-hidden="true" /></span></button>;
  })}</div></section>;
}
