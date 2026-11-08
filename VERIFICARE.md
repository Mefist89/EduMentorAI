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

## Pagina publică și navigarea

- Adăugată pagina publică `/despre`, disponibilă fără cont, în română și rusă: descrierea platformei, șase module existente, parcursul de învățare, cele trei roluri și șase resurse externe. Linkurile MEC, EduResurse, Educație Online, ANCE, INEL și eTwinning au fost consultate la 8 noiembrie 2026. Nu sunt importate conturi sau date din versiunea `Downloads/Edumentor`.
- `/` prezintă pagina publică vizitatorilor și păstrează cabinetul pentru conturile verificate. Loginul include întoarcerea la pagina publică, iar cabinetul include linkul „Despre platformă”. Adresele existente cu hash rămân disponibile utilizatorilor conectați.
- Verificate în browser: accesul la `/despre` dintr-un cont conectat, intrarea în cabinet prin butonul public fără solicitarea repetată a parolei, logout, revenirea din login la pagina publică, deschiderea rădăcinii fără cont și autentificarea reală înapoi în cabinetul administratorului.
- Cerere HTTP fără cookie: `/` răspunde cu 200 și pagina publică; `/api/expertiza/state` continuă să răspundă cu 401. Nu au fost schimbate permisiunile API sau rolurile.
- 26 de variante responsive, RO/RU la 320, 360, 390, 520, 620, 640, 768, 820, 850, 900, 1024, 1280 și 1440 px. După limitarea desenului decorativ la propriul container: fără derulare orizontală, suprapuneri în antet sau text care depășește containerul în verificările efectuate.
- Verificarea calculată a contrastului pentru 98 de elemente de text ale paginii în rusă a trecut pragurile selectate. Desenul decorativ și fundalurile cu gradient au fost excluse; nu este o evaluare completă de accesibilitate.
- `npm run test:public` — două teste de separare public/cabinet, inclusiv cele trei roluri; împreună cu cele 47 existente, total 49 teste trecute. Buildul de producție și verificarea TypeScript au trecut.
- Corectată navigarea laterală: o coloană peste 640 px și patru coloane numai în meniul mobil. Regulile care modificau meniul global din modulele Expertiză, Trasee și stilurile elevului au fost înlăturate. Verificate anterior 26 de variante RO/RU, fără suprapunerea butoanelor.

## Puntea Edu · Catalog

- Adăugat primul buton al meniului pentru administrator, profesor și elev, cu adresă directă `/#puntea`; prezentarea rămâne disponibilă la adresa existentă. Modulul se încarcă separat, la deschidere.
- Importate toate cele 49 de fișe din proiectul Edumentor furnizat. Snapshotul conține 9 categorii și 14 perechi de referințe. Cele 12 categorii lipsă au fost completate fără a pierde cardurile originale. Nu a fost executată autentificarea sau logica serverului din sursă.
- În browser: 49 de fișe inițial; 5 cursuri/formări; 4 după ascunderea edițiilor încheiate; filtrul finanțări combinat cu publicul profesori a afișat starea fără rezultate. Resetarea a restabilit cele 49 de fișe. Căutarea „PHET fizică” a găsit fișa PhET. Referința Busola a afișat eticheta „Curriculum oficial MEC” și URL-ul complet corect. Cele două termene de înscriere anterioare datei de 8 noiembrie 2026 au fost marcate încheiate.
- Autentificare reală în browser pentru elev, profesor și administrator: primul punct al meniului este Puntea Edu · Catalog, toate cele 49 de fișe sunt accesibile, iar ecranul conține un singur titlu principal. Elevul a păstrat accesul după reîncărcarea directă la `/#puntea`.
- 26 de variante responsive, RO/RU la 320, 360, 390, 520, 640, 642, 768, 820, 850, 900, 1024, 1440 și 1600 px: fără derulare orizontală, suprapuneri ale butoanelor meniului sau text care depășește containerele în verificările efectuate.
- 6 teste Puntea trecute: cele 49 de identități, categorii utilizabile și referințe normalizate; refuzul URL-urilor nesigure și al datelor invalide; căutare și filtre combinate; date expirate, evenimente și contradicții; calendarul București iarna/vara; primul punct al meniului. Împreună cu cele 49 existente: total 55 teste trecute. Buildul de producție și TypeScript au trecut.

Datele sunt un snapshot informativ al fișierelor furnizate, nu confirmări în timp real ale înscrierilor. Conținutul sursei este în română, interfața de navigare și filtrare este bilingvă. Nu au fost necesare variabile de mediu sau politici Supabase suplimentare.

### Traducerea rusă a catalogului

