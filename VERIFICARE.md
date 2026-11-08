# Verificare locală

Data: 8 noiembrie 2026. Verificările au rulat pe buildul de producție, la `http://127.0.0.1:3000`, cu Chromium automatizat prin Playwright.

Acest document păstrează verificările etapelor succesive. Afirmațiile despre accesul fără cont din etapele inițiale au fost înlocuite de autentificarea și cele trei roluri descrise la final.

- `npm run typecheck` — trecut.
- `npm run build` — trecut.
- 15 verificări ale fluxului — trecute: diagnostic exemplu, conversații simulate, referințe la material, exerciții, selectarea activității, salvare, aprobare, copiere, progres, reîncărcare, resetare și recuperarea stocării invalide sau indisponibile.
- Cele nouă soluții matematice — verificate independent prin substituție.
- 50 de combinații responsive — cinci ecrane, două limbi și lățimi de 320, 390, 768, 1024 și 1440 px; fără derulare orizontală.
- Zero erori JavaScript detectate în parcurgerea verificată și zero apeluri către AI sau rute API.
- Verificare axe-core pentru regulile WCAG 2 A/AA, 2.1 AA și 2.2 AA — zero încălcări detectate pe stările inițiale ale celor cinci ecrane, la 1440 px, în română. Aceasta este o verificare automată limitată, nu o certificare completă de accesibilitate.
- Navigarea de la tastatură include legătura de salt la conținut și controale native.

QA a folosit instrumentele locale de automatizare; acestea nu sunt dependențe ale aplicației. Prototipul nu a fost testat cu profesori reali și nu furnizează dovezi de impact pedagogic. Interfața de autentificare, schema aplicației și salvarea fișelor pe server nu fac parte din această versiune demonstrativă. Conversația OpenAI este verificată separat mai jos; activitățile și fișele rămân exemple pregătite.

## Integrare Supabase

- `@supabase/supabase-js` 2.119.0 și `@supabase/ssr` 0.12.7 — instalate cu versiuni exacte.
- Configurație locală cu URL și cheie publishable; fișierul `.env.local` este exclus din Git.
- `npm run test:supabase` — 8 teste trecute. Sunt acoperite izolarea clienților server între cereri, scrierea cookie-urilor, reîmprospătarea prin `getClaims`, propagarea tokenului către componentele server și browser, păstrarea antetelor de cache între loturi de cookie-uri, cereri fără sesiune și răspunsuri 503 fără expunerea detaliilor interne.
- `npm run check:supabase` — Supabase Auth a răspuns HTTP 200 și a acceptat cheia proiectului configurat.
- Interogare reală, numai pentru verificare: `public.todos`, `SELECT id LIMIT 0` — răspuns 404, cod `PGRST205`; tabelul din exemplul generic nu există. Nu au fost descărcate sau modificate rânduri.
- `npm run typecheck` și `npm run build` — trecute cu proxy-ul și ruta de sănătate incluse.
- Aplicația pornită: `/` — HTTP 200; `/api/health/supabase` — HTTP 200, `auth: reachable` și `Cache-Control: no-store, private`.
- După integrare au fost reluate cu succes cele 15 verificări funcționale și cele 50 de combinații responsive ale demonstrației.

Reîmprospătarea cookie-urilor a fost verificată cu SDK simulat la limita de test; nu a fost creat un cont și nu a fost testat un flux complet de login cu sesiune reală. Datele demonstrative continuă să folosească stocarea locală. Verificarea Auth nu certifică schema, politicile RLS sau autorizarea viitoarelor date ale profesorilor.

## Mentor OpenAI

