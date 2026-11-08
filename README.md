# EduMentor AI — prototip demonstrativ

Aplicație Next.js + TypeScript cu design verde petrol, accente lime și suprafețe deschise. Traseul este pregătit pentru un profesor de matematică, clasa a VII-a, cu tema ecuațiilor de gradul I.

## Pornire locală

Necesită Node.js 20.9 sau mai nou și npm.

```powershell
cd D:\SASS\DigiHack\edumentor
npm install
npm run dev
```

Deschide adresa afișată în terminal, implicit http://127.0.0.1:3000.

```powershell
npm run typecheck
npm run build
npm start
```

## Ce poți încerca

1. **Prezentare** — banner introductiv, resurse demonstrative și traseu cu progres real al interacțiunilor din demonstrație.
2. **Cursul meu** — material demonstrativ în trei secțiuni și trei răspunsuri de diagnostic pregătite. Apasă „Folosește acest exemplu”.
3. **AI Mentor** — alege întrebările pregătite pentru răspunsuri reale OpenAI. Mentorul primește materialul cursului și contextul demonstrativ. Referințele afișate deschid materialul cursului. Dacă serviciul nu răspunde, poți reîncerca sau alege explicit un răspuns static, etichetat drept exemplu.
4. **Activități** — compară varianta cu AI și cea fără AI; alege o activitate exemplu. Explorează trei niveluri a câte trei exerciții și soluțiile verificate prin substituție.
5. **Experiența mea** — citește reflecția fictivă, afișează sinteza exemplu, salvează și aprobă fișa. Revino la ciornă sau copiază textul dacă dorești.
6. **RO / RU** — schimbă limba interfeței, a materialelor și a exemplelor.

Nu sunt necesare conturi, fișiere încărcate, formulare sau date reale pentru parcurgerea demonstrației. Numele profesorului și toate observațiile pedagogice sunt fictive. Nu există încă o interfață de autentificare, salvare a fișelor în baza de date, trimitere de feedback către o echipă sau publicare externă.

## Conexiune Supabase

Pachetele `@supabase/supabase-js` și `@supabase/ssr` sunt instalate cu versiuni exacte în `package.json` și `package-lock.json`. Configurația locală folosește proiectul Supabase indicat pentru această aplicație. Pentru un checkout nou, copiază `.env.example` în `.env.local` și completează URL-ul și cheia **publishable** ale proiectului. `.env.local` este exclus din Git.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Într-un Client Component:

```typescript
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
```

Într-un Server Component, Server Action sau Route Handler:

```typescript
import { createClient } from "@/utils/supabase/server";
const supabase = await createClient();
```

`src/proxy.ts` este punctul de intrare Next.js 16 pentru reîmprospătarea sesiunilor. Acesta apelează `updateSession` din `src/utils/supabase/middleware.ts`, care execută `auth.getClaims()`, actualizează cookie-urile cererii și răspunsului și propagă antetele de protecție împotriva cache-ului. Fiecare cerere server primește un client separat. Demo-ul rămâne accesibil fără autentificare; proxy-ul nu reprezintă o regulă de autorizare pentru viitoarele date private.

```powershell
npm run check:supabase
npm run test:supabase
```

`GET /api/health/supabase` verifică efectiv accesul la Supabase Auth cu cheia configurată, inclusiv fără un utilizator autentificat. Un răspuns reușit este `{ "status": "ok", "service": "supabase", "auth": "reachable" }`. Verificarea nu confirmă existența tabelelor sau politicile RLS și nu returnează chei, tokenuri sau identități.

Pentru o verificare Data API fără a citi rânduri, folosește `npm run check:supabase -- numele_tabelului`. Comanda execută o interogare `LIMIT 0`. Tabelul `todos` din exemplul de configurare nu există în proiect la momentul conectării; pagina principală EduMentor nu depinde de el. Nu au fost create tabele sau modificate politici. Înaintea salvării datelor utilizatorilor sunt necesare schema aplicației, autentificare și politici RLS pentru proprietarul fiecărui rând. Cheile secret și `service_role` nu se folosesc în configurația publică.

Referință: [configurarea SSR Supabase în Next.js](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs).

## Persistență

Preferința de limbă, diagnosticul activat, pașii explorați, starea fișei și reacția demonstrativă sunt păstrate în `localStorage`, cheia `edumentor-demo-v1`. Conversația este temporară și se reia la părăsirea ecranului sau reîncărcare. Răspunsurile OpenAI sunt păstrate în memoria ecranului; următorul apel poate include ultimele patru răspunsuri OpenAI din conversație. Schimbarea limbii afectează răspunsurile noi, fără a traduce retroactiv istoricul. Datele de profil și materialele transmise modelului sunt fictive și pregătite în cod. Dacă stocarea browserului este blocată, aplicația anunță că progresul va fi temporar. „Reia demonstrația” resetează doar acest demo, după confirmare. Nu folosi acest prototip pentru date reale sau sensibile.

