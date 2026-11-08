# Verificare locală

Data: 8 noiembrie 2026. Verificările au rulat pe buildul de producție, la `http://127.0.0.1:3000`, cu Chromium automatizat prin Playwright.

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