- SDK oficial `openai` 7.53.0 și modul `server-only` instalate cu versiuni exacte. Model configurat: `gpt-5.4-mini`.
- Verificarea cheii prin API-ul modelelor — HTTP 200. Primul apel real de generare — răspuns finalizat.
- `npm run test:mentor` — 12 teste trecute: întrebări și limbi permise, istoric limitat, referințe existente, contextul modelului, absența cheii, răspuns incomplet, JSON invalid, refuz, erori de cotă/conexiune, limite de cereri și concurență, originea browserului și antete de cache.
- `npm run test:supabase` — cele 8 teste au rămas trecute.
- `npm run typecheck` și `npm run build` — trecute; buildul include `POST /api/mentor/chat` și proxy-ul de sesiuni.
- Verificare reală în browser — două generări HTTP 200, în română și rusă, cu afișarea textului exact primit și cu transmiterea contextului conversației la a doua întrebare. Referințele au deschis materialul cursului.
- Răspunsurile generate au încăput fără derulare orizontală la 320, 390, 768, 1024 și 1440 px, în ambele limbi.
- Cu răspunsuri de eroare simulate la limita de rețea, interfața a afișat eroarea și a folosit exemplul static numai după alegerea explicită. Resetarea a anulat cererea și a ignorat răspunsul întârziat.
- Zero erori JavaScript detectate; browserul a apelat ruta locală, fără apel direct la OpenAI și fără cheie în payload-uri.
- Cheia reală nu a fost găsită în niciun fișier public generat din `.next/static`. `.env.local` rămâne ignorat de Git.
- Verificarea automată axe-core a ecranului mentorului a raportat zero încălcări pentru regulile WCAG selectate. Aceasta nu înlocuiește o evaluare completă de accesibilitate.

Testele automate ale erorilor folosesc SDK simulat și nu generează costuri API. Verificările reale menționate separat au apelat contul OpenAI configurat. Nu s-a implementat generare AI pentru celelalte exemple sau persistență a conversației în Supabase.

## Actualizare design după referință

- Paletă verde petrol și lime, meniu lateral închis, antet alb, carduri compacte și o pagină de prezentare cu ilustrație orbitală a mentorului.
- Stilul a fost aplicat celor cinci ecrane, cu texte în română și rusă. Cardurile prezentării deschid secțiunile existente, iar progresul reflectă activitățile salvate local.
- `npm run typecheck` și `npm run build` — trecute.
- 50 de combinații responsive — cinci ecrane, două limbi, la 320, 390, 768, 1024 și 1440 px; fără derulare orizontală și fără erori JavaScript în parcurgerea verificată.
- Verificate navigarea din carduri, diagnosticul, continuarea parcursului, alegerea activității, salvarea și aprobarea fișei, precum și păstrarea progresului după reîncărcare.
- După ajustarea contrastului, axe-core a raportat zero încălcări pentru regulile WCAG selectate pe cele cinci ecrane inițiale, în română, la 1440 px. Verificarea automată nu reprezintă o certificare completă de accesibilitate.
- Răspunsurile mentorului au fost simulate la limita de rețea în verificarea designului; nu au fost efectuate generări OpenAI suplimentare.

## Autentificare și trei roluri

- Create efectiv în proiectul Supabase configurat: `administrator`, `profesor`, `elev`, cu parole aleatoare distincte, emailuri demonstrative confirmate și roluri în `app_metadata.edumentor_role`. Autentificarea cu parolă a fost verificată pentru fiecare cont.
- `.env.local` și `.env.demo-users.json` sunt ignorate de Git. Cheia administrativă este utilizată numai de scriptul local de inițializare. Aplicația nu importă acest script și nu necesită cheia administrativă pe Vercel.
- `/login` folosește Server Actions și Supabase Auth. Nu există selector de rol sau parole în interfața publică. Rolurile sunt verificate cu `getUser()`, din metadatele administrative; metadatele editabile ale utilizatorului nu acordă acces.
- Vizitatorul este redirecționat din `/` către `/login`. `/admin` este disponibil doar administratorului. API-ul mentorului refuză vizitatorii cu 401 și elevii cu 403, înainte de apelarea OpenAI.
- Elevul vede propriul spațiu, materialul de curs și cele nouă exerciții cu soluții. Încercarea de a deschide `#mentor` revine la prezentarea elevului. Profesorul păstrează fluxul pedagogic existent.
- Autentificare reală în browser pentru toate cele trei conturi, sesiune păstrată după reîncărcare, verificarea accesului la `/admin`, deconectare și refuzul cererilor ulterioare fără sesiune — trecute. Parola incorectă a afișat un mesaj generic.
- 108 combinații responsive — ecranul de login și ecranele disponibile celor trei roluri, în română și rusă, la 320, 390, 768 și 1440 px; fără derulare orizontală. Zero erori JavaScript și zero răspunsuri HTTP 500 în parcurgerea verificată.
- axe-core: zero încălcări detectate pentru regulile WCAG selectate pe login și pe pagina inițială a fiecăruia dintre cele trei roluri, în română, la 1440 px. Verificarea automată nu reprezintă o certificare completă.
- `npm run test:auth` — 5 teste; `npm run test:mentor` — 13 teste; `npm run test:supabase` — 8 teste; toate trecute. Sunt verificate rolurile, refuzul sesiunilor invalide/revocate, imposibilitatea escaladării prin `user_metadata`, loginul și tratarea erorilor la logout.
- `npm run typecheck` și `npm run build` — trecute. Progresul demonstrativ folosește cheia locală `edumentor-demo-v1:<user-id>`; fișele nu sunt încă persistate în Supabase.

