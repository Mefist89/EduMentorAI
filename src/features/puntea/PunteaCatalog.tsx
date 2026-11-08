"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Compass,
  ExternalLink,
  Filter,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { Locale } from "@/lib/demo";
import {
  audiences,
  catalog,
  categories,
  filterCatalog,
  initialFilters,
  localizeEntry,
  timing,
  todayInBucharest,
  type CatalogEntry,
  type Filters,
} from "./catalog";

export function PunteaCatalog({ locale }: { locale: Locale }) {
  const [filters, setFilters] = useState<Filters>(initialFilters),
    [today, setToday] = useState("");
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);
  useEffect(() => {
    const update = () => setToday(todayInBucharest());
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);
  const results = useMemo(
    () => filterCatalog(catalog, filters, today),
    [filters, today],
  );
  const active =
    filters.query !== "" ||
    filters.category !== "toate" ||
    filters.audience !== "toate" ||
    filters.hidePast;
  return (
    <section className="puntea-catalog" aria-labelledby="page-title">
      <header className="pc-heading">
        <div>
          <p className="pc-eyebrow">
            {t(
              "OPORTUNITĂȚI · RESURSE · COMUNITĂȚI",
              "ВОЗМОЖНОСТИ · РЕСУРСЫ · СООБЩЕСТВА",
            )}
          </p>
          <h1 id="page-title" tabIndex={-1}>
            {t("ЭдуМост", "ЭдуМост")}
          </h1>
          <p>
            {t(
              "Găsește următorul pas pentru tine și comunitatea ta.",
              "Найдите следующий шаг для себя и своего сообщества.",
            )}
          </p>
        </div>
        <span className="pc-total">
          <Compass size={22} aria-hidden="true" />
          <span>
            <strong>{catalog.length}</strong>
            {t("fișe în catalog", "карточек в каталоге")}
          </span>
        </span>
      </header>
      <div className="pc-intro">
        <span className="pc-intro-icon">
          <Compass size={26} aria-hidden="true" />
        </span>
        <div>
          <h2>
            {t("Mai multe drumuri spre învățare.", "Больше путей к обучению.")}
          </h2>
          <p>
            {t(
              "Cursuri, concursuri, granturi, evenimente și resurse într-un singur loc. Citește condițiile, verifică sursa și alege ce ți se potrivește.",
              "Курсы, конкурсы, гранты, события и ресурсы в одном месте. Изучите условия, проверьте источник и выберите подходящее.",
            )}
          </p>
        </div>
        <ArrowUpRight size={24} aria-hidden="true" />
      </div>
      <div className="pc-tools">
        <div className="pc-search-row">
          <div className="pc-field pc-search">
            <label htmlFor="puntea-query">{t("Ce cauți?", "Что ищете?")}</label>
            <span className="pc-search-input">
              <Search size={18} aria-hidden="true" />
              <input
                id="puntea-query"
                value={filters.query}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, query: e.target.value }))
                }
                maxLength={160}
                placeholder={t(
                  "Ex. matematică, STEAM, mentorat, granturi…",
                  "Например: математика, наставничество, гранты…",
                )}
                type="search"
              />
            </span>
          </div>
          <div className="pc-field pc-audience">
            <label htmlFor="puntea-audience">
              {t("Pentru cine?", "Для кого?")}
            </label>
            <select
              id="puntea-audience"
              value={filters.audience}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  audience: e.target.value as Filters["audience"],
                }))
              }
            >
              <option value="toate">
                {t("Toate categoriile de public", "Все аудитории")}
              </option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>
                  {a[locale]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          className="pc-categories"
          role="group"
          aria-label={t("Categoria oportunităților", "Категория возможностей")}
        >
          <span className="pc-filter-caption">
            <Filter size={14} aria-hidden="true" />
            {t("Categorie", "Категория")}
          </span>
          <button
            aria-pressed={filters.category === "toate"}
            onClick={() => setFilters((f) => ({ ...f, category: "toate" }))}
          >
            {t("Toate", "Все")}
            <span>{catalog.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              aria-pressed={filters.category === c.id}
              onClick={() => setFilters((f) => ({ ...f, category: c.id }))}
            >
              {c[locale]}
              <span>{catalog.filter((e) => e.category === c.id).length}</span>
            </button>
          ))}
        </div>
        <div className="pc-filter-bottom">
          <label className="pc-past">
            <input
              type="checkbox"
              checked={filters.hidePast}
              onChange={(e) =>
                setFilters((f) => ({ ...f, hidePast: e.target.checked }))
              }
            />
            <span>
              {t(
                "Ascunde edițiile cu termenul sau data încheiate",
                "Скрыть предложения с истёкшим сроком или датой",
              )}
            </span>
          </label>
          <button
            className="pc-reset"
            disabled={!active}
            onClick={() => setFilters(initialFilters)}
          >
            <RotateCcw size={14} aria-hidden="true" />
            {t("Resetează filtrele", "Сбросить фильтры")}
          </button>
        </div>
      </div>
      <div className="pc-results-heading">
        <h2>{t("Catalogul de oportunități", "Каталог возможностей")}</h2>
        <p role="status" aria-live="polite" aria-atomic="true">
          <strong>{results.length}</strong>{" "}
          {t(results.length === 1 ? "rezultat din" : "rezultate din", "из")}{" "}
          {catalog.length}
        </p>
      </div>
      <p className="pc-language-note">
        {t(
          "Textele fișelor păstrează limba sursei: română. Caută după titlu, domeniu sau organizator.",
          "Карточки переведены с румынского. Оригинальные источники доступны по ссылкам. Ищите по названию, теме или организатору.",
        )}
      </p>
      {results.length > 0 ? (
        <div className="pc-grid">
          {results.map((entry) => (
            <CatalogCard
              key={entry.id}
              entry={entry}
              locale={locale}
              today={today}
            />
          ))}
        </div>
      ) : (
        <div className="pc-empty">
          <Search size={32} aria-hidden="true" />
          <h3>{t("Nu am găsit rezultate", "Ничего не найдено")}</h3>
          <p>
            {t(
              "Încearcă alt cuvânt sau schimbă publicul și categoria.",
              "Попробуйте другое слово, аудиторию или категорию.",
            )}
          </p>
          <button onClick={() => setFilters(initialFilters)}>
            {t("Arată toate cele 49 de fișe", "Показать все 49 карточек")}
          </button>
        </div>
      )}
      <aside className="pc-source-note">
        <ShieldCheck size={20} aria-hidden="true" />
        <div>
          <h2>
            {t("Verifică înainte de înscriere", "Проверьте перед участием")}
          </h2>
          <p>
            {t(
              "Catalog importat din proiectul furnizat; datele de consultare din fișiere sunt 7–8 noiembrie 2026. Condițiile și termenele nu sunt sincronizate automat. O fișă fără termen expirat nu confirmă că înscrierile sunt deschise. Verifică informația direct la organizator.",
              "Каталог перенесён из предоставленного проекта; в файлах указаны даты проверки 7–8 ноября 2026 года. Условия и сроки не обновляются автоматически. Отсутствие отметки об истёкшем сроке не означает, что набор открыт. Проверяйте информацию у организатора.",
            )}
          </p>
        </div>
      </aside>
    </section>
  );
}

