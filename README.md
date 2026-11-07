# EduMentor AI — prototip demonstrativ

Aplicație Next.js + TypeScript cu design violet, lavandă și coral. Traseul este pregătit pentru un profesor de matematică, clasa a VII-a, cu tema ecuațiilor de gradul I.

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

1. **Panou principal** — traseu cu progres real al interacțiunilor din demonstrație.
2. **Cursul meu** — material demonstrativ în trei secțiuni și trei răspunsuri de diagnostic pregătite. Apasă „Folosește acest exemplu”.
3. **AI Mentor** — alege întrebările pregătite pentru răspunsuri simulate. Butonul sursei deschide materialul cursului. Nu se apelează un model AI.
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

Preferința de limbă, diagnosticul activat, pașii explorați, starea fișei și reacția demonstrativă sunt păstrate în `localStorage`, cheia `edumentor-demo-v1`. Conversația este temporară și se reia la părăsirea ecranului sau reîncărcare. Textul exemplelor este comun și pregătit în cod; nu sunt colectate date personale. Dacă stocarea browserului este blocată, aplicația anunță că progresul va fi temporar. „Reia demonstrația” resetează doar acest demo, după confirmare. Nu folosi acest prototip pentru date reale sau sensibile.

## Organizare

- `src/app/` — aplicație, metadate, icon și stiluri responsive.
- `src/components/mentor-app.tsx` — navigare, panou principal și persistență.
- `src/components/learning-views.tsx` — curs, conversație, activități, reflecție și portofoliu.
- `src/components/ui.tsx` — elemente vizuale comune.
- `src/lib/demo.ts` — exemple bilingve, exerciții și validarea datelor locale.
- `src/utils/supabase/` — configurare și clienți Supabase pentru browser, server și sesiuni.
- `src/proxy.ts` — punctul de intrare pentru reîmprospătarea sesiunilor.
- `src/app/api/health/supabase/route.ts` — verificare de conectivitate la Supabase Auth.
- `tests/supabase.test.mjs` — verificări pentru cookie-uri, izolare între cereri și tratarea erorilor.

## Limite și continuare

Acesta este un MVP demonstrativ local cu integrarea de bază Supabase configurată. Integrarea OpenAI pe server, interfața de autentificare, autorizarea între profesori, schema și persistența fișelor în Supabase și documentele încărcate sunt etape următoare. Textele simulate nu reprezintă răspunsuri AI în timp real; aprobarea fișei nu validează independent eficiența pedagogică. Designul respectă paleta aleasă: `#6954B8`, `#EEEAF8`, `#F49A83`, `#F7F6FB`, `#FFFFFF`, `#242334`.

Fontul Manrope se încarcă de la Google Fonts; dacă nu există acces la internet se folosește Segoe UI sau Arial. Rularea demo-ului după instalarea dependențelor nu necesită un serviciu AI.

Documentație framework: [instalare Next.js](https://nextjs.org/docs/app/getting-started/installation).
