import { redirect } from "next/navigation";
import { BookOpen, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { getAccount } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Autentificare · EduMentor AI" };

export default async function LoginPage() {
  if (await getAccount()) redirect("/");
  return (
    <main className="auth-page">
      <section className="auth-story" aria-labelledby="welcome-title">
        <a href="/login" className="auth-brand">
          <span>E</span> EduMentor
        </a>
        <div>
          <p className="eyebrow">ÎNVĂȚARE · PRACTICĂ · COMUNITATE</p>
          <h1 id="welcome-title">
            Un loc pentru fiecare.
            <br />
            <em>Un pas înainte, împreună.</em>
          </h1>
          <p>
            Conectează-te la spațiul tău de învățare cu loginul și parola
            primite.
          </p>
        </div>
        <ul className="auth-roles">
          <li>
            <ShieldCheck />
            <span>
              <strong>Administrator</strong>Acces la platformă și la zona de
              administrare.
            </span>
          </li>
          <li>
            <Users />
            <span>
              <strong>Profesor</strong>Materiale, mentor AI, activități și
              reflecție.
            </span>
          </li>
          <li>
            <GraduationCap />
            <span>
              <strong>Elev</strong>Materiale de curs și exerciții pe niveluri.
            </span>
          </li>
        </ul>
        <p className="auth-story-footer">EduMentor AI · Moldova</p>
      </section>
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-card">
          <span className="auth-symbol">
            <BookOpen size={26} />
          </span>
          <p className="eyebrow">BINE AI REVENIT</p>
          <h2 id="login-title">Intră în contul tău</h2>
          <p className="auth-description">
            Continuă în ritmul tău. Spațiul potrivit se deschide după
            autentificare.
          </p>
          <LoginForm />
          <p className="auth-help">
            Nu ai datele de acces? Solicită-le administratorului platformei.
          </p>
        </div>
      </section>
    </main>
  );
}