## Mentor OpenAI

Configurează în `.env.local`, exclusiv pe server:

```dotenv
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
```

Cheia nu are prefix `NEXT_PUBLIC_` și nu este inclusă în Git. Modelul se poate schimba din configurație. SDK-ul oficial `openai` este instalat cu versiune exactă. Modulul care îl folosește este marcat `server-only` și poate fi importat numai din cod server.

`POST /api/mentor/chat` primește `promptKey`, `locale` și un istoric opțional de maximum patru răspunsuri. Pentru această etapă se acceptă doar cele patru întrebări exemplu, fără formular liber sau date personale. Contextul este construit pe server din materialul cursului și profilul demonstrativ, iar OpenAI Responses API este apelat cu `store: false` și maximum 1200 de tokeni de ieșire. Opțiunea de stocare a răspunsurilor nu constituie o promisiune de retenție zero pentru toate mecanismele furnizorului.

Răspunsul are format structurat și este validat înainte de afișare. Secțiunile citate pot fi doar cele existente, 1–3. Profesorul verifică în continuare recomandările și calculele; o referință existentă nu este o validare independentă a tuturor afirmațiilor modelului. Erorile furnizorului sunt traduse în coduri controlate, fără chei sau mesaje brute în răspunsul API. Nu există înlocuire automată cu un răspuns fictiv.

Demo-ul local permite maximum 20 de solicitări pe minut și două apeluri simultane pe proces server. Limita este în memorie și se resetează la repornire; nu este o cotă distribuită pentru o viitoare implementare pe mai multe instanțe. Timeout-ul apelului este de 30 de secunde, fără reîncercări automate. Cererile din altă origine sunt respinse. Browserul apelează numai ruta locală; secretul nu este trimis browserului.

```powershell
npm run test:mentor
```

Referințe: [Responses API și stocarea răspunsurilor](https://developers.openai.com/api/docs/guides/migrate-to-responses), [răspunsuri structurate](https://developers.openai.com/api/docs/guides/structured-outputs).

## Organizare

- `src/app/` — aplicație, metadate, icon și stiluri responsive.
- `src/components/mentor-app.tsx` — navigare, panou principal și persistență.
- `src/components/dashboard.tsx` — prezentare, carduri de resurse și traseu compact.
- `src/components/learning-views.tsx` — curs, conversație, activități, reflecție și portofoliu.
- `src/components/ui.tsx` — elemente vizuale comune.
- `src/components/mentor-chat.tsx` — conversație OpenAI, stări de încărcare, erori și exemple de rezervă.
- `src/lib/demo.ts` — exemple bilingve, exerciții și validarea datelor locale.
- `src/lib/mentor-contract.ts` — validarea cererilor și a răspunsurilor mentorului.
- `src/lib/openai-mentor.ts` — integrarea OpenAI exclusiv pe server.
- `src/utils/supabase/` — configurare și clienți Supabase pentru browser, server și sesiuni.
- `src/proxy.ts` — punctul de intrare pentru reîmprospătarea sesiunilor.
- `src/app/api/health/supabase/route.ts` — verificare de conectivitate la Supabase Auth.
- `tests/supabase.test.mjs` — verificări pentru cookie-uri, izolare între cereri și tratarea erorilor.
- `tests/mentor.test.mjs` — validare, context AI, erori, referințe și limite de solicitări.

## Limite și continuare

Acesta este un MVP demonstrativ local cu mentor OpenAI și integrarea de bază Supabase configurate. Interfața de autentificare, autorizarea între profesori, schema și persistența fișelor în Supabase și documentele încărcate sunt etape următoare. Diagnosticul, planul, activitățile, exercițiile și sinteza din fișa de experiență rămân exemple pregătite; doar conversația mentorului generează răspunsuri noi prin OpenAI. Aprobarea fișei nu validează independent eficiența pedagogică. Designul urmează noua referință vizuală: verde petrol `#153F43`, lime `#D5ED8C`, verde pentru acțiuni secundare `#23675C`, fundal `#F4F7F5`, suprafețe `#FFFFFF` și text `#203D3E`. Stilurile comune sunt în `globals.css`, iar tema este în `theme.css`.

Fontul Manrope se încarcă de la Google Fonts; dacă nu există acces la internet se folosește Segoe UI sau Arial. Răspunsurile reale ale mentorului necesită internet și un cont OpenAI cu acces API. Exemplele statice pot fi explorate și când apelul AI nu reușește.

Documentație framework: [instalare Next.js](https://nextjs.org/docs/app/getting-started/installation).
