"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn, LoaderCircle, ShieldCheck } from "lucide-react";
import { signIn, signOut } from "@/app/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, { error: "" });
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="login-form">
      <div className="login-field">
        <label htmlFor="login">Login sau email</label>
        <input
          id="login"
          name="login"
          autoComplete="username"
          required
          maxLength={254}
          placeholder="Introdu loginul tău"
          spellCheck={false}
          autoCapitalize="none"
        />
      </div>
      <div className="login-field">
        <label htmlFor="password">Parolă</label>
        <div className="password-input">
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={256}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ascunde parola" : "Arată parola"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      {state.error && (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="auth-submit" type="submit" disabled={pending}>
        {pending ? (
          <LoaderCircle size={18} className="spinner" />
        ) : (
          <LogIn size={18} />
        )}{" "}
        {pending ? "Se verifică…" : "Conectează-te"}
      </button>
      <p className="auth-note">
        <ShieldCheck size={16} /> Rolul este atribuit de administrator contului
        tău.
      </p>
    </form>
  );
}

export function LogoutButton({ label = "Deconectare" }: { label?: string }) {
  const [state, action, pending] = useActionState(signOut, { error: "" });
  return (
    <form action={action} className="logout-form">
      <button type="submit" disabled={pending}>
        {pending ? "…" : label}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
