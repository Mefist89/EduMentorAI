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

Accesul la cabinet necesită un cont Supabase cu rol EduMentor. Pagina informativă și linkurile către resurse externe sunt publice. Conținutul pedagogic și observațiile rămân exemple fictive. Fișele nu sunt încă salvate în baza de date.

## Pagina publică

Vizitatorii fără sesiune văd la `/` pagina de prezentare EduMentor, în română și rusă. Conturile autentificate păstrează cabinetul și adresele existente `/#mentor`, `/#trasee`, `/#expertiza` etc. Pagina `/despre` poate fi vizitată de oricine, inclusiv de utilizatorii conectați, prin linkul „Despre platformă” din subsolul cabinetului. Formularul de login include un link de întoarcere la pagina publică.

Pagina prezintă cele șase direcții existente ale platformei, parcursul de învățare și rolurile profesor/elev/administrator. Exemplele demonstrative sunt identificate explicit. Resursele MEC, EduResurse, Educație Online, ANCE, INEL și eTwinning sunt linkuri către furnizori, disponibile fără cont EduMentor. Paginile au fost consultate la 8 noiembrie 2026; nu există sincronizare automată sau copiere a conținutului furnizorilor în baza aplicației. Schimbarea limbii acestei pagini nu modifică preferința de limbă a cabinetului.

Nu au fost adăugate înregistrare publică, conturi noi sau acces anonim la datele comunității. API-urile protejate și zona de administrare își păstrează verificările de sesiune și rol. `npm run test:public` verifică separarea prezentării publice de cabinetul celor trei roluri.

## Autentificare și cele trei conturi

Deschide `/login` și folosește loginul și parola contului. Rolul nu se alege din formular; serverul îl citește din `app_metadata.edumentor_role`, după verificarea utilizatorului prin Supabase `getUser()`.

| Login                         | Rol și acces                                                             |
| ----------------------------- | ------------------------------------------------------------------------ |
| `administrator` (sau `admin`) | Platforma completă și pagina protejată `/admin` cu descrierea rolurilor. |
| `profesor`                    | Curs, mentor AI, activități pedagogice și reflecție.                     |
| `elev`                        | Materialul cursului și nouă exerciții cu soluții, în trei niveluri.      |

Aceste conturi au fost create în Supabase Auth, cu parole aleatoare distincte. Datele de acces se găsesc exclusiv în fișierul local ignorat de Git `.env.demo-users.json`. Identificatorii interni sunt `administrator@edumentor.example`, `profesor@edumentor.example` și `elev@edumentor.example`; domeniul rezervat `.example` este folosit pentru conturi demonstrative, fără trimitere de emailuri. Nu există înregistrare publică în interfață.

Pentru inițializarea celor trei identități într-un proiect configurat, adaugă local `SUPABASE_SECRET_KEY`, apoi rulează `npm run create:demo-users`. Scriptul folosește Admin API, confirmă emailurile demonstrative, atribuie rolurile în metadatele administrative și verifică autentificarea cu parolă. Salvează datele de acces local, fără a afișa parole în terminal. Reluarea nu schimbă parolele și refuză suprascrierea conturilor existente care nu aparțin acestei inițializări.

Autentificarea nu necesită cheia administrativă în runtime. Modulul Trasee folosește însă această cheie exclusiv pe server pentru accesul la Supabase Storage privat. Loginul, deconectarea și verificarea rolurilor folosesc cheia publishable și cookie-urile de sesiune Supabase. `/` redirecționează vizitatorii către `/login`; `/admin` este verificat pe server; API-ul mentorului răspunde 401 fără cont și 403 pentru elevi. Metadatele editabile `user_metadata` nu acordă permisiuni.

Pe Vercel configurează `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY` și opțional `OPENAI_MODEL`, pentru mediile publicate, apoi execută Redeploy. Nu publica fișierele locale cu parole sau cheia administrativă. Parolele conturilor se gestionează în Supabase Authentication; pagina `/admin` nu implementează încă editarea conturilor.

```powershell
npm run test:auth
```

## Conexiune Supabase

### Trasee — consilier de formare

Butonul **Trasee** din meniul profesorului și al administratorului integrează modulul `consilier-formare` furnizat de utilizator. Include căutare după nevoile profesorului, treaptă și disciplină; filtre de calendar, format și credite; trei recomandări principale; comparație între maximum trei cursuri; fișe cu surse și întrebări pentru furnizor; marcarea cursurilor deja urmate. Administratorul are și harta tematică, completitudinea datelor și statistici ale căutărilor. Elevii nu au acces la acest modul sau la API-ul lui. Catalogul și interfața modulului sunt în română; meniul aplicației păstrează etichetele RO/RU.

Catalogul importat conține **124 de oferte și 8 furnizori**, cu informațiile și datele de consultare din fișierul sursă. Acestea nu sunt o reverificare online a disponibilității sau prețurilor. Căutarea folosește dicționarul și clasarea deterministă din modulul original, fără apeluri Gemini/OpenAI. Informațiile lipsă rămân marcate ca nepublicate, iar edițiile încheiate sunt excluse în funcție de calendarul Europe/Bucharest. Pașii de după curs sunt recomandări, nu servicii garantate ale furnizorului.

