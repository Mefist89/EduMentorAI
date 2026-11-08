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

0. **ЭдуМост · Catalog** — primul buton din meniu, disponibil tuturor rolurilor la `/#puntea`. Cele 49 de fișe includ cursuri, concursuri, granturi, evenimente, resurse, comunități, mentorat, proiecte și activități. Caută fără diacritice, combină categoria și publicul și ascunde edițiile încheiate. Linkurile și referințele se deschid la furnizor, într-o filă nouă.
1. **Prezentare** — banner introductiv, resurse demonstrative și traseu cu progres real al interacțiunilor din demonstrație.
2. **Cursul meu** — material demonstrativ în trei secțiuni și trei răspunsuri de diagnostic pregătite. Apasă „Folosește acest exemplu”.
3. **AI Mentor** — alege întrebările pregătite pentru răspunsuri reale OpenAI. Mentorul primește materialul cursului și contextul demonstrativ. Referințele afișate deschid materialul cursului. Dacă serviciul nu răspunde, poți reîncerca sau alege explicit un răspuns static, etichetat drept exemplu.
4. **Activități** — compară varianta cu AI și cea fără AI; alege o activitate exemplu. Explorează trei niveluri a câte trei exerciții și soluțiile verificate prin substituție.
5. **Experiența mea** — citește reflecția fictivă, afișează sinteza exemplu, salvează și aprobă fișa. Revino la ciornă sau copiază textul dacă dorești.
6. **RO / RU** — schimbă limba interfeței, a materialelor și a exemplelor.

Accesul la cabinet necesită un cont Supabase cu rol EduMentor. Pagina informativă și linkurile către resurse externe sunt publice. Materialul cursului și fișa din «Experiența mea» rămân exemple demonstrative în browser. Modulul separat «Practici pedagogice» salvează contribuțiile reale în Supabase și le publică numai după aprobare.

## Cohorte / grupuri de învățare

Modulul `/#cohorts` este separat de comunitățile Expertiză. Profesorul creează o cohortă cu nume, disciplină, clasă și descriere, selectează conturi existente de elev și vede componența. Poate modifica datele grupului și elimina un elev din grup fără a-i șterge contul. Numele grupului este obligatoriu; nu se creează conturi sau parole din acest modul. Un elev poate aparține mai multor grupuri; în același grup apare o singură dată. Limita MVP este de 100 de elevi per cohortă.

Profesorul gestionează numai grupurile pentru care `teacherId` este propriul ID Supabase verificat; administratorul vede și gestionează toate grupurile. Elevul vede numai grupurile în care este înscris, metadatele și profesorul responsabil, fără catalogul elevilor sau lista altor membri. Catalogul de selecție include numai conturi cu rolul administrativ `app_metadata.edumentor_role = elev`, verificat din nou la adăugare. Numele editabil din profil este folosit doar pentru afișare, niciodată pentru autorizare. API-ul nu trimite emailuri, parole, tokenuri sau metadatele Auth; numai conturile demonstrative folosesc aliasul de login din domeniul rezervat `.example`.

Inițializare în proiectul Supabase configurat: `npm run setup:cohorts`. Scriptul creează/verifică bucketul privat `edumentor-cohorts`, fără grupuri sau conturi demonstrative suplimentare. Datele sunt documente JSON private, cu legătura `teacherId → studentIds`, salvate ca revizii imuabile `groups/<UUID>/<versiune>.json`. API-ul `/api/cohorts` verifică sesiunea, rolul, proprietarul, tipul conturilor selectate și versiunea, iar scrierea fără upsert previne suprascrierea schimbărilor concurente. Un conflict HTTP 409 cere reîncărcarea versiunii curente. Nu există acces direct la Storage din browser; cheia administrativă existentă rămâne pe server, fără o variabilă nouă pe Vercel.

