import type { Locale } from "./demo";

const text = (ro: string, ru: string) => ({ ro, ru });
export const continuityMilestones = [
  { day: 7, title: text("Aleg o activitate și formulez întrebarea", "Выбрать задание и сформулировать вопрос"), description: text("Profesorul alege o activitate din formare, notează ce vrea să încerce la propria clasă și pune o întrebare concretă în Expertiză și comunitate.", "Учитель выбирает задание из обучения, записывает, что хочет попробовать в своём классе, и задаёт конкретный вопрос в разделе «Экспертиза»."), view: "expertiza" as const },
  { day: 14, title: text("Încerc la clasă și cer feedback", "Попробовать на уроке и запросить обратную связь"), description: text("Profesorul încearcă activitatea și discută o observație cu un coleg, în comunitate sau prin mesaj privat. Dacă blocajul persistă, facilitatorul cere sprijinul unui mentor prin M2.", "Учитель пробует задание и обсуждает наблюдение с коллегой в сообществе или личном сообщении. Если затруднение сохраняется, фасилитатор запрашивает помощь наставника через M2."), view: "expertiza" as const },
  { day: 30, title: text("Reflectez și aleg ce împărtășesc", "Осмыслить опыт и выбрать, чем поделиться"), description: text("Profesorul consemnează ce a observat, ce a funcționat și ce va adapta în reflecția profesională. Numai cu acordul său, facilitatorul transferă manual spre M5 o fișă anonimizată.", "Учитель записывает наблюдения, что сработало и что изменит, в профессиональной рефлексии. Только с его согласия фасилитатор вручную передаёт обезличенную карточку в M5."), view: "experience" as const },
] as const;

// The first-month pilot and monthly/quarterly cadence come from the supplied M3 canvas.
// Months 2–12 are a proposed scheduling of that cadence, not completed activity.
export const continuityYear = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1;
  const review = month % 3 === 0;
  return {
    month, review,
    title: month === 1 ? text("Lansare și pilot de 30 de zile", "Запуск и пилот на 30 дней") : month === 12 ? text("Schimb de experiență și bilanț anual", "Обмен опытом и итоги года") : review ? text("Schimb lunar și revizuire trimestrială", "Ежемесячный обмен и квартальный обзор") : text("Schimb lunar între colegi", "Ежемесячный обмен между коллегами"),
    actions: month === 1 ? [
      text("Se verifică la furnizor sursa și codul unei ediții reale de formare din M1; facilitatorul fixează tema, treapta și calendarul cercului.", "У провайдера проверяют источник и код реального обучения из M1; фасилитатор определяет тему, ступень и календарь круга."),
      text("Trei profesori sunt invitați la proba de parcurs: comunitate → întrebare → feedback → reflecție. Rezultatele probei sunt încă de colectat.", "Трёх учителей приглашают проверить путь: сообщество → вопрос → обратная связь → рефлексия. Результаты проверки ещё предстоит собрать."),
      text("Se aplică reperele 7–14–30. În ziua 30 se anunță primul schimb lunar și următorul facilitator, cu acordul școlii gazdă.", "Выполняют шаги 7–14–30. На 30-й день объявляют первый ежемесячный обмен и следующего фасилитатора с согласия принимающей школы."),
    ] : [
      text("Profesorii revin cu o întrebare sau o observație din aplicarea la clasă și aleg următorul pas împreună cu un coleg.", "Учителя возвращаются с вопросом или наблюдением из практики и вместе с коллегой выбирают следующий шаг."),
      text("Facilitatorul propune discuția lunară, urmărește blocajele și poate roti facilitarea între școlile participante, prin acord.", "Фасилитатор предлагает тему ежемесячной встречи, отслеживает затруднения; школы могут по согласованию сменять фасилитатора."),
      review ? text("Se revizuiesc exemplele: observație, metodă, limite, anonimizare și acord de reutilizare. În luna 12 se încheie și bilanțul celor 12 luni.", "Проводят обзор примеров: наблюдение, метод, ограничения, обезличивание и согласие на использование. В месяце 12 также подводят итоги всех 12 месяцев.") : text("Fișele aprobate de autori sunt pregătite pentru revizuirea trimestrială; transferul către M5 rămâne manual.", "Одобренные авторами карточки готовят к квартальному обзору; передача в M5 остаётся ручной."),
    ],
  };
});

export const continuityTransfers = [
  { module: "M1", title: text("Ediția de formare", "Обучение"), incoming: text("Codul și linkul ediției, competența și treapta de învățământ.", "Код и ссылка на обучение, компетенция и ступень образования."), outgoing: text("Linkul cercului, calendarul și contactul instituțional asociate ediției.", "Ссылка на круг, календарь и институциональный контакт, связанные с обучением.") },
  { module: "M2", title: text("Sprijin și mentorat", "Поддержка и наставничество"), incoming: text("Un mentor potrivit temei și treptei, când apare un blocaj.", "Наставник по теме и ступени при возникновении затруднения."), outgoing: text("Tema, treapta și tipul blocajului pentru care se cere sprijin.", "Тема, ступень и тип затруднения, для которого нужна помощь.") },
  { module: "M4", title: text("Îmbunătățirea conținuturilor", "Улучшение содержания"), incoming: text("Nu este definit un flux de intrare în datele furnizate.", "В предоставленных данных входящий поток не определён."), outgoing: text("O sinteză agregată pentru îmbunătățirea conținuturilor.", "Обобщённая сводка для улучшения содержания.") },
  { module: "M5", title: text("Exemple verificate", "Проверенные примеры"), incoming: text("Exemple revizuite, cu observația, metoda și limitele lor.", "Проверенные примеры с наблюдением, методом и ограничениями."), outgoing: text("Fișa anonimizată, codul ediției și confirmarea acordului autorului.", "Обезличенная карточка, код обучения и подтверждение согласия автора.") },
  { module: "M6", title: text("Obstacole recurente", "Повторяющиеся препятствия"), incoming: text("Răspunsul și pasul următor pentru obstacolele semnalate.", "Ответ и следующий шаг по заявленным препятствиям."), outgoing: text("Obstacole recurente și contextul lor, în formă agregată.", "Повторяющиеся препятствия и их контекст в обобщённом виде.") },
];

export function continuityLabel(value: { ro: string; ru: string }, locale: Locale) { return value[locale]; }