Datele sunt păstrate în **Supabase Storage privat**, bucket `edumentor-trasee`:

- `catalog/v1.json` — catalogul importat, verificat după încărcare prin SHA-256;
- `users/<user-id>/completed/<course-id>.json` — marcajele personale, persistente după reîncărcare și între dispozitive;
- `searches/` — evenimente cu competențe, treaptă și număr de rezultate; fără textul căutării, ID de utilizator sau IP.

API-ul `/api/trasee/*` verifică fiecare sesiune și rolul pe server. Calea marcajelor este construită din ID-ul contului verificat, nu dintr-un ID primit de la browser. Harta și statisticile sunt rezervate administratorului. Accesul direct la bucket este refuzat pentru vizitatori și pentru conturile aplicației; operațiile autorizate trec prin server, cu cheia privată `SUPABASE_SECRET_KEY`. Nu sunt create politici publice de Storage și nu sunt modificate tabelele PostgreSQL ale aplicației.

Pentru configurarea într-un alt proiect, completează `.env.local`, apoi rulează cu Node.js 22.18+ sau 24:

```powershell
npm run setup:trasee
npm run test:trasee
```

Scriptul creează bucketul privat dacă lipsește și încarcă doar catalogul. Refuză un bucket deja public; nu resetează marcajele sau căutările. Catalogul poate fi păstrat în cache pe proces maximum cinci minute. API-ul are o limită de 40 de solicitări/minut/cont/proces și corpuri de maximum 16 KB; limita nu este distribuită între instanțele Vercel. Harta agregă maximum ultimele 1.000 de evenimente din 90 de zile și menționează că statisticile prototipului includ și căutări de test.

**Vercel:** pentru Trasee trebuie configurată și `SUPABASE_SECRET_KEY`, ca **Secret**, fără prefix `NEXT_PUBLIC_`, apoi publicată o versiune nouă. Cheia nu ajunge în componentele client. Fișierele portate și adaptate sunt în `src/features/trasee/`; stilurile sunt izolate în `src/app/trasee.css`. Folderul sursă din Downloads rămâne o referință, fără dependență la rularea aplicației.

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

`src/proxy.ts` este punctul de intrare Next.js 16 pentru reîmprospătarea sesiunilor. Acesta apelează `updateSession` din `src/utils/supabase/middleware.ts`, care execută `auth.getClaims()`, actualizează cookie-urile cererii și răspunsului și propagă antetele de protecție împotriva cache-ului. Fiecare cerere server primește un client separat. Autorizarea este verificată separat în pagini și în API; proxy-ul singur nu acordă acces.

```powershell
npm run check:supabase
npm run test:supabase
```

`GET /api/health/supabase` verifică efectiv accesul la Supabase Auth cu cheia configurată, inclusiv fără un utilizator autentificat. Un răspuns reușit este `{ "status": "ok", "service": "supabase", "auth": "reachable" }`. Verificarea nu confirmă existența tabelelor sau politicile RLS și nu returnează chei, tokenuri sau identități.

Pentru o verificare Data API fără a citi rânduri, folosește `npm run check:supabase -- numele_tabelului`. Comanda execută o interogare `LIMIT 0`. Tabelul `todos` din exemplul de configurare nu există în proiect la momentul conectării; pagina principală EduMentor nu depinde de el. Nu au fost create tabele ale aplicației sau modificate politici. Înaintea salvării fișelor pe server sunt necesare schema aplicației și politici RLS pentru proprietarul fiecărui rând. Cheile secret și `service_role` nu se folosesc în configurația publică.

Referință: [configurarea SSR Supabase în Next.js](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs).

## Persistență

Preferința de limbă, diagnosticul activat, pașii explorați, starea fișei și reacția demonstrativă sunt păstrate în `localStorage`, cheia `edumentor-demo-v1:<user-id>`, separat pentru fiecare cont. Conversația este temporară și se reia la părăsirea ecranului sau reîncărcare. Răspunsurile OpenAI sunt păstrate în memoria ecranului; următorul apel poate include ultimele patru răspunsuri OpenAI din conversație. Schimbarea limbii afectează răspunsurile noi, fără a traduce retroactiv istoricul. Datele de profil și materialele transmise modelului sunt fictive și pregătite în cod. Dacă stocarea browserului este blocată, aplicația anunță că progresul va fi temporar. „Reia demonstrația” resetează doar acest demo, după confirmare. Nu folosi acest prototip pentru date reale sau sensibile.

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