Verificarea autentificării nu a generat răspunsuri OpenAI suplimentare. Pagina de administrare descrie rolurile și nu implementează editarea conturilor. Pentru publicarea pe Vercel trebuie publicat codul actual și configurate variabilele de mediu ale aplicației; conturile sunt deja în Supabase.

## Trasee — integrarea consilierului de formare

- Importate și adaptate componentele, dicționarul și clasarea din folderul `consilier-formare` furnizat. Meniul include **Trasee** pentru profesor și administrator; elevul nu are acces.
- Catalogul cu 124 de cursuri și 8 furnizori este încărcat efectiv în bucketul privat Supabase Storage `edumentor-trasee`, la `catalog/v1.json`. Descărcarea ulterioară a coincis cu fișierul încărcat prin verificare SHA-256. Nu este folosit un catalog local de rezervă în runtime.
- Accesul direct la catalog a fost refuzat atât fără sesiune, cât și cu sesiunea reală a elevului. Cheia secretă este utilizată exclusiv de server și scriptul local. Nu au fost create politici publice sau schimbate tabelele aplicației.
- Verificat în browser, cu Supabase real: căutarea STEAM, fișa cursului, comparația a două cursuri, marcarea unui curs deja urmat, păstrarea marcajului după reîncărcare și anularea lui. Marcajul nu a apărut în contul administratorului. Un `userId` străin în query nu a schimbat proprietarul datelor returnate.
- API-ul a returnat 401 pentru vizitatori, 403 pentru elev și 403 pentru profesor la harta coordonatorilor. Administratorul a încărcat harta reală, completitudinea furnizorilor și simularea listelor complete.
- Căutările au fost jurnalizate cu competențe, treaptă și număr de rezultate, fără textul introdus, ID de utilizator sau IP. Recomandările sunt calculate cu dicționarul original, fără generări AI suplimentare. Statisticile arată explicit limita de 1.000 de evenimente în 90 de zile și includ căutările de verificare.
- `npm run test:trasee` — 14 teste trecute, inclusiv cele 7 verificări originale ale clasării, validarea inputurilor, refuzul URL-urilor nesigure, proprietatea marcajelor, rolurile, cererile din altă origine și erorile Storage. Cele 26 de teste pentru autentificare, mentor și sesiuni au rămas trecute; total 40.
- `npm run typecheck` și `npm run build` — trecute; buildul include `/api/trasee/[...path]`.
- 25 de combinații responsive — căutare, rezultate, fișă, comparație și coordonatori la 320, 390, 768, 1024 și 1440 px, fără derulare orizontală. Zero erori JavaScript sau răspunsuri HTTP 500/503 în fluxul verificat.
- axe-core a raportat zero încălcări pentru regulile WCAG selectate pe căutare, rezultate, fișă și comparație; după corectarea contrastului și a barelor de progres, și pe pagina coordonatorilor. Verificarea coordonatorilor a fost reluată pe buildul final, inclusiv la cele cinci lățimi. Nu reprezintă o certificare completă de accesibilitate.

