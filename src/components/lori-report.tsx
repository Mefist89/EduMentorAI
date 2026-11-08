import { LORI_CRITERIA, type LoriReport } from "@/lib/lori-rubric";
import type { Locale } from "@/lib/demo";

export function LoriAnalysis({ report, locale }: { report: LoriReport; locale: Locale }) {
  const t = (ro: string, ru: string) => locale === "ro" ? ro : ru;
  return <section className="lori-report" aria-label={t("Analiza LORI a lecției", "Анализ урока LORI")}>
    <h3>{t("Cele 9 criterii LORI", "9 критериев LORI")}</h3>
    <p className="lori-report-note">{t("Evaluare orientativă a planului descris · 1 = scăzut, 5 = ridicat. Lipsa datelor nu înseamnă o notă mică.", "Ориентировочная оценка описанного плана · 1 — низкая, 5 — высокая. Недостаток данных не означает низкую оценку.")}</p>
    <ol className="lori-criteria">
      {report.criteria.map(item => {
        const criterion = LORI_CRITERIA.find(c => c.id === item.criterion)!;
        return <li key={item.criterion}>
          <div className="lori-criterion-heading"><h4>{criterion[locale]}</h4><span className={`lori-score lori-score--${item.status}`}>{item.score !== null ? `${item.score}/5` : item.status === "not_applicable" ? t("Nu se aplică", "Не применимо") : t("Date insuficiente", "Недостаточно данных")}</span></div>
          <p>{item.evidence}</p>
          <p className="lori-improvement"><strong>{t("Pas următor: ", "Следующий шаг: ")}</strong>{item.improvement}</p>
          <small>{t("Criteriu din manual · p. ", "Критерий из руководства · стр. ")}{criterion.page}</small>
        </li>;
      })}
    </ol>
    <p className="lori-report-note">{t("Sursă: Learning Object Review Instrument, User Manual v1.5 · Nesbit, Belfer, Leacock · pp. 2–12. Adaptare pentru planuri de lecție; nu certifică o lecție observată sau conformitatea tehnică.", "Основа: Learning Object Review Instrument, User Manual v1.5 · Nesbit, Belfer, Leacock · стр. 2–12. Адаптация для планов урока; не подтверждает проведение урока или техническую сертификацию.")}</p>
  </section>;
}
