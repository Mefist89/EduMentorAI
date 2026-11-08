import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAccount } from "@/lib/auth";
import { LogoutButton } from "@/components/login-form";

export default async function AdminPage() {
  const account = await getAccount();
  if (!account) redirect("/login");
  if (account.role !== "administrator") redirect("/");
  return (
    <main className="admin-page">
      <header>
        <Link href="/">← Înapoi la platformă</Link>
        <LogoutButton />
      </header>
      <ShieldCheck size={36} />
      <p className="eyebrow">ADMINISTRARE</p>
      <h1>Acces și roluri</h1>
      <p>
        Fiecare cont primește accesul potrivit rolului său. Această pagină este
        disponibilă doar administratorului.
      </p>
      <section className="admin-role-grid" aria-label="Permisiunile rolurilor">
        <article className="panel">
          <h2>Administrator</h2>
          <p>Platforma completă și această zonă de administrare.</p>
        </article>
        <article className="panel">
          <h2>Profesor</h2>
          <p>Curs, mentor AI, activități pedagogice și fișe de reflecție.</p>
        </article>
        <article className="panel">
          <h2>Elev</h2>
          <p>
            Materialul cursului și nouă exerciții cu soluții, în trei niveluri.
          </p>
        </article>
      </section>
      <p className="admin-note">
        Conturile și parolele se gestionează în Supabase Authentication. Aici nu
        sunt afișate parole sau chei.
      </p>
    </main>
  );
}