function CatalogCard({
  entry,
  locale,
  today,
}: {
  entry: CatalogEntry;
  locale: Locale;
  today: string;
}) {
  const e = localizeEntry(entry, locale);
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru),
    category = categories.find((c) => c.id === e.category)!,
    state = timing(e, today);
  const labels = {
    expired: t("Termen încheiat", "Срок истёк"),
    "past-event": t("Eveniment încheiat", "Событие завершено"),
    deadline: t("Termen indicat", "Указанный срок"),
    event: t("Dată indicată", "Указанная дата"),
    conflict: t(
      "Termen contradictoriu · de verificat",
      "Противоречивый срок · проверьте",
    ),
    check: t("Disponibilitate de confirmat", "Уточните доступность"),
    resource: t("Resursă / informații", "Ресурс / информация"),
  };
  const date = e.deadline
    ? new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${e.deadline}T12:00:00Z`))
    : "";
  return (
    <article className={`pc-card pc-card-${e.category}`}>
      <div className="pc-card-top">
        <span className="pc-category">{category[locale]}</span>
        <ExternalLink size={15} aria-hidden="true" />
      </div>
      <h3 lang={locale}>{e.title}</h3>
      <p className="pc-provider" lang={locale}>
        {e.provider}
      </p>
      <p className={`pc-timing pc-timing-${state}`}>
        <CalendarDays size={13} aria-hidden="true" />
        <span>
          {labels[state]}
          {date && (
            <>
              : <time dateTime={e.deadline}>{date}</time>
            </>
          )}
        </span>
      </p>
      <p className="pc-summary" lang={locale}>
        {e.summary}
      </p>
      <dl className="pc-details">
        {e.eligible && (
          <>
            <dt>{t("Cui se adresează", "Кто может участвовать")}</dt>
            <dd lang={locale}>{e.eligible}</dd>
          </>
        )}
        {e.when && (
          <>
            <dt>{t("Perioadă / dată", "Период / дата")}</dt>
            <dd lang={locale}>{e.when}</dd>
          </>
        )}
        {e.cost && (
          <>
            <dt>{t("Cost", "Стоимость")}</dt>
            <dd lang={locale}>{e.cost}</dd>
          </>
        )}
      </dl>
      {e.next && (
        <div className="pc-next">
          <strong>{t("Următorul pas", "Следующий шаг")}</strong>
          <p lang={locale}>{e.next}</p>
        </div>
      )}
      <div className="pc-card-bottom">
        <div className="pc-card-audience">
          {e.audience.map((a) => (
            <span key={a}>
              {audiences.find((item) => item.id === a)![locale]}
            </span>
          ))}
        </div>
        <a
          className="pc-source-link"
          href={e.source}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("Deschide sursa", "Открыть источник")}: ${e.title} (${t("filă nouă", "новая вкладка")})`}
        >
          {t("Deschide sursa", "Открыть источник")}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        {e.references.length > 0 && (
          <details className="pc-references">
            <summary>
              {t("Referințe suplimentare", "Дополнительные источники")} (
              {e.references.length})
            </summary>
            <ul>
              {e.references.map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    lang={locale}
                  >
                    {label}
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}