- Adăugate traduceri pentru toate cele 49 de fișe în `catalog.ru.json`, inclusiv câmpurile opționale prezente în sursă și cele 14 etichete de referință. La alegerea RU se schimbă și titlul din meniu/antet în «Puntea Edu · Каталог», textele cardurilor și atributele `lang`. Versiunea RO folosește obiectele originale, fără modificări.
- Traducerile sunt validate la încărcare: aceleași ID-uri, toate câmpurile existente traduse, fără câmpuri suplimentare care ar putea înlocui URL-uri ori date. Cardinalitatea referințelor este păstrată, iar URL-urile sunt preluate exclusiv din sursă.
- Trei teste noi acoperă integritatea celor 49 de traduceri, păstrarea metadatelor, a numerelor factuale și a linkurilor, refuzul traducerilor incomplete sau al înlocuirii metadatelor, căutarea rusă/mixtă și filtrele. Căutările «PhET ФИЗИКА», «биология экосистемы», «школьных грантов» și «брюссельское» găsesc fișele corespunzătoare; «КИШИНЕВ» și «кишинёв» au rezultate identice. Filtrul de termene încheiate continuă să funcționeze.
- Traducerea nu schimbă condițiile sursei, nu actualizează termenele și nu traduce paginile externe. Nu sunt necesare schimbări Supabase, variabile de mediu sau apeluri AI.
- În browser: 49 de carduri și 49 de titluri/rezumate cu `lang="ru"`; căutarea «PhET физика» a găsit un singur card. Referința tradusă «Официальные учебные программы MEC» a păstrat URL-ul sursei. Trecerea pe RO a restabilit titlul original «Busola Curriculară», apoi RU a restabilit traducerea. La 320, 642 și 1440 px nu au existat carduri care depășesc lățimea sau derulare orizontală. Total: 75 de teste trecute și build de producție reușit.

## Publicarea și moderarea practicilor

- Adăugat modulul `/#practices`, cu interfață RO/RU și încărcare separată. Biblioteca aprobată este disponibilă tuturor rolurilor; profesorul și administratorul pot crea ciorne și urmări propriile practici. Numai administratorul poate modera. Puntea Edu rămâne primul punct al meniului.
- Creat și verificat bucketul privat `edumentor-practices` în proiectul Supabase configurat. Nu au fost create tabele SQL sau politici de acces public. Reviziile sunt imuabile; o versiune deja salvată nu se suprascrie.
- Scenariu real în browser și Supabase: profesorul a creat o practică QA temporară, a trimis-o, administratorul a respins-o cu observație, profesorul a citit motivul, a corectat și retrimis-o, iar administratorul a aprobat-o. Rezultatul: șase revizii și șase evenimente de audit. În timpul verificării nu există buton de editare; respingerea fără motiv este blocată.
- Elevul a văzut publicația aprobată, fără butoane de creare/moderare sau istoric privat. Înainte de aprobare publicația nu era vizibilă. Verificat și prin API: HTTP 401 fără sesiune, 403 pentru aprobarea de către profesor, 403 pentru creare de către elev și modificarea contribuției altui autor, 409 pentru versiuni vechi. Răspunsurile sunt `private, no-store`.
- Descărcarea directă a obiectului privat a fost refuzată de Supabase pentru cheia publică anonimă, sesiunea profesorului și sesiunea elevului. Cheia administrativă rămâne exclusiv pe server.
- 8 teste noi: validare și câmpuri de autor falsificate; ciclul respingere/corectare/aprobare; roluri și proprietar; stări/versiuni/conținut incomplet; izolarea datelor; comenzi nesigure; două decizii concurente pe aceeași revizie; autentificare, origine publică în spatele proxy-ului și limita corpului HTTP. Total: 63 de teste trecute, TypeScript și build de producție reușite.
- Formularul și meniul au fost verificate în RO/RU la 320, 640, 642, 820 și 1440 px. Ajustat antetul pentru a trece pe o coloană sub 850 px; fără suprapuneri ale meniului sau derulare orizontală în verificările efectuate.

Limite MVP: practica publicată rămâne numai pentru citire, fără atașamente, ștergere sau notificări email; maximum 250 de operații per practică. Biblioteca este a comunității autentificate, nu o pagină anonimă. Pentru volume mari, lectura documentelor Storage trebuie înlocuită cu un repository SQL indexat. Înregistrarea QA se elimină după verificarea publicării, fără modificarea contribuțiilor utilizatorilor.

## Cohorte / grupuri de învățare

