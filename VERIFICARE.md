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

QA a folosit instrumentele locale de automatizare; acestea nu sunt dependențe ale aplicației. Prototipul nu a fost testat cu profesori reali și nu furnizează dovezi de impact pedagogic. Interfața de autentificare, schema aplicației, salvarea fișelor pe server și serviciile AI reale nu fac parte din această versiune demonstrativă.

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