Acesta este un MVP demonstrativ cu autentificare Supabase, trei roluri și mentor OpenAI. Schema și persistența fișelor în Supabase, gestionarea conturilor din interfață și documentele încărcate sunt etape următoare. Diagnosticul, planul, activitățile, exercițiile și sinteza din fișa de experiență rămân exemple pregătite; doar conversația mentorului generează răspunsuri noi prin OpenAI. Aprobarea fișei nu validează independent eficiența pedagogică. Designul urmează noua referință vizuală: verde petrol `#153F43`, lime `#D5ED8C`, verde pentru acțiuni secundare `#23675C`, fundal `#F4F7F5`, suprafețe `#FFFFFF` și text `#203D3E`. Stilurile comune sunt în `globals.css`, iar tema este în `theme.css`.

Fontul Manrope se încarcă de la Google Fonts; dacă nu există acces la internet se folosește Segoe UI sau Arial. Răspunsurile reale ale mentorului necesită internet și un cont OpenAI cu acces API. Exemplele statice pot fi explorate și când apelul AI nu reușește.

Documentație framework: [instalare Next.js](https://nextjs.org/docs/app/getting-started/installation).

## Expertiză — comunitatea Daily

Meniul **Expertiză** (`/#expertiza`) este disponibil administratorului, profesorului și elevului. Modulul adaptează prototipul din folderul `scolio-vs` furnizat: întrebări și răspunsuri, comunități, director demonstrativ de profesori cu recenzii, informații școlare, mesaje private și profil. Interfața modulului și catalogul sunt în română; eticheta meniului este și în rusă.

Catalogul inițial conține 5 profiluri fictive, 2 întrebări, 5 comunități, 3 școli, 5 reguli și 3 evenimente de exemplu. Regulamentele și calendarul importate nu sunt informații instituționale oficiale. Numerele de membri, aprecierile și statutul de membru simulate în sursă nu sunt importate ca activitate reală. Autentificarea simulată, aprobările automate de documente, răspunsurile automate la mesaje și suprascrierea globală `fetch` din sursă nu sunt incluse.

Execută o singură dată `npm run setup:expertiza` cu configurația privată Supabase deja utilizată de Trasee. Scriptul creează bucketul privat `edumentor-expertiza`, încarcă `catalog/v1.json` și verifică SHA-256 după descărcare. Reexecutarea actualizează exclusiv catalogul și păstrează contribuțiile. Nu există catalog local de rezervă la runtime.

API-ul `/api/expertiza/[...path]` verifică sesiunea cu Supabase Auth înainte de accesarea datelor. Serverul folosește `SUPABASE_SECRET_KEY` (fără `NEXT_PUBLIC_`), iar accesul direct la bucket rămâne închis. Postările, răspunsurile, recenziile, profilurile, aprecierile și înscrierile sunt documente JSON în Supabase Storage. Identitatea și rolul autorului provin din contul verificat, nu din datele cererii. Rolul este preluat exclusiv din `app_metadata.edumentor_role`. Numele, școala și disciplina din profil sunt descriptive și nu acordă permisiuni.

Comunitatea MVP este comună tuturor conturilor EduMentor autentificate. Denumirea instituției nu creează un spațiu privat sau o separare între școli. Înscrierea într-o comunitate permite publicarea întrebărilor și răspunsurilor în ea. Administratorul poate crea comunități și informații, fixa și arhiva întrebări/comunități și restabili elementele arhivate din Profilul meu. Recenziile sunt limitate la una per cont și profesor, actualizată la următoarea salvare. Coroana reflectă minimum 3 răspunsuri proprii din fluxul recent, fără răspunsurile AI sau exemplele importate.

Mesajele circulă exclusiv între conturile reale ale platformei. Serverul construiește cheia conversației din ID-ul sesiunii și ID-ul destinatarului verificat; nu acceptă identitatea expeditorului sau cheia conversației din browser. Nici administratorul nu primește istoricul altor două conturi prin API. Directorul fictiv de profesori nu reprezintă destinatari de mesaje. Nu se simulează mesaje primite sau prezență online. Istoricul conversației deschise se actualizează la 15 secunde când pagina este vizibilă.

Maria AI folosește configurația OpenAI existentă, pe server, numai după apăsarea explicită a butonului de trimitere către AI. Se transmit doar titlul și detaliile întrebării selectate, cu `store: false`, timeout 20 secunde, fără retry automat și maximum 900 tokeni de ieșire. Răspunsul real este salvat în comunitate și etichetat AI. Mesajele private și profilurile nu sunt trimise modelului. Erorile nu sunt înlocuite cu răspunsuri fictive. Referință: [OpenAI Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses).

Acesta este un MVP pentru exemple: fluxul citește cele mai recente 200 de documente per categorie, 100 de mesaje per conversație, până la 1.000 de profiluri/conturi, aprecieri și înscrieri. Limitele de cereri (100/minut/cont, 5 apeluri Maria/10 minute/cont și 2 apeluri AI simultane) sunt în memoria procesului, fără cotă distribuită între instanțe Vercel. Pentru volum mai mare sunt necesare tabele cu RLS, paginare și limitare distribuită. Parolele și cheile private nu sunt în Git sau în bundle-ul public.