- Adăugat `/#cohorts` în meniul tuturor rolurilor, păstrând Puntea Edu primul. Interfață RO/RU, formular de creare/editare, selectarea elevilor existenți, componență și eliminarea înscrierii fără ștergerea contului. Modulul se încarcă separat și nu modifică comunitățile Expertiză.
- Inițializat și citit cu succes bucketul privat Supabase `edumentor-cohorts`; relația dintre ID-ul profesorului și ID-urile elevilor este salvată în documente JSON cu versiuni imuabile. Nu au fost create tabele SQL sau politici publice. Nu sunt necesare variabile de mediu noi.
- Scenariu real în browser: profesorul a creat grupul QA, a adăugat elevul demonstrativ, a reîncărcat pagina și a regăsit componența, a eliminat înscrierea, a actualizat descrierea și a readăugat elevul. Elevul a deschis aceeași grupă fără butoane de creare, editare sau componența celorlalți.
- API real: administratorul a creat o a doua grupă QA; aceasta nu apare în lista profesorului, iar încercările profesorului de editare și adăugare de membri răspund 403. Crearea sau modificarea de către elev răspunde 403; un cont de administrator ales drept elev este refuzat cu 400; versiunea veche cu 409; originea externă cu 403; accesul fără sesiune cu 401. Adăugarea repetată a aceluiași elev a păstrat exact o înscriere.
- Catalogul de elevi nu include emailurile, parolele, tokenurile sau metadatele Auth. Răspunsul elevului nu include catalogul sau ID-urile celorlalți membri. Descărcarea directă a obiectelor Storage a fost refuzată pentru anon, profesor, elev și administrator autentificat prin cheia publică.
- 9 teste noi trecute: creare cu proprietar verificat; roluri și drepturile proprietarului; adăugare/eliminare și duplicate; limita de 100; izolarea grupurilor și datelor; comenzi nesigure; paginarea catalogului și roluri administrative; revizii concurente; autentificare, origine publică prin proxy și limită HTTP. Total 72 de teste trecute; TypeScript și build de producție reușite.
- Componența și meniul verificate în RO/RU la 320, 640, 642, 820 și 1440 px: fără derulare orizontală, suprapuneri ale butoanelor sau controale care depășesc containerul. Formularul de editare a trecut și verificarea la 320 px. Viewportul a fost resetat după testare.

Limite MVP: cel mult 100 de elevi per grup; selectarea conturilor deja existente, fără invitații email sau conturi noi; fără ștergerea ori transferul grupului sau atribuirea lecțiilor. Pentru un volum mare de grupuri este recomandat un repository SQL indexat. Grupurile temporare QA se elimină după verificarea publicării, fără modificarea altor date.

## Continuitate și gruparea Investigație

- Ordinea principală pentru profesor/administrator: Puntea Edu, Expertiză, Continuitate, Trasee, Investigație. Cele șapte secțiuni de învățare sunt grupate în submeniu: Prezentare, Practici, Curs, Activități, Cohorte, AI Mentor, Experiența mea. Pagina Investigație oferă aceleași șapte destinații.
- Continuitate folosește progresul demonstrativ existent, fără resetare sau date Supabase noi. Verificat în browser: 0/3, următoarea etapă «Уточните цель», butonul «Продолжить маршрут» deschide `/#course` și extinde submeniul. Submeniul se poate închide/redeschide păstrând pagina curentă.
- Elevul a deschis Continuitate fără bara celor trei etape ale profesorului și cu acces la curs/exerciții; Investigație a afișat numai cele cinci destinații permise. Reîncărcarea directă a paginii Investigație a păstrat submeniul extins. Restricțiile pentru Trasee, AI Mentor și Experiența mea rămân active.
- Zece verificări responsive: RO/RU la 320, 640, 642, 820 și 1440 px, cu cinci butoane principale și șapte copii extinși, fără derulare orizontală sau suprapuneri ale butoanelor. Viewportul a fost resetat după verificări.
- Patru teste noi: structura principală/submeniul și păstrarea rutelor; afișarea următoarei etape pentru 0/3, 1/3, 2/3 și a finalizării 3/3; continuarea elevului fără etapele private ale profesorului; pagina Investigație limitată la destinațiile primite. Total 79 de teste trecute, TypeScript și build de producție reușite.


## Trasee: versiunea actualizată din consilier-formare (1), 08.11.2026

- Importate harta centrelor/competențelor, calendarele cursurilor, harta termică și suprapunerile între centre. CSS limitat la `.trasee-module`, font local, fără efecte asupra meniului general.
- API `GET /api/trasee/network`: cont profesor/administrator, catalog privat, răspuns fără cache; elevii și vizitatorii sunt respinși înainte de Storage. Panoul coordonatorului rămâne exclusiv administratorului.
- Sursa și catalogul Supabase au aceleași 124 de cursuri și 8 centre; comparație integrală JSON, fără rescrierea datelor sau a marcajelor personale.
- Verificate local: exemplu STEAM, recomandări, calendare, compararea a două cursuri, panoul administratorului cu 6 discipline cu ediții în paralel.
- Teste noi: derivarea rețelei din catalog, excluderea datelor aproximative/înscrierilor din calendar, suprapuneri reale la centre distincte, autorizarea noii rute.
