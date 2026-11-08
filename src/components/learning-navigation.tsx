import { ArrowRight, BookOpen, Compass, Flag } from "lucide-react";
import { navigation, type DemoProgress, type Locale, type View } from "@/lib/demo";
import { AnnualContinuity } from "./annual-continuity";
import { Action } from "./ui";

export function ContinuityView({ locale, go, student }: { locale: Locale; progress: DemoProgress; go: (view: View) => void; student: boolean }) {
  if (!student) return <AnnualContinuity locale={locale} go={go} />;
  const t = (ro: string, ru: string) => locale === "ro" ? ro : ru;
  return <section className="ln-page"><header className="ln-heading"><p className="eyebrow">{t("CONTINUĂ ÎN RITMUL TĂU", "ПРОДОЛЖАЙТЕ В СВОЁМ ТЕМПЕ")}</p><h1 id="page-title" tabIndex={-1}>{t("Continuitate", "Продолжение")}</h1><p>{t("Materialele și exercițiile tale, într-un singur loc.", "Ваши материалы и упражнения в одном месте.")}</p></header><section className="ln-hero"><span className="ln-hero-icon"><Compass size={32} aria-hidden="true" /></span><div><p>{t("SPAȚIUL ELEVULUI", "ПРОСТРАНСТВО УЧЕНИКА")}</p><h2>{t("Reia materialul sau exersează", "Вернитесь к материалу или упражнениям")}</h2><p>{t("Materialul despre ecuații și exercițiile sunt pregătite pentru tine.", "Материал об уравнениях и упражнения готовы к изучению.")}</p><Action onClick={() => go("course")}>{t("Deschide cursul", "Открыть курс")}</Action></div></section><div className="ln-grid">{[{id:"course" as const,title:t("Cursul meu","Мой курс"),description:t("Ecuații de gradul I: înțelege, rezolvă, verifică.","Линейные уравнения: понять, решить, проверить.")},{id:"activities" as const,title:t("Exerciții","Задания"),description:t("Nouă exerciții cu soluții, pe trei niveluri.","Девять упражнений с решениями на трёх уровнях.")}].map(item=><button className="ln-card" key={item.id} onClick={()=>go(item.id)}><BookOpen size={23} aria-hidden="true"/><h2>{item.title}</h2><p>{item.description}</p><span>{t("Deschide","Открыть")}<ArrowRight size={16} aria-hidden="true"/></span></button>)}</div><p className="ln-note"><Flag size={16} aria-hidden="true"/>{t("Deschide cursul, apoi treci la exerciții și verifică soluțiile.","Откройте курс, затем перейдите к упражнениям и проверьте решения.")}</p></section>;
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
