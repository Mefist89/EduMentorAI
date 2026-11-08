"use client";

import { useState } from "react";
import { BookOpen, GraduationCap } from "lucide-react";
import {
  courseSections,
  exercises,
  type Difficulty,
  type Locale,
  type View,
} from "@/lib/demo";
import { Action, Heading } from "./ui";

export function StudentLearning({
  locale,
  view,
  go,
}: {
  locale: Locale;
  view: View;
  go: (view: View) => void;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>("basic");
  const t = (ro: string, ru: string) => (locale === "ro" ? ro : ru);
  if (view === "dashboard")
    return (
      <>
        <Heading
          eyebrow={t("SPAȚIUL ELEVULUI", "ПРОСТРАНСТВО УЧЕНИКА")}
          title={t("Învață. Încearcă. Verifică.", "Учись. Пробуй. Проверяй.")}
          description={t(
            "Ecuații de gradul I · Matematică · Clasa a VII-a",
            "Линейные уравнения · Математика · 7 класс",
          )}
        />
        <section className="community-hero student-hero">
          <div>
            <p className="eyebrow">{t("PAS CU PAS", "ШАГ ЗА ШАГОМ")}</p>
            <h2>
              {t("Orice soluție începe", "Каждое решение начинается")}
              <br />
              <span>{t("cu o întrebare bună.", "с хорошего вопроса.")}</span>
            </h2>
            <p>
              {t(
                "Citește explicațiile, alege nivelul și încearcă să rezolvi înainte să deschizi soluția.",
                "Прочитай объяснения, выбери уровень и попробуй решить до просмотра решения.",
              )}
            </p>
            <Action onClick={() => go("course")}>
              {t("Deschide materialul", "Открыть материал")}{" "}
            </Action>
          </div>
          <GraduationCap size={110} aria-hidden="true" />
        </section>
        <section className="student-next panel">
          <BookOpen />
          <div>
            <h2>{t("Pregătit pentru exerciții?", "Готов к заданиям?")}</h2>
            <p>
              {t(
                "9 exerciții, în trei niveluri, cu soluții explicate.",
                "9 заданий трёх уровней с объяснениями решений.",
              )}
            </p>
          </div>
          <Action secondary onClick={() => go("activities")}>
            {t("Exersează", "Практиковаться")}
          </Action>
        </section>
      </>
    );
  if (view === "course")
    return (
      <>
        <Heading
          eyebrow={t("MATERIAL DE CURS", "УЧЕБНЫЙ МАТЕРИАЛ")}
          title={t("Ecuații de gradul I", "Линейные уравнения")}
          description={t(
            "Înțelege pașii și verifică fiecare rezultat prin înlocuire.",
            "Разберись в шагах и проверяй каждый результат подстановкой.",
          )}
        />
        <section className="panel student-reading">
          {courseSections.map((section, i) => (
            <article key={i}>
              <p className="eyebrow">
                {t("SECȚIUNEA", "РАЗДЕЛ")} {i + 1}
              </p>
              <h2>{section.title[locale]}</h2>
              <p>{section.body[locale]}</p>
            </article>
          ))}
        </section>
        <div className="page-bottom-action">
          <Action onClick={() => go("activities")}>
            {t("Încearcă exercițiile", "Перейти к заданиям")}
          </Action>
        </div>
      </>
    );
  return (
    <>
      <Heading
        eyebrow={t("EXERCIȚII PE NIVELURI", "ЗАДАНИЯ ПО УРОВНЯМ")}
        title={t("Rezolvă în ritmul tău.", "Решай в своём темпе.")}
        description={t(
          "Notează rezolvarea pe hârtie, apoi deschide soluția pentru a verifica pașii.",
          "Запиши решение на бумаге, затем открой ответ и проверь шаги.",
        )}
      />
      <div
        className="segmented student-levels"
        role="group"
        aria-label={t("Nivel", "Уровень")}
      >
        {(["basic", "medium", "advanced"] as const).map((level, i) => (
          <button
            key={level}
            aria-pressed={level === difficulty}
            onClick={() => setDifficulty(level)}
          >
            {
              [
                t("De bază", "Базовый"),
                t("Mediu", "Средний"),
                t("Avansat", "Сложный"),
              ][i]
            }
          </button>
        ))}
      </div>
      <section className="student-exercises" key={difficulty}>
        {exercises[difficulty].map((exercise, i) => (
          <article className="panel" key={i}>
            <p className="eyebrow">
              {t("EXERCIȚIUL", "ЗАДАНИЕ")} {i + 1}
            </p>
            <h2>{exercise.equation}</h2>
            <details>
              <summary>
                {t(
                  "Vezi soluția și verifică",
                  "Посмотреть решение и проверить",
                )}
              </summary>
              <p>{exercise.solution}</p>
              <p>
                {t("Verificare", "Проверка")}: {exercise.check}
              </p>
            </details>
          </article>
        ))}
      </section>
    </>
  );
}