Pentru **Trasee pe Vercel**, este necesară acum și variabila privată `SUPABASE_SECRET_KEY`, pe lângă configurația Supabase publică și OpenAI deja documentată. Codul nou trebuie publicat și trebuie executat Redeploy. Conținutul catalogului și interfața modulului importat sunt în română; eticheta de meniu rămâne bilingvă. Sursele, datele de consultare și informațiile lipsă sunt cele din fișierul furnizat, fără reverificarea online a fiecărui curs.

## Expertiză — integrarea prototipului Daily

- Importate datele demonstrative din `scolio-vs` și adaptată interfața în React, în tema EduMentor. Meniul Expertiză este disponibil celor trei roluri existente. Nu sunt executate scripturile de autentificare simulată sau de interceptare `fetch` din sursă.
- Creat și verificat efectiv bucketul privat Supabase Storage `edumentor-expertiza`. Catalogul include 5 profesori fictivi, 5 comunități, 2 întrebări, 3 școli, 5 reguli și 3 evenimente. SHA-256 după descărcare a coincis cu fișierul încărcat. Accesul direct a fost refuzat atât fără sesiune, cât și pentru contul real al elevului.
- Autentificare reală pentru elev, profesor și administrator; toate au încărcat catalogul prin API-ul protejat. Publicată o întrebare de verificare din contul elevului, răspuns din contul profesorului, apreciere idempotentă, înscriere în comunitate și recenzie actualizată. Datele au fost păstrate după reîncărcare, fără duplicarea recenziei sau transmiterea înscrierii către alt cont.
- Profesorul a primit 403 la crearea unei comunități. Administratorul a creat comunitatea demonstrativă „Atelier de exemple EduMentor”, a fixat-o, arhivat-o și restabilit-o și a publicat „Bun venit în Expertiză”. Întrebarea de verificare a fost arhivată și poate fi restabilită din Profilul meu al administratorului.
- Verificate mesaje reale între conturile demonstrative elev–profesor, în ambele sensuri, inclusiv trimitere și afișare prin formular. Administratorul nu a primit conversația lor când s-au transmis parametri străini în URL. Nu există mesaje primite fabricate. Mesajele demonstrative de verificare rămân în conversația celor două conturi.
- Apel real Maria prin interfață: titlul și detaliile întrebării demonstrative au fost transmise către OpenAI, iar răspunsul efectiv a fost salvat în Supabase și afișat cu eticheta AI. Întrebarea a fost apoi arhivată. Apelul nu a inclus profiluri sau mesaje private.
- 7 teste automate Expertiză trecute: validare, refuzul căilor nesigure și al cererilor din altă origine, roluri administrative, apartenență la comunitate, proprietatea profilului/răspunsului/mesajelor din sesiune, tratarea erorilor și parametrii limitați ai apelului OpenAI. Cele 40 de teste existente au rămas trecute: total 47.
- Buildul de producție a trecut, inclusiv TypeScript și ruta `/api/expertiza/[...path]`.
- 30 de combinații responsive pentru cele 6 secțiuni la 320, 390, 768, 1024 și 1440 px, fără derulare orizontală sau erori JavaScript. După corectarea rolului ARIA al istoricului mesajelor, pagina Mesaje a fost verificată din nou la cele 5 lățimi.
- axe-core: zero încălcări pentru regulile WCAG selectate pe Întrebări, Comunități, Profesori, Informații și Profilul meu; verificarea Mesaje a trecut după corecție. Nu reprezintă o certificare completă de accesibilitate.

Persistența acestui MVP folosește documente JSON în Storage privat, cu permisiuni aplicate de API; nu au fost deschise politici publice sau create tabele SQL. Comunitatea este comună conturilor autentificate; instituția din profil este descriptivă. Fluxul și istoricul au limitele documentate în README. Configurația Supabase privată și OpenAI există pentru production/preview în proiectul Vercel EduMentor; noul modul nu necesită variabile suplimentare.