`npm run test:cohorts` verifică proprietarul, rolurile, izolarea între grupuri, limitele, duplicatele, conturile eligibile, catalogul fără metadate private, modificările concurente și API-ul din spatele proxy-ului. Stocarea este potrivită unui MVP cu volum mic: pentru multe grupuri, sunt necesare tabele SQL indexate și paginare pe server. Nu sunt implementate invitații prin email, atribuirea lecțiilor, transferul grupului către alt profesor sau ștergerea grupurilor. Referințe: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Admin listUsers](https://supabase.com/docs/reference/javascript/auth-admin-listusers).

## Publicarea și moderarea practicilor

Deschide `/#practices` din meniul «Practici pedagogice» / «Практики». Toate rolurile autentificate pot citi și căuta biblioteca aprobată. Profesorii și administratorii au «Adaugă practică» și «Practicile mele»; numai administratorul vede «Moderare» și poate aproba sau respinge o propunere.

1. Autorul completează titlul și salvează ciorna. Pentru trimitere sunt necesare și disciplina, nivelul/clasa, descrierea, problema pedagogică și metodele. Contextul, resursele și un link HTTPS sunt opționale; limba conținutului poate fi RO sau RU.
2. În «Practicile mele», trimite versiunea salvată spre aprobare. Ciornele și propunerile în verificare nu apar în biblioteca celorlalți utilizatori. Versiunea trimisă nu poate fi modificată cât timp este verificată.
3. Administratorul citește practica și o aprobă pentru publicare sau o respinge cu motiv obligatoriu. Autorul vede observația, istoricul și starea. Poate edita o practică respinsă, salva o ciornă nouă și retrimite. Practicile deja publicate sunt numai pentru citire în acest MVP.

Inițializare: configurează cheia privată existentă `SUPABASE_SECRET_KEY` numai pe server și rulează `npm run setup:practices`. Scriptul creează/verifică bucketul privat `edumentor-practices`, fără a publica exemple. Nu este necesară o variabilă nouă pe Vercel. API-ul `/api/practices` verifică sesiunea Supabase prin `getUser()` și rolul din `app_metadata`, proprietarul, starea și versiunea; nu acceptă autor sau statut furnizat de client. Accesul direct la obiecte din browser rămâne interzis, inclusiv autorului; serverul returnează doar datele permise.

Conținutul și istoricul deciziilor sunt documente JSON private în Supabase Storage, nu tabele SQL noi. Fiecare operație scrie o revizie imuabilă `entries/<UUID>/<versiune>.json`, cu `upsert: false`; două operații pe aceeași versiune nu se pot suprascrie. Un conflict răspunde HTTP 409 și cere reîncărcarea versiunii actuale. Biblioteca elimină observațiile și istoricul de moderare din răspunsul pentru cititori. Datele sunt citite fără cache și listele sunt paginate intern; lectura fiecărei ultime revizii este potrivită unui MVP cu volum mic. Pentru un catalog mare se recomandă un repository SQL indexat și paginare pe server. Limita unei practici este 250 de operații în acest MVP. Nu sunt implementate atașamente, ștergere, retragerea publicației sau notificări prin email.

`npm run test:practices` verifică validarea, drepturile, tranzițiile, izolarea datelor, conflictele concurente și limita HTTP. Instrucțiuni și verificări Supabase Storage: [Access control](https://supabase.com/docs/guides/storage/security/access-control).

## Pagina publică

Vizitatorii fără sesiune văd la `/` pagina de prezentare EduMentor, în română și rusă. Conturile autentificate păstrează cabinetul și adresele existente `/#mentor`, `/#trasee`, `/#expertiza` etc. Pagina `/despre` poate fi vizitată de oricine, inclusiv de utilizatorii conectați, prin linkul „Despre platformă” din subsolul cabinetului. Formularul de login include un link de întoarcere la pagina publică.

Pagina prezintă cele șase direcții existente ale platformei, parcursul de învățare și rolurile profesor/elev/administrator. Exemplele demonstrative sunt identificate explicit. Resursele MEC, EduResurse, Educație Online, ANCE, INEL și eTwinning sunt linkuri către furnizori, disponibile fără cont EduMentor. Paginile au fost consultate la 8 noiembrie 2026; nu există sincronizare automată sau copiere a conținutului furnizorilor în baza aplicației. Schimbarea limbii acestei pagini nu modifică preferința de limbă a cabinetului.

Nu au fost adăugate înregistrare publică, conturi noi sau acces anonim la datele comunității. API-urile protejate și zona de administrare își păstrează verificările de sesiune și rol. `npm run test:public` verifică separarea prezentării publice de cabinetul celor trei roluri.

## Meniu: Continuitate și Investigație

Pentru profesor și administrator, meniul principal are cinci puncte: ЭдуМост, Expertiză, **Continuitate**, Trasee, **Investigație**. Investigație se deschide/închide ca submeniu și oferă și o pagină cu acces rapid la secțiuni, în ordinea: Prezentare, Practici pedagogice, Cursul meu, Activități, Cohorte, AI Mentor, Experiența mea. Adresele existente `/#dashboard`, `/#practices`, `/#course`, `/#activities`, `/#cohorts`, `/#mentor` și `/#experience` se păstrează; deschiderea unei secțiuni extinde automat submeniul.

`/#continuitate` arată progresul demonstrativ existent al contului în browser și următoarea etapă neparcursă. Butonul de continuare deschide cursul, activitatea sau reflecția, în funcție de cele trei etape. După finalizare sunt disponibile revenirea la reflecție și repetarea etapelor, fără resetare automată. Nu introduce o stocare separată și nu înlocuiește progresul din paginile existente.

Elevul are numai secțiunile permise rolului său: Prezentare, Practici, Curs, Exerciții și Cohorte în Investigație. Continuitate îi oferă acces la curs și exerciții, fără progresul celor trei etape specifice profesorului. Trasee, AI Mentor și Experiența mea își păstrează restricțiile existente. Pe mobil submeniul se afișează sub butoanele principale, fără suprapunerea lor. Denumirile Continuitate și Investigație sunt păstrate în ambele limbi, iar descrierile și conținutul sunt RO/RU.

## Catalogul ЭдуМост

Datele provin din fișierele `frontend/src/puntea/catalog.mjs` și `resources.mjs` ale proiectului Edumentor furnizat. Au fost extrase ca date, fără executarea scripturilor proiectului-sursă. Snapshotul normalizat este `src/features/puntea/catalog.json`: 49 de ID-uri unice, 9 categorii și 14 referințe suplimentare. Au fost completate categoriile lipsă pentru 12 fișe și transformate referințele în perechi etichetă–URL. Fișierele din Downloads nu sunt modificate.

Interfața și cele 49 de fișe folosesc limba RO/RU a cabinetului. Snapshotul original în română rămâne în `catalog.json`; traducerile rusești sunt în `catalog.ru.json`, pe aceleași ID-uri, inclusiv titluri, organizatori, descrieri, eligibilitate, perioade, costuri, pași următori și cele 14 etichete de referință. Linkurile, datele și metadatele originale se păstrează. Denumirile proprii pot rămâne în limba originală; site-urile externe nu sunt traduse de aplicație. Căutarea combină termenii cu AND, ignoră diacriticele (inclusiv diferența е/ё) și caută în ambele limbi, indiferent de limba interfeței. Sunt incluse titlul, organizatorul, rezumatul, eligibilitatea, pașii următori, cuvintele-cheie și denumirile categoriilor/publicului. Toate fișele sunt afișate inițial; filtrele sunt temporare și pot fi resetate. Traducerea este statică, fără apeluri AI la afișare.

Termenele sunt comparate cu ziua calendaristică Europe/Bucharest, inclusiv la schimbarea zilei cât timp pagina rămâne deschisă. Data-limită de înscriere are prioritate față de o dată ulterioară a evenimentului. Nu se presupune ora-limită și nu se afirmă că un apel este deschis doar pentru că data nu a trecut. Contradicția din fișa Școlii de Toamnă eTwinning este marcată separat. Datele de consultare 7–8 noiembrie 2026 sunt cele declarate în sursă; cele 49 de oferte nu au fost reverificate online la import și nu se sincronizează automat.

Catalogul este o colecție statică de informații și linkuri, încărcată numai la deschiderea modulului. Nu creează înscrieri, nu înlocuiește Trasee și nu introduce date personale sau stocare Supabase nouă. `npm run test:puntea` verifică datele, categoriile, referințele, filtrele, datele calendaristice și ordinea meniului.

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
